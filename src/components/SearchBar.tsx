'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, FileText, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchSuggestion {
  type: 'title' | 'tag' | 'content';
  value: string;
  label: string;
  slug?: string;
  count?: number;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedFetchSuggestions = useCallback(
    async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setSuggestions(data.data);
          setShowSuggestions(true);
          setSelectedIndex(-1);
          console.log(`🔍 Search method: ${data.searchMethod || 'unknown'}`);
        } else {
          // Handle search failure gracefully
          console.warn('Search failed:', data.error || 'Unknown error');
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounce implementation
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      debouncedFetchSuggestions(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, debouncedFetchSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSuggestionClick(suggestions[selectedIndex]);
    }
    // Remove search page navigation since search page doesn't exist
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const focusSearch = () => {
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'title' && suggestion.slug) {
      // Navigate directly to the content
      router.push(`/content/${suggestion.slug}`);
      setShowSuggestions(false);
      setQuery('');
    }
    // Remove tag and content search navigation since search page doesn't exist
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'title':
        return <FileText className="w-4 h-4" />;
      case 'tag':
        return <Tag className="w-4 h-4" />;
      case 'content':
        return <Search className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  // Detect platform
  useEffect(() => {
    setIsMac(navigator.platform.toLowerCase().includes('mac'));
  }, []);

  // Handle keyboard shortcuts and navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        focusSearch();
      }
      
      // Escape to blur search and hide suggestions
      if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        } else if (isFocused) {
          inputRef.current?.blur();
        }
      }

      // Arrow key navigation when suggestions are shown
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, showSuggestions, suggestions.length]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow suggestion clicks
            setTimeout(() => setIsFocused(false), 150);
          }}
          placeholder="搜索AI创业项目..."
          className={`w-full pl-12 pr-16 py-4 border transition-all text-base bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm hover:shadow-md dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            showSuggestions 
              ? 'border-orange-300 dark:border-orange-600 rounded-t-xl rounded-b-none' 
              : 'border-gray-200 dark:border-gray-600 rounded-xl'
          }`}
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
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-orange-500"></div>
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 text-sm hidden sm:flex items-center">
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-mono border border-gray-200 dark:border-gray-600">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-600 border-t-0 rounded-b-xl shadow-lg max-h-80 overflow-y-auto z-50 backdrop-blur-sm"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              ref={el => { suggestionRefs.current[index] = el; }}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-3 ${
                selectedIndex === index 
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-200' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className={`flex-shrink-0 ${
                selectedIndex === index 
                  ? 'text-orange-600 dark:text-orange-400' 
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {getSuggestionIcon(suggestion.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {suggestion.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <span className="capitalize">{suggestion.type}</span>
                  {suggestion.count && (
                    <span className="text-orange-600 dark:text-orange-400">
                      {suggestion.count} post{suggestion.count !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Visual indicator for direct navigation */}
              {suggestion.type === 'title' && (
                <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  直接访问
                </div>
              )}
            </button>
          ))}
          
          {/* Footer hint */}
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span>使用 ↑↓ 导航</span>
              <span>Enter 选择</span>
            </div>
          </div>
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && !isLoading && query.trim().length >= 2 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-600 border-t-0 rounded-b-xl shadow-lg z-50 backdrop-blur-sm"
        >
          <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">没有找到相关建议</div>
            <div className="text-xs mt-1">请尝试其他关键词</div>
          </div>
        </div>
      )}
    </form>
  );
}