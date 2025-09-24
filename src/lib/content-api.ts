import { ContentItem } from '@/types/content';

/**
 * Frontend helper for fetching content from the backend API
 * This abstracts away the API implementation details
 */

const getBaseUrl = () => {
  // Use different base URLs for different environments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return 'http://localhost:3000';
};

/**
 * Fetch all content items from the backend
 */
export async function fetchAllContent(): Promise<ContentItem[]> {
  try {
    const baseUrl = getBaseUrl();
    console.log("start to fetch api/content")
    const response = await fetch(`${baseUrl}/api/content`, {
      //next: { revalidate: 14400 } // 4 hours - 恢复缓存
    });
    if (!response.ok) {
      console.error(`Content API responded with status: ${response.status}`);
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
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/content/${slug}`, {
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
