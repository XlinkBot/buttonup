import Header from '@/components/Header';
import MCPChatDemo from '@/components/MCPChatDemo';
import Link from 'next/link';
import { ChevronRight, Home, TrendingUp } from 'lucide-react';

// SEO metadata
export const metadata = {
  title: '中国股票市场MCP服务 - AI股票分析工具 | ButtonUp',
  description: '专业的中国股票市场MCP服务提供商，提供AI股票分析工具、实时行情数据、技术指标分析和投资决策支持。基于MCP协议构建的股票分析解决方案，支持A股、港股等中国股票市场。',
  keywords: '中国股票市场MCP,MCP服务,AI股票分析,股票数据API,技术指标分析,投资决策支持,A股分析,港股分析,股票量化分析,MCP协议,金融数据服务',
  alternates: {
    canonical: 'https://buttonup.cloud/stock-analysis',
  },
  openGraph: {
    title: '中国股票市场MCP服务 - AI股票分析工具',
    description: '专业的中国股票市场MCP服务提供商，提供AI股票分析工具、实时行情数据、技术指标分析和投资决策支持。',
    url: 'https://buttonup.cloud/stock-analysis',
    type: 'website',
  },
};

export default function StockAnalysisMCPPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "中国股票市场MCP服务",
            "description": "专业的中国股票市场MCP服务提供商，提供AI股票分析工具、实时行情数据、技术指标分析和投资决策支持",
            "url": "https://buttonup.cloud/stock-analysis",
            "serviceType": "金融数据服务",
            "areaServed": {
              "@type": "Country",
              "name": "中国"
            },
            "provider": {
              "@type": "Organization",
              "name": "ButtonUp",
              "url": "https://buttonup.cloud",
              "description": "专业的MCP服务提供商"
            },
            "offers": {
              "@type": "Offer",
              "description": "基于MCP协议的股票分析服务",
              "price": "0",
              "priceCurrency": "CNY"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "MCP股票分析服务",
              "itemListElement": [
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "实时股票行情数据"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "技术指标分析"
                  }
                },
                {
                  "@type": "Offer",
                  "itemOffered": {
                    "@type": "Service",
                    "name": "AI投资决策支持"
                  }
                }
              ]
            }
          })
        }}
      />
      
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">
          <Link href="/" className="flex items-center hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
            <Home className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">首页</span>
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="flex items-center text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">中国股票市场MCP服务</span>
            <span className="sm:hidden">股票分析</span>
          </span>
        </nav>

        {/* Page Title Section */}
        <div className="mb-4 sm:mb-8 md:mb-12">
          <div className="mb-4 sm:mb-6 md:mb-8">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 sm:mb-4">
              中国股票市场MCP服务
            </h1>
            <p className="hidden sm:block text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-4xl">
              专业的MCP服务提供商，基于MCP协议构建的AI股票分析解决方案。提供实时行情数据、技术指标分析、投资决策支持，覆盖A股、港股等中国股票市场。
            </p>
                  </div>
                  
        </div>

        {/* Chat Interface */}
          <div className="h-[500px] sm:h-[600px] md:h-[700px]">
            <MCPChatDemo />
          </div>
      </main>
    </div>
  );
}
