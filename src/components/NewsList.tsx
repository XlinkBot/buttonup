
import { NewsItem } from '@/types/news';
import NewsCard from './NewsCard';

interface NewsListProps {
  news: NewsItem[];
  loading?: boolean;
}

export default function NewsList({ news, loading }: NewsListProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="flex items-center space-x-2 mb-3">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12"></div>
            </div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
            {/* 评论区域加载状态 */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📰</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          暂无新闻
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          今天还没有新闻更新，请稍后再来查看
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {news.map((item) => (
        <NewsCard 
          key={item.id} 
          news={item} 
        />
      ))}
    </div>
  );
}
