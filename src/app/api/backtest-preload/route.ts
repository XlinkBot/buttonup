import { NextRequest, NextResponse } from 'next/server';
import { redisBacktestCache as backtestDataCache } from '@/lib/redis-backtest-cache';

const STRATEGY_CONFIGS = {
  aggressive: {
    stockPool: ['300750', '002594', '002475', '300059', '000725', '002415', '300142', '002230'],
  },
  balanced: {
    stockPool: ['600519', '000858', '600036', '000001', '600000', '600887', '000002', '600276'],
  },
  conservative: {
    stockPool: ['601398', '601318', '600900', '600028', '601288', '600104'],
  },
};

// POST 方法用于预加载回测数据
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { startTime, endTime } = body;

    if (!startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: 'Missing startTime or endTime' },
        { status: 400 }
      );
    }

    // 获取所有策略的股票池
    const allSymbols = [
      ...STRATEGY_CONFIGS.aggressive.stockPool,
      ...STRATEGY_CONFIGS.balanced.stockPool,
      ...STRATEGY_CONFIGS.conservative.stockPool,
    ];
    const uniqueSymbols = [...new Set(allSymbols)];

    console.log(`🔄 Starting backtest data preload for ${uniqueSymbols.length} stocks`);
    console.log(`📅 Time range: ${new Date(startTime).toISOString()} - ${new Date(endTime).toISOString()}`);

    // 预加载所有数据
    await backtestDataCache.loadAllData(uniqueSymbols, startTime, endTime);

    // 获取加载统计
    const stats = await backtestDataCache.getLoadStats();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Backtest data preloaded successfully',
        stats: {
          symbolsCount: stats.symbolsCount,
          totalQuotes: stats.totalQuotes,
          totalIndicators: stats.totalIndicators,
          loadTimeMs: stats.loadTime,
        },
      },
    });

  } catch (error) {
    console.error('Backtest data preload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to preload backtest data' },
      { status: 500 }
    );
  }
}

// GET 方法用于检查缓存状态
export async function GET(): Promise<NextResponse> {
  try {
    const isLoaded = await backtestDataCache.isDataLoaded();
    const stats = await backtestDataCache.getLoadStats();

    return NextResponse.json({
      success: true,
      data: {
        isLoaded,
        stats: {
          symbolsCount: stats.symbolsCount,
          totalQuotes: stats.totalQuotes,
          totalIndicators: stats.totalIndicators,
          loadTimeMs: stats.loadTime,
        },
      },
    });

  } catch (error) {
    console.error('Cache status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check cache status' },
      { status: 500 }
    );
  }
}

// DELETE 方法用于清理缓存
export async function DELETE(): Promise<NextResponse> {
  try {
    await backtestDataCache.clear();

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    });

  } catch (error) {
    console.error('Cache clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
