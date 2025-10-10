import { NextRequest, NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';
import { NewsResponse } from '@/types/news';

// Enable caching and ISR
export const revalidate = 300; // 5 minutes in seconds

/**
 * GET /api/news
 * Fetch news items from Notion news database
 * Query parameters:
 * - page: page number (default: 1)
 * - pageSize: items per page (default: 10)
 * - category: filter by category (optional)
 * - isHot: filter by hot news (optional)
 */
export async function GET(request: NextRequest) {
  console.log('🔌 API: Fetching news...');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const category = searchParams.get('category') || undefined;
    const isHotParam = searchParams.get('isHot');
    const isHot = isHotParam ? isHotParam === 'true' : undefined;
    
    console.log(`📰 API: Getting news with params:`, { page, pageSize, category, isHot });
    
    const result = await notionService.getNewsList({
      page,
      pageSize,
      category,
      isHot
    });
    
    console.log(`✅ API: Successfully fetched ${result.items.length} news items`);
    
    const response: NewsResponse = {
      news: result.items,
      total: result.totalCount,
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: response,
      pagination: {
        currentPage: result.currentPage,
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pageSize
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ API: Error fetching news:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch news',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news
 * Revalidate news cache
 */
export async function POST() {
  console.log('🔌 API: Revalidating news cache...');
  
  try {
    notionService.invalidateNewsCache();
    
    return NextResponse.json({
      success: true,
      message: 'News cache invalidated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ API: Error invalidating news cache:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to invalidate news cache',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
