import { NextRequest, NextResponse } from 'next/server';
import { getBasicInfo } from '@/lib/stock-analysis';
import type { ApiResponse, BasicInfo } from '@/types/stock';

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

    const data = await getBasicInfo(symbol);

    return NextResponse.json(
      {
        success: true,
        data,
        timestamp: Date.now(),
      } as ApiResponse<BasicInfo>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in basic-info endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BASIC_INFO_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch basic info',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
