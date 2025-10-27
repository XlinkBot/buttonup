import Header from '@/components/Header';
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



export default async function ArenaSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  
  const sessionId = (await params).sessionId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="h-[calc(100vh-80px)] overflow-hidden">
        {/* 传递 session 给 ArenaBattle */}
        <ArenaBattle sessionId={sessionId} />
      </main>
    </div>
  );
}
