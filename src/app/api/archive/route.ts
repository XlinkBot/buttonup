import { NextRequest, NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';

// 由于使用了searchParams，需要设置为动态路由
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Use nextUrl instead of request.url to avoid dynamic server usage
    const { searchParams } = request.nextUrl;
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const tag = searchParams.get('tag') || undefined;
    const cursor = searchParams.get('cursor') || undefined;
    
    console.log(`📄 Archive API called with params:`, {
      page,
      pageSize,
      tag,
      cursor
    });
    
    // Validate parameters
    if (page < 1 || pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }
    
    // Get paginated content from Notion
    const result = await notionService.getPaginatedContent({
      page,
      pageSize,
      tag,
      cursor
    });
    
    console.log(`✅ Archive API returning ${result.items.length} items`);
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Archive API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch archive content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Enable ISR for archive API
export const revalidate = 300; // 5 minutes
