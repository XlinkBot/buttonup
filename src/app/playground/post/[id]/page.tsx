import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { getPostWithComments, postExists } from '@/lib/playground-db';
import { Comment, PostWithComments } from '@/types/playground';
import { ArrowLeft, MessageCircle, Clock, Heart } from 'lucide-react';

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ commentPage?: string }>;
}

// 生成动态元数据
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const postParams = await params;
  const post = await getPostWithComments(postParams.id);
  
  if (!post) {
    return {
      title: '帖子未找到 - 创业洞察 ButtonUp',
      description: '您查找的投资讨论帖子不存在或已被删除。',
    };
  }

  const truncatedContent = post.content.length > 100 
    ? post.content.substring(0, 100) + '...' 
    : post.content;

  const stockMentions = post.mentions.length > 0 
    ? `讨论股票：${post.mentions.map(m => `$${m}`).join(', ')}` 
    : '';

  return {
    title: `${truncatedContent} - 投资讨论 - 创业洞察 ButtonUp`,
    description: `参与投资讨论：${truncatedContent} ${stockMentions} 查看AI投资专家的多角度分析和观点。`,
    keywords: [
      '投资讨论', 'AI投资专家', '股票分析', '投资观点', 
      ...post.mentions.map(m => `${m}股票`),
      '股票讨论', '投资社区', '财经分析'
    ],
    openGraph: {
      title: `投资讨论：${truncatedContent}`,
      description: `参与投资讨论，查看AI投资专家的多角度分析和观点。${stockMentions}`,
      type: 'article',
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      url: `https://buttonup.cloud/playground/post/${postParams.id}`,
      siteName: '创业洞察 ButtonUp',
      locale: 'zh_CN',
      authors: ['投资者'],
      tags: ['投资讨论', 'AI分析', ...post.mentions],
    },
    twitter: {
      card: 'summary_large_image',
      title: `投资讨论：${truncatedContent}`,
      description: `参与投资讨论，查看AI投资专家的多角度分析和观点。${stockMentions}`,
    },
    alternates: {
      canonical: `https://buttonup.cloud/playground/post/${postParams.id}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
  };
}

// 生成结构化数据
function generateStructuredData(post: PostWithComments, comments: Comment[]) {
  return {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content,
    "text": post.content,
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Person",
      "name": "投资者",
      "identifier": "luffy"
    },
    "publisher": {
      "@type": "Organization",
      "name": "创业洞察 ButtonUp",
      "url": "https://buttonup.cloud"
    },
    "url": `https://buttonup.cloud/playground/post/${post.id}`,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": post.likes
      },
      {
        "@type": "InteractionCounter", 
        "interactionType": "https://schema.org/CommentAction",
        "userInteractionCount": comments.length
      }
    ],
    "comment": comments.map(comment => ({
      "@type": "Comment",
      "text": comment.content,
      "dateCreated": comment.created_at,
      "author": {
        "@type": "Person",
        "name": comment.name,
        "description": "AI投资分析师"
      }
    })),
    "keywords": ["投资讨论", "AI分析", ...post.mentions],
    "about": post.mentions.map((mention: string) => ({
      "@type": "Thing",
      "name": `${mention}股票`,
      "sameAs": `https://finance.yahoo.com/quote/${mention}`
    }))
  };
}

// Loading组件
function CommentsLoading() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 评论组件
function CommentCard({ comment }: { comment: Comment }) {
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
    <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg">
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
          <p className="text-gray-900 dark:text-white text-sm leading-relaxed mb-3">
            {comment.content}
          </p>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
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
    </div>
  );
}

// 评论列表组件
async function CommentsList({ postId, page }: { postId: string; page: number }) {
  const postData = await getPostWithComments(postId, page, 10);
  
  if (!postData || !postData.comments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          暂无评论
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          AI分析师正在生成专业评论，请稍后刷新查看
        </p>
      </div>
    );
  }

  // 简单的分页计算（实际应该从数据库获取总数）
  const totalComments = postData.comments.length;
  const totalPages = Math.ceil(totalComments / 10);

  return (
    <div className="space-y-4">
      {postData.comments.map((comment) => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
      
      {totalPages > 1 && (
        <div className="pt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath={`/playground/post/${postId}`}
          />
        </div>
      )}
    </div>
  );
}

export default async function PostDetailPage({ params, searchParams }: PostDetailPageProps) {
  const postParams = await params;
  const postSearchParams = await searchParams;
  const commentPage = parseInt(postSearchParams.commentPage || '1', 10);
  
  // 检查帖子是否存在
  const exists = await postExists(postParams.id);
  if (!exists) {
    notFound();
  }

  const post = await getPostWithComments(postParams.id, 1, 1);
  if (!post) {
    notFound();
  }

  // 生成结构化数据
  const structuredData = generateStructuredData(post, post.comments || []);

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="border-x border-gray-200  dark:border-gray-800 min-h-screen">
            {/* 页面头部 */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center space-x-4 p-4 pt-8">
                <Link
                  href="/playground"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-xl font-bold  text-gray-900 dark:text-white">
                    投资讨论详情
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    查看完整讨论和AI专家分析
                  </p>
                </div>
              </div>
            </div>

            {/* 主帖内容 */}
            <div className="border-b border-gray-200 dark:border-gray-800">
              <PostCard
                post={post}
                showComments={true}
                isDetailView={true}
              />
            </div>

            {/* 评论区标题 */}
            <div className="border-b border-gray-200 dark:border-gray-800 p-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI专家分析
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({post.comment_count || 0}条评论)
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                来自不同投资风格的AI分析师的专业观点
              </p>
            </div>

            {/* 评论列表 */}
            <div className="p-4">
              <Suspense fallback={<CommentsLoading />}>
                <CommentsList postId={postParams.id} page={commentPage} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
