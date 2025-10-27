import { NextResponse } from 'next/server';
import { getBatchStockQuotes } from '@/lib/stock-analysis';
import { cache } from 'react';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type {
  Player,
  Trade,
  AssetHistory,
  PlayerAvatar,
  ExtendedPortfolio,
  TradingJudgment
} from '@/types/arena';



// 扩展的Player类型，包含当前价格信息（用于API返回）
interface ExtendedPlayer {
  id: string;
  name: string;
  strategyType: 'aggressive' | 'balanced' | 'conservative';
  cash: number;
  portfolio: ExtendedPortfolio[]; // 扩展的持仓信息
  trades: Trade[];
  tradingJudgments: TradingJudgment[]; // 最新的5个交易判断
  assetHistory: AssetHistory[];
  totalAssets: number;
  totalReturn: number;
  totalReturnPercent: number;
  isActive: boolean;
  avatar?: PlayerAvatar;
  lastUpdateTime: number;
}


// 缓存统计信息（使用Map避免并发问题）
const cacheStats = new Map<string, number>([
  ['playerCacheHits', 0],
  ['playerCacheMisses', 0],
  ['stockCacheHits', 0],
  ['stockCacheMisses', 0],
  ['totalRequests', 0],
]);

// 线程安全的缓存统计更新
function updateCacheStats(key: string, increment: number = 1) {
  const current = cacheStats.get(key) || 0;
  cacheStats.set(key, current + increment);
}


// 使用 React Cache 缓存玩家数据（10秒缓存）
const getCachedPlayers = cache(async (): Promise<Player[]> => {
  console.log('🔄 Fetching players from database...');
  updateCacheStats('playerCacheMisses');
  const players = await redisBacktestCache.getAllPlayers();
  
  return players;
});

// 移除市场指数数据获取（回测模式不需要实时市场指数）
// const getCachedMarketIndices = cache(async (): Promise<StockIndex[]> => {
//   // ... 市场指数查询代码已移除
//   return [];
// });

// 批量获取股票价格（使用新的批量接口）
async function getBatchStockPrices(symbols: string[]): Promise<{ [symbol: string]: number }> {
  if (symbols.length === 0) return {};
  
  try {
    console.log(`📈 Fetching prices for ${symbols.length} stocks:`, symbols);
    updateCacheStats('stockCacheMisses', symbols.length);
    
    // 使用新的批量接口
    const batchQuotes = await getBatchStockQuotes(symbols);
    
    const result: { [symbol: string]: number } = {};
    symbols.forEach(symbol => {
      const quote = batchQuotes.find(q => q.symbol === symbol);
      result[symbol] = quote ? quote.price : 0;
    });
    
    return result;
  } catch (error) {
    console.error('Error fetching batch stock prices:', error);
    // 返回默认值
    const result: { [symbol: string]: number } = {};
    symbols.forEach(symbol => {
      result[symbol] = 0;
    });
    return result;
  }
}

// 批量更新持仓价格（优化版本）
async function updatePortfolioPricesWithCache(players: Player[]): Promise<ExtendedPlayer[]> {
  // 收集所有需要获取价格的股票代码
  const allSymbols = new Set<string>();
  players.forEach(player => {
    player.portfolio.forEach(position => {
      allSymbols.add(position.symbol);
    });
  });
  
  // 批量获取所有股票价格
  const stockPrices = await getBatchStockPrices(Array.from(allSymbols));
  
  // 更新玩家持仓和计算总资产
  return players.map(player => {
    // 更新持仓价格并计算盈亏
    const extendedPortfolio: ExtendedPortfolio[] = player.portfolio.map(position => {
      const newPrice = stockPrices[position.symbol] || 0;
      
      // 计算新的盈亏
      const profitLoss = (newPrice - position.costPrice) * position.quantity;
      const profitLossPercent = newPrice > 0 ? ((newPrice - position.costPrice) / position.costPrice) * 100 : 0;
      
      return {
        symbol: position.symbol,
        stockName: position.stockName,
        quantity: position.quantity,
        costPrice: position.costPrice,
        currentPrice: Math.round(newPrice * 100) / 100,
        profitLoss: Math.round(profitLoss * 100) / 100,
        profitLossPercent: Math.round(profitLossPercent * 100) / 100,
      };
    });

    // 重新计算总资产
    const portfolioValue = extendedPortfolio.reduce((sum, pos) => {
      return sum + pos.currentPrice * pos.quantity;
    }, 0);
    
    const totalAssets = player.cash + portfolioValue;
    
    // 使用Redis中存储的totalReturn和totalReturnPercent，而不是重新计算
    const totalReturn = totalAssets - 100000;
    const totalReturnPercent = player.totalReturnPercent !== undefined ? player.totalReturnPercent : (totalReturn / 100000) * 100;

    const extendedPlayer: ExtendedPlayer = {
      id: player.id,
      name: player.name,
      strategyType: player.strategyType,
      cash: player.cash,
      portfolio: extendedPortfolio,
      trades: player.trades,
      tradingJudgments: player.tradingJudgments.slice(-5), // 最新的5个交易判断
      assetHistory: player.assetHistory,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
      isActive: player.isActive,
      avatar: player.avatar,
      lastUpdateTime: player.lastUpdateTime,
    };

    return extendedPlayer;
  });
}

// GET方法用于获取当前状态（优化版本）
export async function GET(): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    updateCacheStats('totalRequests');
    
    // 获取缓存的数据（回测模式不需要市场指数）
    const players = await getCachedPlayers();
    
    // 更新持仓价格并重新计算总资产
    const extendedPlayers = await updatePortfolioPricesWithCache(players);

    const endTime = Date.now();
    const processingTime = endTime - startTime;
    
    console.log(`⚡ Arena API processed in ${processingTime}ms for ${extendedPlayers.length} players`);

    return NextResponse.json({
      success: true,
      data: {
        players: extendedPlayers, // 包含扩展的持仓价格信息
        marketIndices: [], // 回测模式不需要市场指数
        lastUpdated: new Date(endTime).toISOString(),
        processingTime,
      },
    });
  } catch (error) {
    console.error('Arena data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch arena data' },
      { status: 500 }
    );
  }
}
