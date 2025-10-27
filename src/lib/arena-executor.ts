// 竞技场交易执行器
// 负责将决策结果转换为实际交易和资产变更

import type { Player, Position, Trade } from '@/types/arena';
import type { RealTimeQuote } from '@/types/stock';
import type { StrategyConfig } from './arena-strategy';

// 交易执行结果
export interface ExecuteResult {
  updatedPlayer: Player;
  trade: Trade | null;
}

// 交易执行器类
export class ArenaExecutor {
  private config: StrategyConfig;
  private transactionFee = 0.001; // 0.1% 手续费
  private minQuantity = 100; // 最小买入数量

  constructor(config: StrategyConfig) {
    this.config = config;
  }

  // 执行交易决策
  executeDecision(
    player: Player,
    decision: {
      action: 'buy' | 'sell' | 'hold';
      quantity: number;
      confidence: number;
      reasoning: string;
    },
    stockQuote: RealTimeQuote,
    currentTime: number,
    judgmentId?: string,
    allStockQuotes: RealTimeQuote[] = []
  ): ExecuteResult {
    const currentPosition = player.portfolio.find(p => p.symbol === stockQuote.symbol);
    const hasPosition = currentPosition && currentPosition.quantity > 0;

    // 生成交易（如果有）
    const trade = this.generateTrade(
      player,
      decision,
      stockQuote,
      currentTime,
      currentPosition,
      judgmentId
    );

    // 更新持仓 - 需要传入所有股票的价格来计算盈亏
    const stockQuotesForUpdate = allStockQuotes.length > 0 ? allStockQuotes : [stockQuote];
    const updatedPortfolio = this.updatePortfolio(player, trade, stockQuotesForUpdate);

    // 更新现金
    let newCash = player.cash;
    if (trade) {
      if (trade.type === 'buy') {
        newCash -= trade.amount;
      } else {
        newCash += trade.amount;
      }
    }

    // 计算总资产
    const stockValue = updatedPortfolio.reduce((sum, pos) => {
      return sum + pos.currentPrice * pos.quantity;
    }, 0);

    const totalAssets = newCash + stockValue;
    const initialCapital = 100000;
    const totalReturn = totalAssets - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;

    // 更新玩家信息
    const updatedPlayer: Player = {
      ...player,
      cash: Math.round(newCash * 100) / 100,
      portfolio: updatedPortfolio,
      trades: trade ? [...player.trades, trade] : player.trades,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      lastUpdateTime: currentTime,
    };

    return {
      updatedPlayer,
      trade,
    };
  }

  // 生成交易对象
  private generateTrade(
    player: Player,
    decision: { action: 'buy' | 'sell' | 'hold'; quantity: number },
    stockQuote: RealTimeQuote,
    currentTime: number,
    currentPosition: Position | undefined,
    judgmentId?: string
  ): Trade | null {
    if (decision.action === 'hold') {
      return null;
    }

    if (decision.action === 'buy') {
      const amount = decision.quantity * stockQuote.price * (1 + this.transactionFee);

      return {
        id: `trade_${player.id}_${currentTime}_${stockQuote.symbol}`,
        playerId: player.id,
        type: 'buy',
        symbol: stockQuote.symbol,
        stockName: stockQuote.symbol,
        price: stockQuote.price,
        quantity: decision.quantity,
        amount: Math.round(amount * 100) / 100,
        timestamp: currentTime,
        judgmentId,
      };
    } else {
      // 卖出
      const quantity = currentPosition?.quantity || 0;
      const amount = quantity * stockQuote.price * (1 - this.transactionFee);

      return {
        id: `trade_${player.id}_${currentTime}_${stockQuote.symbol}`,
        playerId: player.id,
        type: 'sell',
        symbol: stockQuote.symbol,
        stockName: stockQuote.symbol,
        price: stockQuote.price,
        quantity,
        amount: Math.round(amount * 100) / 100,
        timestamp: currentTime,
        judgmentId,
      };
    }
  }

