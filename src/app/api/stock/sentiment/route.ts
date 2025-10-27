import { NextRequest, NextResponse } from 'next/server';
import { getMarketSentiment } from '@/lib/stock-analysis';
import type { ApiResponse, MarketSentiment } from '@/types/stock';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const symbol = request.nextUrl.searchParams.get('symbol');

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

    const data = await getMarketSentiment(symbol);

    return NextResponse.json(
      { success: true, data: data as unknown as MarketSentiment, timestamp: Date.now() } as ApiResponse<MarketSentiment>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in sentiment endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SENTIMENT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch sentiment data',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
