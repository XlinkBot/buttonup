import { ContentItem } from '@/types/content';


/**
 * Fetch all content items from the backend
 */
export async function fetchAllContent(): Promise<ContentItem[]> {
  try {


    console.log("- Full API URL:", "/api/content");
    
    const response = await fetch("/api/content", {
      //next: { revalidate: 14400 } // 4 hours - 恢复缓存
    });
    if (!response.ok) {
      console.error(`Content API responded with status: ${response.status} with error: ${response.statusText}, apiUrl: ${apiUrl}, `);
      console.error(JSON.stringify(response,null,2))
      return [];
    }


    const result = await response.json();
    if (result.success && Array.isArray(result.data)) {
      return result.data;
    }
    


    console.error('Invalid content API response format');
    return [];
  } catch (error) {
    console.error('Error fetching content from API:', error);
    return [];
  }
}

/**
 * Fetch a specific content item by slug from the backend
 */
export async function fetchContentBySlug(slug: string): Promise<ContentItem | null> {
  try {
    const response = await fetch(`/api/content/${slug}`, {
     // next: { revalidate: 14400 } // 4 hours - 恢复缓存
    });
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      console.error(`Content API responded with status: ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    
    console.error('Invalid content API response format');
    return null;
  } catch (error) {
    console.error('Error fetching content from API:', error);
    return null;
  }
}
