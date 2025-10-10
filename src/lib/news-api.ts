import { NewsItem, NewsResponse } from '@/types/news';

export interface NewsApiOptions {
  page?: number;
  pageSize?: number;
  category?: string;
  isHot?: boolean;
}

export interface NewsApiResponse {
  success: boolean;
  data: NewsResponse;
  pagination: {
    currentPage: number;
    totalCount: number;
    hasMore: boolean;
    pageSize: number;
  };
  timestamp: string;
}

/**
 * Fetch news from the API
 * 从API获取新闻数据
 */
export async function fetchNews(options: NewsApiOptions = {}): Promise<NewsItem[]> {
  const searchParams = new URLSearchParams();
  
  if (options.page) searchParams.set('page', options.page.toString());
  if (options.pageSize) searchParams.set('pageSize', options.pageSize.toString());
  if (options.category) searchParams.set('category', options.category);
  if (options.isHot !== undefined) searchParams.set('isHot', options.isHot.toString());
  
  const url = `/api/news${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  console.log(`📰 Fetching news from: ${url}`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const result: NewsApiResponse = await response.json();
  
  if (!result.success || !result.data?.news) {
    throw new Error('Invalid response format');
  }
  
  return result.data.news;
}

/**
 * Fetch hot news (convenience function)
 * 获取热门新闻（便捷函数）
 */
export async function fetchHotNews(limit: number = 6): Promise<NewsItem[]> {
  return fetchNews({
    pageSize: limit,
    isHot: true
  });
}

/**
 * Fetch news by category
 * 按分类获取新闻
 */
export async function fetchNewsByCategory(
  category: NewsItem['category'], 
  limit: number = 10
): Promise<NewsItem[]> {
  return fetchNews({
    pageSize: limit,
    category
  });
}
