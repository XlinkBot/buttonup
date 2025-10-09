import { notionService } from '@/lib/notion';
import Header from '@/components/Header';
import ArchiveContent from '@/components/ArchiveContent';
import { Metadata } from 'next';
import Link from 'next/link';

// Enable ISR - revalidate every 30 minutes
export const revalidate = 1800;

export const metadata: Metadata = {
  title: '内容归档 - 创业洞察 ButtonUp',
  description: '浏览所有创业洞察文章，按日期筛选和分页查看',
  alternates: {
    canonical: 'https://buttonup.cloud/archive',
  },
};

export default async function ArchivePage() {
  console.log('📄 Archive page loading...');

  try {
    // Get initial content (first page)
    const initialData = await notionService.getPaginatedContent({
      page: 1,
      pageSize: 10
    });

    console.log(`✅ Archive page loaded with ${initialData.items.length} initial items`);

    // Generate structured data for the archive page
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "内容归档 - 创业洞察 ButtonUp",
      "description": "浏览所有创业洞察文章，按日期筛选和分页查看",
      "url": "https://buttonup.cloud/archive",
      "inLanguage": "zh-CN",
      "isPartOf": {
        "@type": "WebSite",
        "name": "创业洞察 ButtonUp",
        "url": "https://buttonup.cloud"
      },
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": initialData.totalCount,
        "itemListElement": initialData.items.slice(0, 5).map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Article",
            "name": item.title,
            "url": `https://buttonup.cloud/content/${item.slug}`,
            "datePublished": item.date,
            "description": item.excerpt
          }
        }))
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
        
        <Header />
        
        <main className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6 md:pt-8 lg:pt-12 pb-6 sm:pb-8 md:pb-12">
          <ArchiveContent initialData={initialData} />
        </main>

        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 py-6 sm:py-8 mt-8 sm:mt-12 md:mt-16">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">
            <div className="space-y-3">
              <p className="text-sm">
                &copy; 2024 创业洞察 buttonup. 汇总创业智慧，洞察行业趋势.
                <span className="mx-2">|</span>
                <a href="mailto:myladyyang@gmail.com" className="text-sm">
                  myladyyang@gmail.com
                </a>{" "}
                |{" "}
                <a
                  href="/llm.txt"
                  className="mobile-link text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 active:text-blue-900 dark:active:text-blue-200 touch-target"
                >
                  llms
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    );

  } catch (error) {
    console.error('❌ Archive page error:', error);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              加载失败
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              无法加载归档内容，请稍后再试
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              返回首页
            </Link>
          </div>
        </main>
      </div>
    );
  }
}
