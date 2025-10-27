import { Metadata } from 'next';
import { Suspense } from 'react';
import ArenaBattle from '@/components/ArenaBattle';
import Header from '@/components/Header';
import Leaderboard from '@/components/Leaderboard';
import { TrendingUp, Trophy, Users, Zap, Target, Shield } from 'lucide-react';
import Link from 'next/link';

// SEO metadata
export const metadata: Metadata = {
  title: 'A股投资竞技场 - AI策略对战与排行榜 | ButtonUp',
  description: '加入A股投资竞技场！创建AI策略与系统玩家对战，或在线匹配其他玩家。查看实时回测战绩和历史排行榜。',
  keywords: 'A股投资竞技场,AI投资策略,股票对战,投资策略排名,量化交易,投资竞技,交易回测,金融科技,投资教育',
  alternates: {
    canonical: 'https://buttonup.cloud/stock-analysis/arena',
  },
  openGraph: {
    title: 'A股投资竞技场 - AI策略对战与排行榜',
    description: '创建AI策略与玩家对战，查看实时战绩和历史排行榜。',
    url: 'https://buttonup.cloud/stock-analysis/arena',
    type: 'website',
  },
};

// Generate structured data for the arena page
const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "A股投资竞技场 - ButtonUp",
  "url": "https://buttonup.cloud/stock-analysis/arena",
  "description": "加入A股投资竞技场！创建AI策略与系统玩家对战，或在线匹配其他玩家。查看实时回测战绩和历史排行榜。",
  "inLanguage": "zh-CN",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://buttonup.cloud/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "创业洞察 ButtonUp",
  "url": "https://buttonup.cloud",
  "logo": "https://buttonup.cloud/logo.png",
  "sameAs": [
    "https://twitter.com/buttonup_co"
  ],
  "description": "每日汇总Reddit创业社区讨论精华，专注AI创业内容分享。深度解析Reddit上AI创业者的真实经验、失败教训和成功案例。"
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "如何参加A股投资竞技场？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "您可以创建AI投资策略，与系统玩家或其他玩家的策略进行对战。通过实时回测验证您的投资策略，查看历史战绩和排行榜。"
      }
    },
    {
      "@type": "Question",
      "name": "竞技场支持哪些投资策略？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "竞技场支持多种AI投资策略，包括技术分析、基本面分析、量化交易等。您可以创建自定义策略，也可以使用预设策略进行对战。"
      }
    },
    {
      "@type": "Question",
      "name": "如何查看竞技场排行榜？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "竞技场提供实时排行榜，显示所有玩家的战绩排名。您可以查看历史战绩、收益率、胜率等关键指标，了解最优投资策略。"
      }
    }
  ]
};

export default function InvestmentArenaPage() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData)
        }}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
        {/* F-Type Layout: Logo First */}
        <div className="mb-8 sm:mb-12">
          {/* Main Title - SEO H1 */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3 sm:mb-4">
              A股投资竞技场 - AI策略对战
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              加入A股投资竞技场！创建AI策略与系统玩家对战，或在线匹配其他玩家。查看实时回测战绩和历史排行榜。
            </p>
          </div>


        </div>


        {/* Main Arena Content */}
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-12 shadow-sm text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">加载竞技场数据中...</p>
          </div>
        }>
          <Leaderboard />
        </Suspense>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 py-6 sm:py-8 mt-8 sm:mt-12 md:mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">
          <div className="space-y-3">
            {/* Company description and contact in one line */}
            <p className="text-sm">
              &copy; 2024 创业洞察 buttonup. 汇总创业智慧，洞察行业趋势.
              <span className="mx-2">|</span>
              <a href="mailto:myladyyang@gmail.com" className="text-sm">
                myladyyang@gmail.com
              </a>{" "}
            </p>
            <div className="flex justify-center">
              <a href="https://www.showmysites.com" target="_blank" rel="noopener noreferrer">
                <img src="https://www.showmysites.com/static/backlink/blue_border.webp" alt="ShowMySites Badge" width="200" height="60" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

}
