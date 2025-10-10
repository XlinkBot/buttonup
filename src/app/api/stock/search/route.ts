import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // 使用 yahoo-finance2 搜索股票
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0
    });

    // 过滤出股票结果
    const stocks = searchResults.quotes
      ?.filter(quote => 
        ('typeDisp' in quote && quote.typeDisp === 'Equity') || 
        ('symbol' in quote && quote.symbol) // 简化过滤条件，只要有 symbol 就认为是股票
      )
      ?.map(quote => ({
        symbol: 'symbol' in quote ? quote.symbol : '',
        shortname: 'shortname' in quote ? quote.shortname : ('longname' in quote ? quote.longname : ''),
        longname: 'longname' in quote ? quote.longname : '',
        exchange: 'exchange' in quote ? quote.exchange : '',
        quoteType: 'quoteType' in quote ? String(quote.quoteType) : '',
        market: 'market' in quote ? quote.market : ''
      })) || [];

    return NextResponse.json({
      stocks,
      query
    });

  } catch (error) {
    console.error('Error searching stocks:', error);
    return NextResponse.json(
      { error: 'Failed to search stocks' },
      { status: 500 }
    );
  }
}
