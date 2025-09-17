'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, Archive, Search, TrendingUp, Rss, ExternalLink, Menu, X } from 'lucide-react';
import SubscriptionForm from './SubscriptionForm';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-[20px] font-semibold text-gray-900 hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
            <TrendingUp className="w-7 h-7 md:w-8 md:h-8 mr-2 md:mr-3 text-gray-600" />
            <div>
              <div className="leading-tight text-[18px] md:text-[22px] font-semibold tracking-tight">ButtonUp</div>
              <div className="text-xs md:text-sm font-normal text-gray-500">Startup Ideas & Discussion</div>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-5">
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
            
            {/* Desktop Subscription */}
            <div className="pl-5 border-l border-gray-200">
              <div className="w-64">
                <SubscriptionForm compact={true} buttonText="免费订阅" />
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3 pt-4">
              <Link 
                href="/" 
                className="flex items-center text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                onClick={closeMobileMenu}
              >
                <Calendar className="w-5 h-5 mr-3" />
                本周洞察
              </Link>
              <Link 
                href="/archive" 
                className="flex items-center text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                onClick={closeMobileMenu}
              >
                <Archive className="w-5 h-5 mr-3" />
                历史归档
              </Link>
              <Link 
                href="/search" 
                className="flex items-center text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                onClick={closeMobileMenu}
              >
                <Search className="w-5 h-5 mr-3" />
                搜索
              </Link>
              <a 
                href="/llm.txt" 
                className="flex items-center text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
              >
                <ExternalLink className="w-5 h-5 mr-3" />
                LLMs
              </a>
              <a 
                href="/rss.xml" 
                className="flex items-center text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md transition-colors"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
              >
                <Rss className="w-5 h-5 mr-3" />
                RSS订阅
              </a>
            </nav>
            
            {/* Mobile Subscription */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <SubscriptionForm compact={true} buttonText="免费订阅" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}