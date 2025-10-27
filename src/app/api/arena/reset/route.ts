import { NextResponse } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { Player } from '@/types/arena';

// POST 方法用于重置竞技场数据
export async function POST(): Promise<NextResponse> {
  try {
    console.log('🔄 开始重置竞技场数据...');
    
    // 使用Redis重置玩家数据
    const resetPlayers = await redisBacktestCache.resetPlayersData();
    
    console.log('✅ 竞技场数据重置完成');
    
    return NextResponse.json({
      success: true,
      message: '竞技场数据已重置：保留玩家信息，重置现金为100000，清空所有交易数据',
      data: {
        playersCount: resetPlayers.length,
        players: resetPlayers.map(p => ({
          id: p.id,
          name: p.name,
          strategyType: p.strategyType,
          cash: p.cash,
          totalAssets: p.totalAssets,
          totalReturn: p.totalReturn,
          totalReturnPercent: p.totalReturnPercent,
          portfolioCount: p.portfolio.length,
          tradesCount: p.trades.length,
          judgmentsCount: p.tradingJudgments.length,
          assetHistoryCount: p.assetHistory.length,
        })),
      },
    });
    
  } catch (error) {
    console.error('❌ 重置竞技场数据失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '重置竞技场数据失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// GET 方法用于查看当前Redis状态
export async function GET(): Promise<NextResponse> {
  try {
    const players = await redisBacktestCache.getAllPlayers();
    
    // 获取Redis缓存状态
    const cacheStats = await redisBacktestCache.getLoadStats();
    const isDataLoaded = await redisBacktestCache.isDataLoaded();
    
    // 获取各种数据类型的数量统计
    const dataStats = await getRedisDataStats();
    
    return NextResponse.json({
      success: true,
      message: '当前Redis状态',
      data: {
        // 玩家信息
        players: {
          count: players.length,
          details: players.map((p: Player) => ({
            id: p.id,
            name: p.name,
            strategyType: p.strategyType,
            cash: p.cash,
            totalAssets: p.totalAssets,
            totalReturn: p.totalReturn,
            totalReturnPercent: p.totalReturnPercent,
            portfolioCount: p.portfolio.length,
            tradesCount: p.trades.length,
            judgmentsCount: p.tradingJudgments.length,
            assetHistoryCount: p.assetHistory.length,
            lastUpdateTime: p.lastUpdateTime,
          })),
        },
        
        // Redis缓存状态
        cache: {
          isLoaded: isDataLoaded,
          loadTime: cacheStats.loadTime,
          symbolsCount: cacheStats.symbolsCount,
          totalQuotes: cacheStats.totalQuotes,
          totalIndicators: cacheStats.totalIndicators,
        },
        
        // Redis数据统计
        redisStats: dataStats,
        
        // 系统信息
        system: {
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    });
    
  } catch (error) {
    console.error('❌ 获取Redis状态失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '获取Redis状态失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 获取Redis数据统计
async function getRedisDataStats(): Promise<{
  totalKeys: number;
  keysByType: Record<string, number>;
  memoryUsage: string;
  keyDetails: Record<string, {
    type: string;
    ttl: number | string;
    memoryUsage: string;
  }>;
}> {
  try {
    // 这里我们需要访问Redis实例来获取统计信息
    // 由于redisBacktestCache没有暴露Redis实例，我们需要添加一个方法
    const stats = await redisBacktestCache.getRedisStats();
    return stats;
  } catch (error) {
    console.error('获取Redis统计失败:', error);
    return {
      totalKeys: 0,
      keysByType: {},
      memoryUsage: 'N/A',
      keyDetails: {},
    };
  }
}
