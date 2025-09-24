export interface ContentItem {
  id: string;
  title: string;
  content: string;
  cover?: string;
  date: string;
  excerpt: string;
  slug: string;
  tags?: string[];
}

export interface SearchFilters {
  query?: string;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SubscriptionData {
  email: string;
  subscribedAt: string;
  isActive: boolean;
}