'use client';

import { Heart, X } from 'lucide-react';

interface Comment {
  id: string;
  persona: string;
  name: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
}

interface Post {
  id: string;
  content: string;
  mentions: string[];
  timestamp: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
}

interface CommentPanelProps {
  post: Post | null;
  onClose: () => void;
  onCommentLike: (postId: string, commentId: string) => void;
  isLoadingComments?: boolean;
}

const PERSONA_INFO = {
  bull: { name: '乐观派投资者', avatar: '🐂', color: 'text-green-600' },
  bear: { name: '谨慎派分析师', avatar: '🐻', color: 'text-red-600' },
  technical: { name: '技术分析专家', avatar: '📈', color: 'text-blue-600' },
  value: { name: '价值投资者', avatar: '💎', color: 'text-purple-600' },
  growth: { name: '成长股猎手', avatar: '🚀', color: 'text-orange-600' }
};

export function CommentPanel({ post, onClose, onCommentLike, isLoadingComments }: CommentPanelProps) {
  if (!post) return null;

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - postTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}天前`;
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-500 hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* 评论面板 */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-black border-l border-gray-200 dark:border-gray-800 z-50 overflow-y-auto">
      {/* 头部 */}
      <div className="sticky top-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            评论 ({post.comments.length})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* 原帖内容 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-1 mb-2">
          <span className="font-bold text-gray-900 dark:text-white">投资者</span>
          <span className="text-gray-500 dark:text-gray-400">@investor</span>
          <span className="text-gray-500 dark:text-gray-400">·</span>
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            {formatTime(post.timestamp)}
          </span>
        </div>
        <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
          {renderContent(post.content)}
        </p>
        
        {/* 提及的股票标签 */}
        {post.mentions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.mentions.map((mention, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium
                         bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <span className="mr-1">$</span>
                {mention}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 评论列表 */}
      <div className="p-4">
        {/* 加载状态 */}
        {isLoadingComments && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 py-4">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">AI 投资者正在分析中...</span>
          </div>
        )}

        {/* 评论 */}
        <div className="space-y-4">
          {post.comments.map((comment) => {
            const personaInfo = PERSONA_INFO[comment.persona as keyof typeof PERSONA_INFO];
            return (
              <div key={comment.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{comment.avatar}</span>
                  <div>
                    <div className={`font-semibold text-sm ${personaInfo?.color || 'text-gray-900 dark:text-white'}`}>
                      {comment.name}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs">
                      {formatTime(comment.timestamp)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed mb-3">
                  {comment.content}
                </p>
                
                {/* 评论互动 */}
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => onCommentLike(post.id, comment.id)}
                    className={`flex items-center space-x-1 text-xs transition-colors ${
                      comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                    <span>{comment.likes}</span>
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    回复
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 空状态 */}
        {post.comments.length === 0 && !isLoadingComments && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">暂无评论</p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
