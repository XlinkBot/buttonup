  'use client';

import { useState } from 'react';
import { ContentItem } from '@/types/content';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, ArrowRight, Loader2, Archive, AlertCircle } from 'lucide-react';
import TagFilter from './TagFilter';

interface ArchiveContentProps {
  initialData?: {
    items: ContentItem[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
    nextCursor?: string;
  };
}

export default function ArchiveContent({ initialData }: ArchiveContentProps) {
  const [content, setContent] = useState<ContentItem[]>(initialData?.items || []);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialData?.hasMore || false);
  const [totalCount, setTotalCount] = useState(initialData?.totalCount || 0);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialData?.nextCursor);
  
  // Filter states
  const [selectedTag, setSelectedTag] = useState<string | undefined>();

  const fetchContent = async (
    reset: boolean = false,
    filterTag?: string,
    cursor?: string
  ) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams({
        pageSize: '20' // Increase page size since we're not using traditional pagination
      });

      // Use provided parameters or fall back to state
      const actualTag = filterTag !== undefined ? filterTag : selectedTag;

      if (actualTag) params.append('tag', actualTag);
      if (cursor) params.append('cursor', cursor);

      console.log('🔍 Fetching with tag:', { actualTag, cursor, reset });

      const response = await fetch(`/api/archive?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch content');
      }

      const newData = result.data;

      if (reset) {
        setContent(newData.items);
      } else {
        setContent(prev => [...prev, ...newData.items]);
      }

      setHasMore(newData.hasMore);
      setNextCursor(newData.nextCursor);
      setTotalCount(prev => reset ? newData.items.length : prev + newData.items.length);

    } catch (err: unknown) {
      console.error('❌ Error fetching archive content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch content');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleTagChange = (newTag?: string) => {
    console.log('🔍 Tag filter changed:', { newTag });
    setSelectedTag(newTag);
    // Pass the new tag directly to fetchContent to avoid async state issue
    fetchContent(true, newTag);
  };

  const handleClearFilter = () => {
    console.log('🔍 Clearing tag filter');
    setSelectedTag(undefined);
    // Pass undefined tag directly to fetchContent
    fetchContent(true, undefined);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && nextCursor) {
      fetchContent(false, selectedTag, nextCursor);
    }
  };

  // Group content by date
  const groupedContent = content.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);

  const sortedDates = Object.keys(groupedContent).sort((a, b) => b.localeCompare(a));

  if (loading && content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    );
  }

  if (error && content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          加载失败
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
          {error}
        </p>
        <button
          onClick={() => fetchContent(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header with filters - Mobile Optimized */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            内容归档
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            共 {totalCount} 篇文章
            {selectedTag && (
              <span className="ml-2 text-orange-600 dark:text-orange-400">
                (已筛选)
              </span>
            )}
          </p>
        </div>
        
        {/* Filter - Full width on mobile */}
        <div className="flex justify-start">
          <TagFilter
            selectedTag={selectedTag}
            onTagChange={handleTagChange}
            onClear={handleClearFilter}
          />
        </div>
      </div>

      {/* Content */}
      {content.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            暂无内容
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {selectedTag ? '当前标签下没有找到内容' : '还没有发布任何内容'}
          </p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {sortedDates.map(date => (
            <div key={date} className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              {/* Date Header - Mobile Optimized */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400 mr-2" />
                  <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {format(parseISO(date), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
                  </span>
                  <span className="ml-2 sm:ml-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {groupedContent[date].length} 篇
                  </span>
                </div>
              </div>

              {/* Articles for this date - Mobile Optimized */}
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {groupedContent[date].map(item => (
                    <Link
                      key={item.id}
                      href={`/content/${item.slug}`}
                      className="block group"
                    >
                      <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 -m-3 sm:-m-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        {/* Cover Image - Responsive */}
                        {item.cover && (
                          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600">
                            <Image
                              src={item.cover}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              width={96}
                              height={96}
                            />
                          </div>
                        )}

                        {/* Content - Mobile Optimized */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors mb-2 line-clamp-2 text-sm sm:text-base leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-2 sm:mb-3 leading-relaxed">
                            {item.excerpt}
                          </p>
                          
                          {/* Tags - Mobile Optimized */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {item.tags.slice(0, 2).map(tag => (
                                <span
                                  key={tag}
                                  className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-0.5 sm:py-1 rounded-full font-medium"
                                >
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{item.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Arrow - Responsive */}
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button - Mobile Optimized */}
          {hasMore && (
            <div className="text-center pt-6 sm:pt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium w-full sm:w-auto"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    加载中...
                  </>
                ) : (
                  <>
                    加载更多
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* End message - Mobile Optimized */}
          {!hasMore && content.length > 0 && (
            <div className="text-center py-6 sm:py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                已显示全部 {totalCount} 篇文章
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
