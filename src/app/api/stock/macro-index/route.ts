import { NextRequest, NextResponse } from 'next/server';
import { getMacroIndex } from '@/lib/stock-analysis';
import type { ApiResponse, MacroIndex } from '@/types/stock';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const indexSymbol = request.nextUrl.searchParams.get('indexSymbol');

    if (!indexSymbol) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'MISSING_INDEX', message: 'indexSymbol parameter is required' },
          timestamp: Date.now(),
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    const data = await getMacroIndex(indexSymbol);

    return NextResponse.json(
      { success: true, data, timestamp: Date.now() } as ApiResponse<MacroIndex>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in macro-index endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MACRO_INDEX_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch macro index',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
