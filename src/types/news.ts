export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url?: string;
  publishedAt: string;
  source: string;
  category: 'market' | 'tech' | 'finance' | 'crypto' | 'startup';
  isHot?: boolean;
}

export interface NewsResponse {
  news: NewsItem[];
  total: number;
  lastUpdated: string;
}

// Mock数据已移除，现在使用Notion数据库作为数据源
// 通过 /api/news 接口获取实时新闻数据
