// 竞技场交易策略模块 - Unified Strategy Management

import type {StrategyConfig, PlayerState, Position } from '@/types/arena';

import type { RealTimeQuote, TechIndicatorsResponse } from '@/types/stock';

// 交易决策接口
export interface TradingDecision {
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  confidence: number;
  reasoning: string;
}

// 策略决策器接口
export interface StrategyDecisionEngine {
  makeDecision(
    player: PlayerState,
    stockQuote: RealTimeQuote,
    techIndicators: TechIndicatorsResponse | undefined,
    comprehensiveAnalysis: {
      price: RealTimeQuote | null;
      technical: Record<string, unknown>;
      advanced: Record<string, unknown>;
      fundamental: Record<string, unknown>;
      sentiment: Record<string, unknown>;
    }
  ): Promise<TradingDecision>;
}
// 技术指标策略决策器（稳健/保守）
export class TechnicalStrategyEngine implements StrategyDecisionEngine {
  private config: StrategyConfig;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  async makeDecision(
    player: PlayerState,
    stockQuote: RealTimeQuote,
    techIndicators: TechIndicatorsResponse | undefined,
    comprehensiveAnalysis: {
      price: RealTimeQuote | null;
      technical: Record<string, unknown>;
      advanced: Record<string, unknown>;
      fundamental: Record<string, unknown>;
      sentiment: Record<string, unknown>;
    }
  ): Promise<TradingDecision> {
    const currentPosition = player.portfolio.find((p: Position) => p.symbol === stockQuote.symbol);
    const hasPosition = currentPosition && currentPosition.quantity > 0;

    // 获取技术指标
    const rsi = techIndicators?.indicators[techIndicators.indicators.length - 1]?.rsi;
    const price = stockQuote.price;
    const changePercent = stockQuote.changePercent;
    const advanced = comprehensiveAnalysis?.advanced;
    const fundamental = comprehensiveAnalysis?.fundamental;
    const sentiment = comprehensiveAnalysis?.sentiment;

    // 计算买入和卖出信号
    let buySignals = 0;
    let sellSignals = 0;
    let totalSignals = 0;

    // 1. 价格动量信号
    if (changePercent > this.config.buyThreshold) {
      buySignals += 2;
      totalSignals += 2;
    } else if (changePercent > this.config.buyThreshold * 0.5) {
      buySignals += 1;
      totalSignals += 1;
    }

    if (changePercent < this.config.sellThreshold) {
      sellSignals += 2;
      totalSignals += 2;
    } else if (changePercent < this.config.sellThreshold * 0.5) {
      sellSignals += 1;
      totalSignals += 1;
    }

    // 2. RSI技术指标信号
    if (rsi !== undefined) {
      totalSignals += 2;
      if (rsi < this.config.rsiBuyThreshold) buySignals += 2;
      else if (rsi < this.config.rsiBuyThreshold + 10) buySignals += 1;

      if (rsi > this.config.rsiSellThreshold) sellSignals += 2;
      else if (rsi > this.config.rsiSellThreshold - 10) sellSignals += 1;
    }

    // 3. 支撑阻力位信号
    if (advanced?.support && typeof advanced.support === 'number' && price <= advanced.support * 1.02) {
      buySignals += 1;
      totalSignals += 1;
    }
    if (advanced?.resistance && typeof advanced.resistance === 'number' && price >= advanced.resistance * 0.98) {
      sellSignals += 1;
      totalSignals += 1;
    }

    // 4. 基本面信号
    const fundamentalData = fundamental?.fundamentalData as Record<string, unknown> | undefined;
    if (fundamentalData?.returnOnEquity && typeof fundamentalData.returnOnEquity === 'number' && fundamentalData.returnOnEquity > 0.10) {
      buySignals += 1;
      totalSignals += 1;
    }
    if (fundamentalData?.debtToEquity && typeof fundamentalData.debtToEquity === 'number' && fundamentalData.debtToEquity > 0.80 && fundamentalData.debtToEquity > 1) {
      sellSignals += 1;
      totalSignals += 1;
    }

    // 5. 市场情绪信号
    if (sentiment?.analystRating === 'buy') {
      buySignals += 1;
      totalSignals += 1;
    }
    if (sentiment?.analystRating === 'sell') {
      sellSignals += 1;
      totalSignals += 1;
    }

    // 如果没有信号，给一些基础信号
    if (totalSignals === 0) {
      if (changePercent > this.config.buyThreshold * 0.5) {
        buySignals = 1;
      } else if (changePercent < this.config.sellThreshold * 0.5) {
        sellSignals = 1;
      }
      totalSignals = 1;
    }

    const buyRatio = totalSignals > 0 ? buySignals / totalSignals : 0;
    const sellRatio = totalSignals > 0 ? sellSignals / totalSignals : 0;

    // 做出决策
    const minCashRequired = price * 100;

    if (buySignals > 0 && buyRatio >= this.config.signalSensitivity && !hasPosition && player.cash > minCashRequired) {
      const buyQuantity = Math.min(
        Math.floor(player.cash * this.config.positionSize / price / 1.001),
        this.config.maxShares
      );

      return {
        action: 'buy',
        quantity: Math.max(buyQuantity, 100),
        confidence: Math.min(90, 60 + buySignals * 10),
        reasoning: `[${this.config.name.toUpperCase()}] 买入信号(${buySignals}/${totalSignals}, 阈值:${this.config.signalSensitivity})，涨跌: ${changePercent.toFixed(2)}%，RSI: ${rsi?.toFixed(1) || 'N/A'}`,
      };
    } else if (sellSignals > 0 && sellRatio >= this.config.signalSensitivity && hasPosition) {
      const sellQuantity = currentPosition!.quantity;

      return {
        action: 'sell',
        quantity: sellQuantity,
        confidence: Math.min(85, 55 + sellSignals * 10),
        reasoning: `[${this.config.name.toUpperCase()}] 卖出信号(${sellSignals}/${totalSignals}, 阈值:${this.config.signalSensitivity})，涨跌: ${changePercent.toFixed(2)}%，RSI: ${rsi?.toFixed(1) || 'N/A'}`,
      };
    }

    return {
      action: 'hold',
      quantity: 0,
      confidence: 0,
      reasoning: `[${this.config.name.toUpperCase()}] 观望，涨跌: ${changePercent.toFixed(1)}%，买入信号: ${buySignals}/${totalSignals}(需${(this.config.signalSensitivity * 100).toFixed(0)}%)，卖出信号: ${sellSignals}/${totalSignals}(需${(this.config.signalSensitivity * 100).toFixed(0)}%)`,
    };
  }
}
