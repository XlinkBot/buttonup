'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索内容..."
          className="w-full pl-9 sm:pl-10 pr-20 sm:pr-24 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-sm sm:text-base"
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-16 sm:right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-gray-700 touch-target p-1"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
      <button
        type="submit"
        className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 sm:px-4 py-1.5 rounded-md transition-all hover:opacity-90 active:translate-y-[1px] active:bg-black shadow-sm hover:shadow text-xs sm:text-sm font-medium touch-target"
      >
        搜索
      </button>
    </form>
  );
}