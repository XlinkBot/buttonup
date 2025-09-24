import { NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';

// Enable caching and ISR
//export const revalidate = 14400; // 4 hours in seconds

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}


/**
 * GET /api/content/[slug]
 * Fetch a specific content item by slug from the backend storage
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;
  console.log(`🔌 API: Fetching content for slug: ${slug}`);
  
  try {

    const content = await notionService.getContentBySlug(slug);

    if (!content) {
      console.log(`❌ API: Content not found for slug: ${slug}`);
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    console.log(`✅ API: Successfully fetched content: ${content.title}`);
    
    return NextResponse.json({
      success: true,
      data: content,
      timestamp: new Date().toISOString()
    // }, {
    //   headers: {
    //     'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    //   },
    });

  } catch (error) {
    console.error(`❌ API: Error fetching content for slug ${slug}:`, error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
