import { NextRequest, NextResponse } from 'next/server';
import { getStockQuote } from '@/lib/stock-analysis';
import type { ApiResponse, RealTimeQuote } from '@/types/stock';

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

    const data = await getStockQuote(symbol);

    return NextResponse.json(
      { success: true, data, timestamp: Date.now() } as ApiResponse<RealTimeQuote>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in quote endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'QUOTE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch quote',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
