import Link from 'next/link';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { Home, Search } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '页面未找到 | 创业洞察 ButtonUp',
  description: '抱歉，您要查找的页面不存在。返回首页探索更多创业洞察内容。',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12">
        <div className="text-center">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-6xl sm:text-8xl font-bold text-orange-600 dark:text-orange-400 opacity-20">
              404
            </h1>
          </div>
          
          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              页面未找到
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              抱歉，您要查找的页面不存在。可能是链接有误或页面已被移动。
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-lg hover:shadow-orange-500/25"
            >
              <Home className="w-5 h-5 mr-2" />
              返回首页
            </Link>
            
            <Link
              href="/search"
              className="inline-flex items-center px-6 py-3 border border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium rounded-lg transition-colors"
            >
              <Search className="w-5 h-5 mr-2" />
              搜索内容
            </Link>
          </div>
          
          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              您可能想要：
            </h3>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link
                href="/"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
              >
                浏览最新内容
              </Link>
              <span className="text-gray-400">·</span>
              <Link
                href="/rss.xml"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
              >
                订阅 RSS
              </Link>
              <span className="text-gray-400">·</span>
              <a
                href="mailto:myladyyang@gmail.com"
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline"
              >
                联系我们
              </a>
            </div>
          </div>
          
          {/* Back Button */}
          <div className="mt-8">
            <BackButton />
          </div>
        </div>
      </main>
    </div>
  );
}