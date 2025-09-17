import Link from 'next/link';
import { Calendar, Archive, Search, TrendingUp, Rss, ExternalLink } from 'lucide-react';

export default function Header() {
  return (
    <header className="backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-[20px] font-semibold text-gray-900 hover:opacity-80 transition-opacity">
            <TrendingUp className="w-8 h-8 mr-3 text-gray-600" />
            <div>
              <div className="leading-tight text-[22px] font-semibold tracking-tight">ButtonUp</div>
              <div className="text-xs md:text-sm font-normal text-gray-500">Startup Ideas & Discussion</div>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-5">
            <Link 
              href="/" 
              className="flex items-center text-gray-700 transition-all duration-150 ease-out hover:opacity-80 active:translate-y-[0.5px]"
            >
              <Calendar className="w-4 h-4 mr-2" />
              本周洞察
            </Link>
            <Link 
              href="/archive" 
              className="flex items-center text-gray-700 transition-all duration-150 ease-out hover:opacity-80 active:translate-y-[0.5px]"
            >
              <Archive className="w-4 h-4 mr-2" />
              历史归档
            </Link>
            <Link 
              href="/search" 
              className="flex items-center text-gray-700 transition-all duration-150 ease-out hover:opacity-80 active:translate-y-[0.5px]"
            >
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Link>
            <a 
              href="/llm.txt" 
              className="flex items-center text-gray-700 transition-all duration-150 ease-out hover:opacity-80 active:translate-y-[0.5px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              LLMs
            </a>
            <a 
              href="/rss.xml" 
              className="flex items-center text-gray-700 transition-all duration-150 ease-out hover:text-orange-600 active:translate-y-[0.5px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Rss className="w-4 h-4 mr-2" />
              RSS订阅
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}