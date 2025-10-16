import { NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';

export async function GET() {
  try {
    console.log('🏷️ Tags API called');
    
    const tags = await notionService.getAllTags();
    
    console.log(`✅ Tags API returning ${tags.length} tags`);
    
    return NextResponse.json({
      success: true,
      data: tags,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Tags API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch tags',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Enable ISR for tags API
export const revalidate = 600; // 10 minutes
