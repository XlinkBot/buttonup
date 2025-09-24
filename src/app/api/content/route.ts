import { NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';
import { ContentItem } from '@/types/content';

// Enable caching and ISR
export const revalidate = 300; // 5m in seconds

/**
 * GET /api/content
 * Fetch all content items from the backend storage (currently Notion)
 */
export async function GET() {
  console.log('🔌 API: Fetching all content...');
  
  try {
    const contentItems: ContentItem[] = await notionService.getSimpleContentList(); // 启用缓存
    
    console.log(`✅ API: Successfully fetched ${contentItems.length} content items`);
    
    return NextResponse.json({
      success: true,
      data: contentItems,
      count: contentItems.length,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('❌ API: Error fetching content:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
