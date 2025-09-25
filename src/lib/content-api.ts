import { ContentItem } from '@/types/content';
import { notionService } from '@/lib/notion';

/**
 * Fetch all content items directly from the data source (server-side only)
 * 服务器端直接调用数据层，避免HTTP请求
 */
export async function fetchAllContent(): Promise<ContentItem[]> {
  try {
    console.log('🔍 服务器端直接获取内容...');
    
    const contentItems = await notionService.getSimpleContentList();
    
    console.log(`✅ 服务器端成功获取 ${contentItems.length} 条内容`);
    
    return contentItems;
  } catch (error) {
    console.error('❌ 服务器端获取内容失败:', error);
    return [];
  }
}



/**
 * Search content using the optimized search API
 * 使用优化的搜索API进行内容搜索
 */
export async function searchContent(params: {
  q?: string;
  tag?: string;
  start?: string;
  end?: string;
}): Promise<ContentItem[]> {
  try {
    console.log(`🔍 服务器端搜索内容:`, params);
    
    // Use direct service call instead of HTTP for server-side
    if (params.q && params.q.trim().length >= 2) {
      const searchResults = await notionService.searchContent(params.q, {
        filter: 'page',
        pageSize: 50
      });
      
      // Apply additional filters
      let filteredResults = searchResults;
      
      if (params.tag) {
        filteredResults = filteredResults.filter(item => 
          item.tags?.some(t => t.toLowerCase() === params.tag!.toLowerCase())
        );
      }
      
      if (params.start || params.end) {
        filteredResults = filteredResults.filter(item => {
          const itemDate = new Date(item.date);
          const startDate = params.start ? new Date(params.start) : null;
          const endDate = params.end ? new Date(params.end) : null;

          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });
      }
      
      console.log(`✅ 服务器端搜索成功: ${filteredResults.length} 条结果`);
      return filteredResults;
    } else {
      // For filter-only queries, get all content and filter
      const allContent = await fetchAllContent();
      let filteredResults = allContent;
      
      if (params.tag) {
        filteredResults = filteredResults.filter(item => 
          item.tags?.some(t => t.toLowerCase() === params.tag!.toLowerCase())
        );
      }
      
      if (params.start || params.end) {
        filteredResults = filteredResults.filter(item => {
          const itemDate = new Date(item.date);
          const startDate = params.start ? new Date(params.start) : null;
          const endDate = params.end ? new Date(params.end) : null;

          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });
      }
      
      return filteredResults;
    }
  } catch (error) {
    console.error('❌ 服务器端搜索失败:', error);
    return [];
  }
}

/**
 * Fetch a specific content item by slug directly from the data source (server-side only)
 * 服务器端直接通过slug获取内容
 */
export async function fetchContentBySlug(slug: string): Promise<ContentItem | null> {
  try {
    console.log(`🔍 服务器端直接获取内容: ${slug}`);
    
    const contentItem = await notionService.getContentBySlug(slug);
    
    if (contentItem) {
      console.log(`✅ 服务器端成功获取内容: ${contentItem.title}`);
    } else {
      console.log(`⚠️ 服务器端未找到内容: ${slug}`);
    }
    
    return contentItem;
  } catch (error) {
    console.error(`❌ 服务器端获取内容失败 (${slug}):`, error);
    return null;
  }
}


