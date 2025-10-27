import Header from '@/components/Header';
import type { BacktestSession } from '@/types/arena';
import ArenaBattle from '@/components/ArenaBattle';

// SEO metadata
export const metadata = {
  title: 'A股投资竞技场 - AI策略对战平台 | ButtonUp',
  description: '体验AI投资策略的精彩对决！三个不同风格的AI玩家在A股市场进行实时交易竞技，展示激进型、稳健型、保守型策略的表现差异。基于真实股票数据和专业交易策略的投资竞技场。',
  keywords: 'A股投资竞技场,AI投资策略,股票交易模拟,投资策略对比,量化交易,股票分析,投资竞技,交易策略测试,金融科技,投资教育',
  alternates: {
    canonical: 'https://buttonup.cloud/arena',
  },
  openGraph: {
    title: 'A股投资竞技场 - AI策略对战平台',
    description: '体验AI投资策略的精彩对决！三个不同风格的AI玩家在A股市场进行实时交易竞技。',
    url: 'https://buttonup.cloud/arena',
    type: 'website',
  },
};

async function getSession(sessionId: string): Promise<BacktestSession | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/arena/sessions/${sessionId}`, {
      cache: 'no-store',
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    return data.data?.session || null;
  } catch (error) {
    console.error('获取session失败:', error);
    return null;
  }
}

export default async function ArenaSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const session = await getSession((await params).sessionId);
  
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Session 不存在或已过期
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="h-[calc(100vh-80px)] overflow-hidden">
        {/* 传递 session 给 ArenaBattle */}
        <ArenaBattle session={session} />
      </main>
    </div>
  );
}
