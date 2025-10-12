import { Metadata } from 'next';
import Header from '@/components/Header';
import NewsList from '@/components/NewsList';
import { NewsItem } from '@/types/news';
import { notionService } from '@/lib/notion';

export const revalidate = 300; // 5 minutes

export const metadata: Metadata = {
  title: 'AI智能新闻 - 创业洞察 ButtonUp',
  description: '汇聚今日最新的科技、创业、金融、市场动态，配备AI智能分析和观点解读，为创业者提供深度洞察。',
  keywords: ['AI新闻', '智能分析', '科技资讯', '创业动态', '金融市场', '热点新闻', '创业洞察'],
  openGraph: {
    title: 'AI智能新闻 - 创业洞察 ButtonUp',
    description: '汇聚今日最新的科技、创业、金融、市场动态，配备AI智能分析和观点解读。',
    type: 'website',
    url: 'https://buttonup.cloud/news',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI智能新闻 - 创业洞察 ButtonUp'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI智能新闻 - 创业洞察 ButtonUp',
    description: '汇聚今日最新资讯，配备AI智能分析',
    images: ['/og-image.png']
  }
};


async function getTodaysNews(): Promise<NewsItem[]> {
  try {
    console.log('🔍 Fetching today\'s news with AI comments...');
    const todayNews = await notionService.getTodayNews();
    
    // Sort news by priority: isHot first, then by publishedAt
    return todayNews.sort((a, b) => {
      if (a.isHot && !b.isHot) return -1;
      if (!a.isHot && b.isHot) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
    
  } catch (error) {
    console.error('Error fetching today\'s news:', error);
    return [];
  }
}

export default async function NewsPage() {
  console.log('📰 Loading news page with AI insights...');
  
  const newsItems = await getTodaysNews();
  const totalNewsCount = newsItems.length;
  
  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "今日新闻 - AI智能解读 - 创业洞察 ButtonUp",
    "description": "汇聚今日最新的科技、创业、金融、市场动态，配备AI智能分析和观点解读。",
    "url": "https://buttonup.cloud/news",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalNewsCount,
      "itemListElement": newsItems.map((news, index) => ({
        "@type": "NewsArticle",
        "position": index + 1,
        "headline": news.title,
        "description": news.summary,
        "datePublished": news.publishedAt,
        "author": {
          "@type": "Organization",
          "name": news.source
        },
        "publisher": {
          "@type": "Organization",
          "name": "创业洞察 ButtonUp"
        },
        "url": `https://buttonup.cloud/news/${news.id}`
      }))
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "首页",
          "item": "https://buttonup.cloud"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "今日新闻",
          "item": "https://buttonup.cloud/news"
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white transition-colors duration-300 mobile-scrollable">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* testing page message */}
        <div className="bg-orange-500 text-white p-4 mb-4">
          <p className="text-center text-sm">
            测试页面，AI包饺子
          </p>
        </div>
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI 聊财经
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalNewsCount > 0 ? `今日共 ${totalNewsCount} 条新闻，配备AI深度分析` : '暂无新闻更新'}
          </p>
        </div>

        {/* News Content with Dynamic Comments Panel */}
        <NewsList news={newsItems} />
      </main>
    </div>
  );
}
