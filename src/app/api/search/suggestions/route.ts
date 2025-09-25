import { NextRequest, NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';
import { ContentItem } from '@/types/content';

// Enable caching
export const revalidate = 300; // 5 minutes

export interface SearchSuggestion {
  type: 'title' | 'tag' | 'content';
  value: string;
  label: string;
  slug?: string;
  count?: number;
}

/**
 * GET /api/search/suggestions?q=query
 * Get search suggestions based on user input
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query || query.trim().length < 2) {
    return NextResponse.json({
      success: true,
      data: [],
      message: 'Query too short'
    });
  }

  try {
    console.log(`🔍 API: Generating search suggestions for: "${query}"`);
    
    // Use Notion's native search API for better performance
    const searchResults = await notionService.searchContent(query, {
      filter: 'page',
      pageSize: 10 // Small page size for fast suggestions
    });
    
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase().trim();
    
    // Track seen suggestions to avoid duplicates
    const seenSuggestions = new Set<string>();
    
    // 1. Direct title matches from search results (highest priority)
    searchResults.forEach(item => {
      const key = `title:${item.title}`;
      if (!seenSuggestions.has(key)) {
        suggestions.push({
          type: 'title',
          value: item.title,
          label: item.title,
          slug: item.slug
        });
        seenSuggestions.add(key);
      }
    });

    // 2. Get additional content for tag analysis if we need more suggestions
    if (suggestions.length < 6) {
      // Get a broader search for tag analysis
      const allContent = searchResults.length > 0 ? searchResults : await notionService.getSimpleContentList();
      
      // Extract tag matches
      const tagMatches = new Map<string, number>();
      allContent.forEach(item => {
        if (item.tags) {
          item.tags.forEach(tag => {
            if (tag.toLowerCase().includes(queryLower)) {
              tagMatches.set(tag, (tagMatches.get(tag) || 0) + 1);
            }
          });
        }
      });
      
      // Sort tags by frequency and add to suggestions
      Array.from(tagMatches.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3) // Limit to top 3 tag matches
        .forEach(([tag, count]) => {
          const key = `tag:${tag}`;
          if (!seenSuggestions.has(key)) {
            suggestions.push({
              type: 'tag',
              value: tag,
              label: tag,
              count
            });
            seenSuggestions.add(key);
          }
        });

      // 3. Content matches from excerpt (lowest priority)
      allContent
        .filter(item => 
          item.excerpt.toLowerCase().includes(queryLower) && 
          !item.title.toLowerCase().includes(queryLower) // Exclude already matched titles
        )
        .slice(0, 2) // Limit to top 2 content matches
        .forEach(item => {
          const key = `content:${item.title}`;
          if (!seenSuggestions.has(key)) {
            suggestions.push({
              type: 'content',
              value: item.title,
              label: `"${query}" in ${item.title}`,
              slug: item.slug
            });
            seenSuggestions.add(key);
          }
        });
    }

    // Limit total suggestions
    const finalSuggestions = suggestions.slice(0, 8);
    
    console.log(`✅ API: Generated ${finalSuggestions.length} suggestions for: "${query}" using Notion search`);
    
    return NextResponse.json({
      success: true,
      data: finalSuggestions,
      query,
      timestamp: new Date().toISOString(),
      searchMethod: 'notion-native' // Indicate we're using Notion's native search
    });

  } catch (error) {
    console.error('❌ API: Error generating search suggestions:', error);
    
    // Provide fallback with helpful message based on Notion's limitations
    return NextResponse.json(
      { 
        success: false,
        error: 'Search temporarily unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
        fallbackSuggestion: 'Try refreshing or using different keywords',
        searchMethod: 'failed'
      },
      { status: 500 }
    );
  }
}
