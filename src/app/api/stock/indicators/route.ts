import { NextRequest, NextResponse } from 'next/server';
import { getTechIndicators } from '@/lib/stock-analysis';
import type { ApiResponse, TechIndicatorsResponse } from '@/types/stock';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const symbol = request.nextUrl.searchParams.get('symbol');
    const period = request.nextUrl.searchParams.get('period') || 'daily';

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

    const data = await getTechIndicators(symbol, period);

    return NextResponse.json(
      { success: true, data, timestamp: Date.now() } as ApiResponse<TechIndicatorsResponse>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in indicators endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INDICATORS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch indicators',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
