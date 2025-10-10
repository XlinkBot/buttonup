'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  className?: string;
}

export function Pagination({ currentPage, totalPages, basePath, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // 显示的页码数量
    
    if (totalPages <= showPages) {
      // 如果总页数小于等于显示页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 复杂的分页逻辑
      if (currentPage <= 3) {
        // 当前页在前面
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // 当前页在后面
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const getPageUrl = (page: number) => {
    if (page === 1) {
      return basePath;
    }
    return `${basePath}?page=${page}`;
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* 上一页按钮 */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          上一页
        </Link>
      ) : (
        <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed">
          <ChevronLeft className="w-4 h-4 mr-1" />
          上一页
        </div>
      )}

      {/* 页码 */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <div
                key={`ellipsis-${index}`}
                className="flex items-center justify-center w-10 h-10 text-gray-500 dark:text-gray-400"
              >
                <MoreHorizontal className="w-4 h-4" />
              </div>
            );
          }

          const pageNumber = page as number;
          const isCurrentPage = pageNumber === currentPage;

          return (
            <Link
              key={pageNumber}
              href={getPageUrl(pageNumber)}
              className={`flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                isCurrentPage
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {pageNumber}
            </Link>
          );
        })}
      </div>

      {/* 下一页按钮 */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          下一页
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      ) : (
        <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-not-allowed">
          下一页
          <ChevronRight className="w-4 h-4 ml-1" />
        </div>
      )}
    </div>
  );
}
