import { NextRequest, NextResponse } from 'next/server';
import { getEventsNews } from '@/lib/stock-analysis';
import type { ApiResponse, EventsNews } from '@/types/stock';

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

    const data = await getEventsNews(symbol);

    return NextResponse.json(
      { success: true, data, timestamp: Date.now() } as ApiResponse<EventsNews>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in events-news endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'EVENTS_NEWS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch events/news',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
