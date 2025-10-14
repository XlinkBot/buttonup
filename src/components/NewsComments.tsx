'use client';

import { NComment } from '@/types/news';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface NewsCommentsProps {
  comments: NComment[];
  isLoading?: boolean;
}

interface CommentItemProps {
  comment: NComment;
  depth?: number;
}

function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  
  const replies = comment.replies || [];
  const visibleReplies = showAllReplies ? replies : replies.slice(0, 2);
  const hasMoreReplies = replies.length > 2;
  
  return (
    <div className={`${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''}`}>
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-3">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
              {depth === 0 ? '💭' : '↳'}
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                {comment.author?.name || '匿名用户'}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: zhCN
                })}
              </span>
              {comment.author?.type === 'integration' && (
                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                  Bot
                </span>
              )}
            </div>
            
            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-3">
              {comment.content}
            </p>
            
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                <Heart className="w-4 h-4" />
                <span className="text-xs">0</span>
              </button>
              
              {replies.length > 0 && (
                <div className="flex items-center space-x-1 text-gray-500 text-xs">
                  <MessageCircle className="w-3 h-3" />
                  <span>{replies.length} 回复</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 嵌套回复 */}
      {visibleReplies.length > 0 && (
        <div className="space-y-2">
          {visibleReplies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
          ))}
        </div>
      )}
      
      {/* 展开/收起更多回复按钮 */}
      {hasMoreReplies && (
        <button
          onClick={() => setShowAllReplies(!showAllReplies)}
          className="ml-6 mt-2 flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {showAllReplies ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>收起回复</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>查看更多 {replies.length - 2} 条回复</span>
            </>
          )}
        </button>
      )}
    </div>
  );
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

  // 计算总评论数（包括回复）
  const getTotalCommentCount = (comments: NComment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? getTotalCommentCount(comment.replies) : 0);
    }, 0);
  };

  const totalComments = getTotalCommentCount(comments);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        评论 ({totalComments})
      </h3>
      
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
