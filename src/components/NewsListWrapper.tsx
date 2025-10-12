'use client';

import { NewsItem } from '@/types/news';
import NewsList from './NewsList';

interface NewsListWrapperProps {
  news: NewsItem[];
  loading?: boolean;
}

export default function NewsListWrapper({ news, loading = false }: NewsListWrapperProps) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-4xl">
        <NewsList 
          news={news} 
          loading={loading}
        />
      </div>
    </div>
  );
}
