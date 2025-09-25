import { NextRequest, NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';

// Enable caching with shorter duration for search results
export const revalidate = 60; // 1 minute cache for search results

/**
 * GET /api/search?q=query&tag=tag&start=date&end=date
 * Full search endpoint using Notion's native search
 * Optimized based on Notion API recommendations
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const tag = searchParams.get('tag');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  console.log(`🔍 Search API: q="${query}", tag="${tag}", date range: ${start} to ${end}`);

  try {
    let searchResults;

    if (query && query.trim().length >= 2) {
      // Use Notion's native search for text queries
      console.log(`🔍 Using Notion native search for: "${query}"`);
      searchResults = await notionService.searchContent(query, {
        filter: 'page',
        pageSize: 50 // Moderate page size as per Notion recommendations
      });
    } else {
      // Fallback to getting all content for filtering-only queries
      console.log(`🔍 Using full content list for filtering`);
      searchResults = await notionService.getSimpleContentList();
    }

    // Apply additional filters
    let filteredResults = searchResults;

    // Tag filtering
    if (tag) {
      filteredResults = filteredResults.filter(item => 
        item.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
      );
    }

    // Date range filtering
    if (start || end) {
      filteredResults = filteredResults.filter(item => {
        const itemDate = new Date(item.date);
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;

        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    // Additional text filtering if query exists but Notion search didn't catch everything
    if (query && query.trim().length >= 2) {
      const queryLower = query.toLowerCase();
      
      // If Notion search returned few results, supplement with local filtering
      if (searchResults.length < 5) {
        console.log(`🔍 Supplementing with local search due to few results`);
        const allContent = await notionService.getSimpleContentList();
        const localMatches = allContent.filter(item => 
          item.title.toLowerCase().includes(queryLower) ||
          item.content.toLowerCase().includes(queryLower) ||
          item.excerpt.toLowerCase().includes(queryLower)
        );
        
        // Merge and deduplicate
        const combinedResults = [...searchResults];
        localMatches.forEach(item => {
          if (!combinedResults.find(existing => existing.id === item.id)) {
            combinedResults.push(item);
          }
        });
        
        filteredResults = combinedResults;
      }
    }

    // Sort by relevance and date
    filteredResults.sort((a, b) => {
      // If there's a query, prioritize title matches
      if (query) {
        const queryLower = query.toLowerCase();
        const aTitle = a.title.toLowerCase().includes(queryLower);
        const bTitle = b.title.toLowerCase().includes(queryLower);
        
        if (aTitle && !bTitle) return -1;
        if (!aTitle && bTitle) return 1;
      }
      
      // Then sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const hasFilters = query || tag || start || end;
    const searchMethod = query && query.trim().length >= 2 ? 'notion-native' : 'full-content';

    console.log(`✅ Search completed: ${filteredResults.length} results using ${searchMethod}`);

    return NextResponse.json({
      success: true,
      data: filteredResults,
      count: filteredResults.length,
      filters: {
        query: query || null,
        tag: tag || null,
        dateRange: (start || end) ? { start, end } : null
      },
      hasFilters,
      searchMethod,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Search API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Please try again or use different search terms',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}