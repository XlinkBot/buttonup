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


