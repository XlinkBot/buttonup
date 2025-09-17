'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [startDate, setStartDate] = useState(searchParams.get('start') || '');
  const [endDate, setEndDate] = useState(searchParams.get('end') || '');

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (query.trim()) params.set('q', query.trim());
    if (selectedTag) params.set('tag', selectedTag);
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedTag('');
    setStartDate('');
    setEndDate('');
    router.push('/search');
  };

  const hasActiveFilters = query || selectedTag || startDate || endDate;

  return (
    <div className="mobile-card bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">Search Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="mobile-link text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 active:text-blue-900 dark:active:text-blue-200 flex items-center touch-target"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div>
          <label htmlFor="query" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search Query
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search in title and content..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent outline-none text-sm"
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
        </div>

        <div>
          <label htmlFor="tag" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tag Filter
          </label>
          <input
            id="tag"
            type="text"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            placeholder="Filter by tag..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent outline-none text-sm"
            style={{ fontSize: '16px' }} // Prevent zoom on iOS
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent outline-none text-sm"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 focus:border-transparent outline-none text-sm"
          />
        </div>

        <button
          onClick={handleSearch}
          className="w-full bg-gray-900 dark:bg-gray-700 text-white py-2.5 px-4 rounded-lg hover:bg-black dark:hover:bg-gray-600 active:bg-black dark:active:bg-gray-500 transition-colors font-medium text-sm flex items-center justify-center touch-target"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </button>
      </div>
    </div>
  );
}