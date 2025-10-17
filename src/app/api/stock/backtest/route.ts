import { NextRequest, NextResponse } from 'next/server';
import { runStrategyBacktest } from '@/lib/stock-analysis';
import type { ApiResponse, BacktestResult, BacktestStrategy } from '@/types/stock';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { symbol, strategy, startDate, endDate, initialCapital } = body;

    if (!symbol || !strategy) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_PARAMS', message: 'symbol and strategy are required' },
          timestamp: Date.now(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const capital = initialCapital || 10000;

    const data = await runStrategyBacktest(symbol, strategy as BacktestStrategy, start, end, capital);

    return NextResponse.json(
      { success: true, data, timestamp: Date.now() } as ApiResponse<BacktestResult>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in backtest endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BACKTEST_ERROR',
          message: error instanceof Error ? error.message : 'Failed to run backtest',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
