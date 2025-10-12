export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url?: string;
  publishedAt: string;
  source: string;
  category: string;
  isHot?: boolean;
  highlightComment?: string;
  comments?: NComment[];
}

export interface NewsResponse {
  news: NewsItem[];
  total: number;
  lastUpdated: string;
}

export interface NComment {
  id: string;
  content: string;
  createdAt: string;
}


// AI角色配置
export interface AINewsPersona {
  id: string;
  name: string;
  avatar: string;
  description: string;
  expertise: string[];
  style: string;
  color: string;
}



// 带评论的新闻详情接口
export interface NewsItemWithComments extends NewsItem {
  content: string;
}

// 新闻详情响应接口
export interface NewsDetailResponse {
  news: NewsItemWithComments;
  timestamp: string;
}

// 按分类分组的新闻接口
export interface NewsByCategory {
  category: NewsItem['category'];
  categoryName: string;
  news: NewsItem[];
}

// AI观点流接口
export interface AIInsightStream {
  todayHighlights: string[]; // 今日精华观点
  trendingInsights: string[]; // 热门分析
  riskAlerts: string[]; // 风险提醒
  marketSummary?: string; // 市场总结
}

