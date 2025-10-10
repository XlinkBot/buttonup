import { Suspense } from 'react';
import { Metadata } from 'next';
import { PostComposer } from '@/components/PostComposer';
import { PostCard } from '@/components/PostCard';
import { Pagination } from '@/components/Pagination';
import { getPosts } from '@/lib/playground-db';
import { MessageCircle } from 'lucide-react';

interface PlaygroundPageProps {
  searchParams: Promise<{ page?: string }>;
}

// 生成动态元数据
export async function generateMetadata({ searchParams }: PlaygroundPageProps): Promise<Metadata> {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);
  const pageTitle = page > 1 ? `投资讨论广场 - 第${page}页` : '投资讨论广场';
  const pageDescription = page > 1 
    ? `浏览第${page}页的投资讨论，与AI投资专家交流股票观点，获取多角度的专业分析。`
    : '与AI投资专家讨论股票投资，获取多角度的投资观点和分析。支持股票提及、实时讨论和专业点评。';

  return {
    title: `${pageTitle} - 创业洞察 ButtonUp`,
    description: pageDescription,
    keywords: ['投资讨论', 'AI投资专家', '股票分析', '投资观点', '股票讨论', '投资社区', '财经分析', '股市讨论'],
    openGraph: {
      title: `${pageTitle} - 创业洞察 ButtonUp`,
      description: pageDescription,
      type: 'website',
      url: page > 1 ? `https://buttonup.cloud/playground?page=${page}` : 'https://buttonup.cloud/playground',
      siteName: '创业洞察 ButtonUp',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${pageTitle} - 创业洞察 ButtonUp`,
      description: pageDescription,
    },
    alternates: {
      canonical: page > 1 ? `https://buttonup.cloud/playground?page=${page}` : 'https://buttonup.cloud/playground',
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

// Loading组件
function PostsLoading() {
  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-800">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="p-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
              <div className="flex items-center space-x-8">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}



// 帖子列表组件
async function PostsList({ page }: { page: number }) {
  const { data: posts, total, hasMore } = await getPosts(page, 20);
  const totalPages = Math.ceil(total / 20);

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          还没有讨论
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          成为第一个分享投资观点的人吧！
        </p>
      </div>
    );
  }

  return (
    <>
      {/* <Suspense fallback={<div className="p-4"><div className="h-20 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div></div>}>
        <StatsSection posts={posts} />
      </Suspense> */}
      
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            showComments={false}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/playground"
          />
        </div>
      )}
    </>
  );
}

export default async function PlaygroundPage({ searchParams }: PlaygroundPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-950 min-h-screen">
      {/* 发帖组件
      <div className="border-b border-gray-200 dark:border-gray-800">
        <PostComposer />
      </div> */}

      {/* 帖子列表 */}
      <Suspense fallback={<PostsLoading />}>
        <PostsList page={page} />
      </Suspense>
    </div>
  );
}