'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { MessageCircle, Repeat2, Heart, Share, Clock, TrendingUp, ExternalLink } from 'lucide-react';
// Actions removed - keeping component for reference
import { Post, Comment, PostWithComments } from '@/types/playground';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { StockPrice } from '@/components/StockPrice';

interface PostCardProps {
  post: Post;
  showComments?: boolean;
  isDetailView?: boolean;
  className?: string;
}

export function PostCard({ 
  post, 
  showComments = false, 
  isDetailView = false,
  className = ""
}: PostCardProps) {
  const [isPending, startTransition] = useTransition();
  
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return postTime.toLocaleDateString('zh-CN');
  };

  const renderContent = (content: string) => {
    // 同时匹配 @股票代码 和 #主题标签
    const parts = content.split(/(@\w+|#[\w\u4e00-\u9fa5]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const symbol = part.substring(1);
        return (
          <span 
            key={index} 
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium cursor-pointer transition-colors"
            title={`查看 ${symbol} 股票信息`}
          >
            {part}
          </span>
        );
      } else if (part.startsWith('#')) {
        return (
          <span 
            key={index} 
            className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
            title={`主题标签: ${part}`}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleLike = () => {
    startTransition(async () => {
      try {
        // Like action removed - keeping for reference
        console.log('Like post:', post.id);
      } catch (error) {
        console.error('Failed to like post:', error);
      }
    });
  };

  const handleCommentLike = (commentId: string) => {
    startTransition(async () => {
      try {
        // Like comment action removed - keeping for reference
        console.log('Like comment:', commentId);
      } catch (error) {
        console.error('Failed to like comment:', error);
      }
    });
  };

  return (
    <article className={`bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-950/50 transition-colors ${className}`}>
      <div className="p-4 sm:p-6">
        {/* 用户信息和时间 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
          {/* shadcn/avatar */}
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">投资者</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">@luffy</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">·</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTime(post.created_at)}
                </span>
              </div>
              {isDetailView && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  投资讨论 · 公开可见
                </div>
              )}
            </div>
          </div>
          
          {!isDetailView && (
            <Link
              href={`/playground/post/${post.id}`}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="查看详情"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
        
        {/* 帖子内容 */}
        <div className="mb-4">
          {isDetailView ? (
            <Link href={`/playground/post/${post.id}`} className="block">
              <h1 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-white leading-relaxed mb-4">
                {renderContent(post.content)}
              </h1>
            </Link>
          ) : (
            <Link href={`/playground/post/${post.id}`} className="block hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
              <p className="text-gray-900 dark:text-white text-base sm:text-lg leading-relaxed">
                {renderContent(post.content)}
              </p>
            </Link>
          )}

          {/* 提及的股票标签 */}
          {post.mentions.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {post.mentions.map((mention, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
                           bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800
                           hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                  title={`查看 ${mention} 相关讨论`}
                >
                  <span className="mr-2 text-blue-700 dark:text-blue-300 font-semibold">
                    ${mention}
                  </span>
                  <StockPrice symbol={mention} className="text-xs" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 互动按钮 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-6 sm:space-x-12">
            {/* 评论按钮 */}
            <Link
              href={`/playground/post/${post.id}`}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{post.comment_count || 0}</span>
            </Link>

            {/* 转发按钮 */}
            <button 
              className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors group"
              disabled={isPending}
            >
              <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                <Repeat2 className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">0</span>
            </button>

            {/* 点赞按钮 */}
            <button 
              onClick={handleLike}
              disabled={isPending}
              className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-colors group disabled:opacity-50"
            >
              <div className="p-2 rounded-full group-hover:bg-red-50 dark:group-hover:bg-red-900/20 transition-colors">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">{post.likes}</span>
            </button>

            {/* 分享按钮 */}
            <button 
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group sm:flex hidden"
              title="分享讨论"
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                <Share className="w-5 h-5" />
              </div>
            </button>
          </div>
          
          {/* 移动端分享按钮 */}
          <button 
            className="p-2 text-gray-500 hover:text-blue-500 transition-colors sm:hidden"
            title="分享讨论"
          >
            <Share className="w-5 h-5" />
          </button>
        </div>

        {/* 评论展示 (仅在详情页或指定显示时) */}
        {showComments && (post as PostWithComments).comments && (post as PostWithComments).comments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="space-y-4">
              {(post as PostWithComments).comments.slice(0, isDetailView ? undefined : 2).map((comment) => (
                <CommentCard 
                  key={comment.id} 
                  comment={comment} 
                  onLike={() => handleCommentLike(comment.id)}
                  isPending={isPending}
                />
              ))}
              
              {!isDetailView && (post as PostWithComments).comments.length > 2 && (
                <Link
                  href={`/playground/post/${post.id}`}
                  className="block text-center py-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                >
                  查看全部 {(post as PostWithComments).comments.length} 条评论
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

// 评论卡片组件
function CommentCard({ 
  comment, 
  onLike, 
  isPending 
}: { 
  comment: Comment; 
  onLike: () => void; 
  isPending: boolean;
}) {
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}天前`;
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
          {comment.avatar}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">
            {comment.name}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            AI分析师
          </span>
          <span className="text-gray-500 dark:text-gray-400 text-xs">
            {formatTime(comment.created_at)}
          </span>
        </div>
        <p className="text-gray-900 dark:text-white text-sm leading-relaxed mb-2">
          {comment.content}
        </p>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onLike}
            disabled={isPending}
            className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            <Heart className="w-4 h-4" />
            <span className="text-xs">{comment.likes}</span>
          </button>
          <div className="flex items-center space-x-1 text-gray-400">
            <Clock className="w-3 h-3" />
            <span className="text-xs">AI生成</span>
          </div>
        </div>
      </div>
    </div>
  );
}