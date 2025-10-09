import { NextRequest, NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    
    console.log(`📄 Archive API called with params:`, {
      page,
      pageSize,
      startDate,
      endDate
    });
    
    // Validate parameters
    if (page < 1 || pageSize < 1 || pageSize > 50) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }
    
    // Validate date format if provided
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json(
        { error: 'Invalid startDate format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid endDate format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    
    // Get paginated content from Notion
    const result = await notionService.getPaginatedContent({
      page,
      pageSize,
      startDate,
      endDate
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
