import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import MatchWaitingRoom from '@/components/MatchWaitingRoom';
import Header from '@/components/Header';
import { Users, Clock, Trophy } from 'lucide-react';

export const metadata: Metadata = {
  title: '匹配等待中 - 投资竞技场 | ButtonUp',
  description: '正在匹配玩家，准备开始投资竞技场对战',
  keywords: '匹配等待,投资竞技场,AI对战,股票策略匹配',
  alternates: {
    canonical: 'https://buttonup.cloud/stock-analysis/arena/match',
  },
  openGraph: {
    title: '匹配等待中 - 投资竞技场',
    description: '正在匹配玩家，准备开始AI投资策略对战',
    url: 'https://buttonup.cloud/stock-analysis/arena/match',
    type: 'website',
  },
};

// Generate structured data for the match page
const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "匹配等待中 - 投资竞技场 ButtonUp",
  "url": "https://buttonup.cloud/stock-analysis/arena/match",
  "description": "正在匹配玩家，准备开始投资竞技场对战",
  "inLanguage": "zh-CN"
};

export default async function MatchPage({
  searchParams,
}: {
  searchParams: Promise<{ roomId?: string; sessionId?: string }>;
}) {
  // 临时用户ID（实际应用中应该从session获取）
  const userId = `user_${Date.now()}`;
  const params = await searchParams;
  const roomId = params.roomId;
  const sessionId = params.sessionId;

  // 如果已经有sessionId，直接跳转到对战页面
  if (sessionId) {
    redirect(`/arena/${sessionId}`);
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData)
          }}
        />

        <Header />

        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 sm:p-12 shadow-sm max-w-md w-full">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                无效的房间ID
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                请通过竞技场主页重新开始匹配
              </p>
              <a
                href="/stock-analysis/arena"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                返回竞技场
              </a>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData)
        }}
      />

      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 mr-2 text-orange-600 dark:text-orange-400 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              匹配等待中
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            正在为您匹配对手，准备开始AI投资策略对战...
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
            <div className="flex items-center">
              <Trophy className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                竞技场匹配
              </h2>
            </div>
          </div>

          <div className="p-6">
            <MatchWaitingRoom
              roomId={roomId}
              userId={userId}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

