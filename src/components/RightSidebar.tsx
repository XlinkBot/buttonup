'use client';

import { Clock, Flame } from 'lucide-react';
import { NewsItem } from '@/types/news';
import { fetchHotNews } from '@/lib/news-api';
import { useState, useEffect } from 'react';

interface RightSidebarProps {
  stats?: {
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
  };
}

function NewsCard({ news }: { news: NewsItem }) {
  const timeAgo = (timestamp: string) => {
    const now = new Date();
    const newsTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - newsTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    return newsTime.toLocaleDateString('zh-CN');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'market': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'tech': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'finance': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'crypto': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'startup': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="hover:bg-gray-100 dark:hover:bg-gray-800 p-3 rounded-lg cursor-pointer transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 flex-1">
          {news.isHot && <Flame className="w-3 h-3 text-orange-500 inline mr-1" />}
          {news.title}
        </h4>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
        {news.summary}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(news.category)}`}>
            {news.source}
          </span>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          {timeAgo(news.publishedAt)}
        </div>
      </div>
    </div>
  );
}

export function RightSidebar({ stats }: RightSidebarProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取前6条热门新闻
        const newsData = await fetchHotNews(6);
        setNews(newsData);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch news');
        // 设置空数组作为fallback
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  return (
    <div className="space-y-4">
      {/* 实时新闻 */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            实时新闻
          </h3>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-2">
          {loading ? (
            // 加载状态
            <div className="space-y-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            // 错误状态
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                暂时无法加载新闻
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-xs text-orange-600 dark:text-orange-400 hover:underline mt-1"
              >
                点击重试
              </button>
            </div>
          ) : news.length === 0 ? (
            // 无数据状态
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                暂无新闻数据
              </p>
            </div>
          ) : (
            // 正常显示新闻
            news.map((item) => (
              <NewsCard key={item.id} news={item} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
