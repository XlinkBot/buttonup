import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import NewsComments from '@/components/NewsComments';
import BackButton from '@/components/BackButton';
import { notionService } from '@/lib/notion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Clock, Flame, Hash, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const revalidate = 300; // 5 minutes

interface NewsDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}


export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const newsDetail = await notionService.getNewsById(id);
    if (!newsDetail) {
      return {
        title: '新闻未找到 - 创业洞察 ButtonUp'
      };
    }

    return {
      title: `${newsDetail.title} - AI 聊财经`,
      description: newsDetail.summary,
      keywords: [newsDetail.title, '新闻', '财经', 'AI 聊财经'],
      openGraph: {
        title: newsDetail.title,
        description: newsDetail.summary,
        type: 'article',
        url: `https://buttonup.cloud/news/${id}`,
        publishedTime: newsDetail.publishedAt,
        authors: [newsDetail.source],
        tags: [newsDetail.category],
        images: [
          {
            url: '/og-image.png',
            width: 1200,
            height: 630,
            alt: newsDetail.title
          }
        ]
      },
      twitter: {
        card: 'summary_large_image',
        title: newsDetail.title,
        description: newsDetail.summary,
        images: ['/og-image.png']
      }
    };
  } catch {
    return {
      title: '新闻未找到 - 创业洞察 ButtonUp'
    };
  }
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = await params;
  console.log(`📄 Loading news detail page for ID: ${id}`);
  
  const newsDetail = await notionService.getNewsById(id);

  if (!newsDetail) {
    console.log(`❌ News not found for ID: ${id}`);
    notFound();
  }

  console.log(`✅ Found news: ${newsDetail.title}`);



  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": newsDetail.title,
    "description": newsDetail.summary,
    "articleBody": newsDetail.summary,
    "datePublished": newsDetail.publishedAt,
    "dateModified": newsDetail.publishedAt,
    "author": {
      "@type": "Organization",
      "name": newsDetail.source
    },
    "publisher": {
      "@type": "Organization",
      "name": "创业洞察 ButtonUp",
      "logo": {
        "@type": "ImageObject",
        "url": "https://buttonup.cloud/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://buttonup.cloud/news/${id}`
    },
    "articleSection": newsDetail.category,
    "inLanguage": "zh-CN",
    "commentCount": newsDetail.comments?.length || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton />
        </div>

        {/* Article Header */}
        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`text-sm px-3 py-1 rounded-full font-medium`}>
                <Hash className="w-3 h-3 inline mr-1" />
                {newsDetail.category}
              </span>
              
              {newsDetail.isHot && (
                <span className="flex items-center text-sm px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-medium">
                  <Flame className="w-3 h-3 mr-1" />
                  热点新闻
                </span>
              )}
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                {formatDistanceToNow(new Date(newsDetail.publishedAt), {
                  addSuffix: true,
                  locale: zhCN
                })}
              </div>
              
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <User className="w-4 h-4 mr-1" />
                {newsDetail.source}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              {newsDetail.title}
            </h1>

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-8">
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {newsDetail.summary}
              </p>
            </div>



            {/* Content */}
            {newsDetail.content && (
              <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-gray-900 dark:text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-900 dark:text-white">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="mb-4 pl-6 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-4 pl-6 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-700 dark:text-gray-300">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-4 text-gray-600 dark:text-gray-400">{children}</blockquote>,
                    code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">{children}</code>,
                    pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                  }}
                >
                  {newsDetail.content}
                </ReactMarkdown>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <div className="flex items-center space-x-3 mb-6">
                <Hash className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  用户评论
                </h2>
              </div>
              <NewsComments comments={newsDetail.comments || []} />
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
