'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
  };

  const focusSearch = () => {
    inputRef.current?.focus();
  };

  // Detect platform
  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes('mac'));
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }
      
      // Escape to blur search
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="搜索AI可穿戴设备、心理健康SaaS、环保时尚..."
          className="w-full pl-12 pr-16 py-4 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm hover:shadow-md dark:text-gray-100"
          style={{ 
            fontSize: '16px', // Prevent zoom on iOS
            '--tw-ring-color': '#E85D00',
            '--tw-ring-opacity': '0.5'
          } as React.CSSProperties}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-14 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 active:text-gray-700 dark:active:text-gray-300 touch-target p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm hidden sm:flex items-center">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-mono border border-gray-200 dark:border-gray-600">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>
      </div>
    </form>
  );
}