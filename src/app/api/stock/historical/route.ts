import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalData } from '@/lib/stock-analysis';
import type { ApiResponse, HistoricalDataResponse } from '@/types/stock';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const symbol = request.nextUrl.searchParams.get('symbol');
    const period = (request.nextUrl.searchParams.get('period') as 'daily' | 'weekly' | 'monthly') || 'daily';
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);

    if (!symbol) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_SYMBOL', message: 'Symbol parameter is required' },
          timestamp: Date.now(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const data = await getHistoricalData(symbol, period, days);

    return NextResponse.json(
      { success: true, data, timestamp: Date.now() } as ApiResponse<HistoricalDataResponse>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in historical endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'HISTORICAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch historical data',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
