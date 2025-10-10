import { Metadata } from 'next';
import Header from '@/components/Header';
import { RightSidebar } from '@/components/RightSidebar';

export const metadata: Metadata = {
  title: '投资讨论广场 - 创业洞察 ButtonUp',
  description: '与AI投资专家讨论股票投资，获取多角度的投资观点和分析。支持股票提及、实时讨论和专业点评。',
  keywords: ['投资讨论', 'AI投资专家', '股票分析', '投资观点', '股票讨论', '投资社区', '财经分析', '股市讨论'],
  openGraph: {
    title: '投资讨论广场 - 创业洞察 ButtonUp',
    description: '与AI投资专家讨论股票投资，获取多角度的投资观点和分析。支持股票提及、实时讨论和专业点评。',
    type: 'website',
    url: 'https://buttonup.cloud/playground',
    siteName: '创业洞察 ButtonUp',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary_large_image',
    title: '投资讨论广场 - 创业洞察 ButtonUp',
    description: '与AI投资专家讨论股票投资，获取多角度的投资观点和分析。支持股票提及、实时讨论和专业点评。',
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

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12">
          <div className="flex gap-8 max-w-none">
            {/* 主内容区域 */}
            <div className="flex-1 max-w-3xl">
              {children}
            </div>
            
            {/* 右侧边栏 */}
            <div className="hidden xl:block w-80 flex-shrink-0">
              <div className="sticky top-6">
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
