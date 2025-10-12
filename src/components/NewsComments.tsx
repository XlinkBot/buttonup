'use client';

import { NComment } from '@/types/news';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, MessageCircle } from 'lucide-react';

interface NewsCommentsProps {
  comments: NComment[];
  isLoading?: boolean;
}

export default function NewsComments({ comments, isLoading }: NewsCommentsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-sm">加载评论中...</span>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          暂无评论
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          成为第一个发表评论的人
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        评论 ({comments.length})
      </h3>
      
      {comments.map((comment) => (
        <div key={comment.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
                💭
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  匿名用户
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: zhCN
                  })}
                </span>
              </div>
              
              <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-3">
                {comment.content}
              </p>
              
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span className="text-xs">0</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
