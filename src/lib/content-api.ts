import { ContentItem } from '@/types/content';

/**
 * Frontend helper for fetching content from the backend API
 * This abstracts away the API implementation details
 */

const getBaseUrl = () => {
  // For client-side requests, use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }

  // For server-side requests during development
  if (process.env.NODE_ENV === 'development') {
    // Check if we're in Vercel dev environment
    if (process.env.VERCEL_URL) {
      // Vercel dev runs on HTTP by default, not HTTPS
      return `http://${process.env.VERCEL_URL}`;
    }
    // Default local development
    return 'http://localhost:3000';
  }

  // For production builds
  if (process.env.VERCEL_URL) {
    // Production Vercel URLs use HTTPS
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Fallback
  return 'http://localhost:3000';
};

/**
 * Fetch all content items from the backend
 */
export async function fetchAllContent(): Promise<ContentItem[]> {
  try {
    const baseUrl = getBaseUrl();
    const isClientSide = typeof window !== 'undefined';
    const apiUrl = `${baseUrl}/api/content`;
    
    console.log("Environment Debug Info:");
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    console.log("- VERCEL_URL:", process.env.VERCEL_URL);
    console.log("- Client Side:", isClientSide);
    console.log("- Base URL:", baseUrl);
    console.log("- Full API URL:", apiUrl);
    
    const response = await fetch(apiUrl, {
      //next: { revalidate: 14400 } // 4 hours - 恢复缓存
    });
    if (!response.ok) {
      console.error(`Content API responded with status: ${response.status} with error: ${response.statusText}`);
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
