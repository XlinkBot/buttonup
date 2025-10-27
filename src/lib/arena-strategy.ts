// 竞技场交易策略模块 - Unified Strategy Management

import type { Player, Position, StrategyConfig, StrategyType } from '@/types/arena';

// Re-export StrategyConfig for backward compatibility
export type { StrategyConfig } from '@/types/arena';
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
    player: Player,
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

// 预定义策略配置
export const STRATEGY_CONFIGS: Record<StrategyType, StrategyConfig> = {
  aggressive: {
    name: '激进策略',
    description: '高风险高收益，频繁交易，随机决策',
    strategyType: 'aggressive',
    stockPool: ['300750', '002594', '002475', '300059', '300142', '002230'],
    buyThreshold: 0.3,
    sellThreshold: -0.3,
    positionSize: 0.30,
    maxShares: 250,
    signalSensitivity: 0.15,
    rsiBuyThreshold: 55,
    rsiSellThreshold: 55,
    isRandomTrade: true,
    randomBuyProbability: 0.7,
    randomSellProbability: 0.3,
  },
  balanced: {
    name: '稳健策略',
    description: '平衡风险收益，基于技术指标决策',
    strategyType: 'balanced',
    stockPool: ['600519', '000858', '600036', '000001', '600000', '600887', '000002', '600276'],
    buyThreshold: 2.0,
    sellThreshold: -1.5,
    positionSize: 0.15,
    maxShares: 150,
    signalSensitivity: 0.3,
    rsiBuyThreshold: 40,
    rsiSellThreshold: 65,
  },
  conservative: {
    name: '保守策略',
    description: '低风险稳健收益，严格技术指标过滤',
    strategyType: 'conservative',
    stockPool: ['601398', '601318', '600900', '600028', '601288', '600104', '000002', '600276'],
    buyThreshold: 3.0,
    sellThreshold: -2.0,
    positionSize: 0.10,
    maxShares: 100,
    signalSensitivity: 0.4,
    rsiBuyThreshold: 35,
    rsiSellThreshold: 70,
  }
};

// 激进策略决策器（随机交易）
export class AggressiveStrategyEngine implements StrategyDecisionEngine {
  private config: StrategyConfig;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  async makeDecision(
    player: Player,
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
    const currentPosition = player.portfolio.find(p => p.symbol === stockQuote.symbol);
    const hasPosition = currentPosition && currentPosition.quantity > 0;
    const price = stockQuote.price;
    const changePercent = stockQuote.changePercent;

    // 激进玩家：随机交易，不依赖技术指标
    const random = Math.random();
    const minCashRequired = price * 10; // 最小买入所需资金

    if (random > (1 - this.config.randomBuyProbability!) && player.cash > minCashRequired) {
      // 随机买入
      const buyQuantity = Math.min(
        Math.floor(player.cash * this.config.positionSize / price / 1.001),
        this.config.maxShares
      );

      return {
        action: 'buy',
        quantity: Math.max(buyQuantity, 100), // 至少100股
        confidence: Math.floor(Math.random() * 30) + 60,
        reasoning: `[AGGRESSIVE] 随机买入策略，价格=${price.toFixed(2)}，涨跌=${changePercent.toFixed(2)}%，持仓=${hasPosition ? '已持有，加仓' : '开仓'}`,
      };
    } else if (random <= this.config.randomSellProbability! && hasPosition) {
      // 随机卖出
      const sellQuantity = currentPosition!.quantity;

      return {
        action: 'sell',
        quantity: sellQuantity,
        confidence: Math.floor(Math.random() * 25) + 55,
        reasoning: `[AGGRESSIVE] 随机卖出策略，价格=${price.toFixed(2)}，涨跌=${changePercent.toFixed(2)}%，持仓=${currentPosition!.quantity}股`,
      };
    } else if (random > (1 - this.config.randomBuyProbability!) && player.cash <= minCashRequired) {
      return {
        action: 'hold',
        quantity: 0,
        confidence: 0,
        reasoning: `[AGGRESSIVE] 资金不足，无法买入，剩余资金=${player.cash.toFixed(2)}`,
      };
    }

    return {
      action: 'hold',
      quantity: 0,
      confidence: 0,
      reasoning: `[AGGRESSIVE] 观望，价格=${price.toFixed(2)}，涨跌=${changePercent.toFixed(2)}%`,
    };
  }
}

// 技术指标策略决策器（稳健/保守）
export class TechnicalStrategyEngine implements StrategyDecisionEngine {
  private config: StrategyConfig;

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  async makeDecision(
    player: Player,
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
    const currentPosition = player.portfolio.find(p => p.symbol === stockQuote.symbol);
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

// 策略工厂 - 根据策略类型创建对应的决策器
export function createStrategyEngine(strategyType: StrategyType, customConfig?: Partial<StrategyConfig>): StrategyDecisionEngine {
  let config = STRATEGY_CONFIGS[strategyType];

  // 如果有自定义配置，合并到现有配置
  if (customConfig) {
    config = {
      ...config,
      ...customConfig,
      name: config.name, // 保留原有名称
      description: config.description, // 保留原有描述
    };
  }

  if (config.isRandomTrade) {
    return new AggressiveStrategyEngine(config);
  } else {
    return new TechnicalStrategyEngine(config);
  }
}