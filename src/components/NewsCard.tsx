'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NewsItem } from '@/types/news';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, ExternalLink, Flame, MessageCircle, Brain } from 'lucide-react';

interface NewsCardProps {
  news: NewsItem;
  showCategory?: boolean;
}

export default function NewsCard({ news, showCategory = true }: NewsCardProps) {
  const router = useRouter();
  const categoryInfo = news.category;


  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {showCategory && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`}>
              {categoryInfo}
            </span>
          )}
          {news.isHot && (
            <span className="flex items-center text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-medium">
              <Flame className="w-3 h-3 mr-1" />
              热点
            </span>
          )}
        </div>
        
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock className="w-3 h-3 mr-1" />
          {formatDistanceToNow(new Date(news.publishedAt), {
            addSuffix: true,
            locale: zhCN
          })}
        </div>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
        <Link href={`/news/${news.id}`}>
          {news.title}
        </Link>
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-3">
        {news.summary}
      </p>
      
      {/* 精选评论区域 */}
      {news.highlightComment && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {news.highlightComment}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            来源: {news.source}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {news.url && (
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              原文链接
            </a>
          )}
          <Link 
            href={`/news/${news.id}`}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1.5"
          >
            <Brain className="w-4 h-4" />
            <span>AI洞察</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