  // 更新持仓（使用平均成本）
  private updatePortfolio(
    player: Player,
    trade: Trade | null,
    stockQuotes: RealTimeQuote | RealTimeQuote[]
  ): Position[] {
    // 如果是单个stockQuote，转换为数组
    const quotesArray = Array.isArray(stockQuotes) ? stockQuotes : [stockQuotes];
    return this.updatePortfolioWithTrade(player, trade, quotesArray);
  }

  // 使用平均成本更新持仓
  private updatePortfolioWithTrade(
    player: Player,
    trade: Trade | null,
    stockQuotes: RealTimeQuote[]
  ): Position[] {
    const portfolioMap = new Map<string, Position>();

    // 初始化现有持仓
    player.portfolio.forEach(position => {
      const currentQuote = stockQuotes.find(q => q.symbol === position.symbol);
      const currentPrice = currentQuote?.price || position.costPrice;
      const profitLoss = (currentPrice - position.costPrice) * position.quantity;
      const profitLossPercent = ((currentPrice - position.costPrice) / position.costPrice) * 100;

      portfolioMap.set(position.symbol, {
        ...position,
        currentPrice: Math.round(currentPrice * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      });
    });

    // 处理交易
    if (trade) {
      const existing = portfolioMap.get(trade.symbol);
      const currentQuote = stockQuotes.find(q => q.symbol === trade.symbol);

      if (trade.type === 'buy') {
        if (existing) {
          // 计算平均成本
          const totalQuantity = existing.quantity + trade.quantity;
          const totalCost = (existing.costPrice * existing.quantity) + (trade.price * trade.quantity);
          const averageCost = totalCost / totalQuantity;

          const currentPrice = currentQuote?.price || averageCost;
          const profitLoss = (currentPrice - averageCost) * totalQuantity;
          const profitLossPercent = ((currentPrice - averageCost) / averageCost) * 100;

          portfolioMap.set(trade.symbol, {
            symbol: trade.symbol,
            stockName: trade.stockName,
            quantity: totalQuantity,
            costPrice: Math.round(averageCost * 100) / 100,
            currentPrice: Math.round(currentPrice * 100) / 100,
            profitLoss: Math.round(profitLoss * 100) / 100,
            profitLossPercent: Math.round(profitLossPercent * 100) / 100,
          });
        } else {
          const currentPrice = currentQuote?.price || trade.price;
          const profitLoss = (currentPrice - trade.price) * trade.quantity;
          const profitLossPercent = ((currentPrice - trade.price) / trade.price) * 100;

          portfolioMap.set(trade.symbol, {
            symbol: trade.symbol,
            stockName: trade.stockName,
            quantity: trade.quantity,
            costPrice: trade.price,
            currentPrice: Math.round(currentPrice * 100) / 100,
            profitLoss: Math.round(profitLoss * 100) / 100,
            profitLossPercent: Math.round(profitLossPercent * 100) / 100,
          });
        }
      } else if (trade.type === 'sell') {
        if (existing) {
          const newQuantity = existing.quantity - trade.quantity;
          if (newQuantity > 0) {
            const currentPrice = currentQuote?.price || existing.costPrice;
            const profitLoss = (currentPrice - existing.costPrice) * newQuantity;
            const profitLossPercent = ((currentPrice - existing.costPrice) / existing.costPrice) * 100;

            portfolioMap.set(trade.symbol, {
              ...existing,
              quantity: newQuantity,
              currentPrice: Math.round(currentPrice * 100) / 100,
              profitLoss: Math.round(profitLoss * 100) / 100,
              profitLossPercent: Math.round(profitLossPercent * 100) / 100,
            });
          } else {
            portfolioMap.delete(trade.symbol);
          }
        }
      }
    }

    return Array.from(portfolioMap.values());
  }
}

