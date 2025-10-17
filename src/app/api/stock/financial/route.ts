import { NextRequest, NextResponse } from 'next/server';
import { getFinancialReport } from '@/lib/stock-analysis';
import type { ApiResponse, FinancialReportResponse } from '@/types/stock';

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

    const data = await getFinancialReport(symbol);

    return NextResponse.json(
      { success: true, data, timestamp: Date.now() } as ApiResponse<FinancialReportResponse>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in financial endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FINANCIAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to fetch financial data',
        },
        timestamp: Date.now(),
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
