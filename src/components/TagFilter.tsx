'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, X, Tag } from 'lucide-react';

interface TagFilterProps {
  selectedTag?: string;
  onTagChange: (tag?: string) => void;
  onClear: () => void;
}

export default function TagFilter({ selectedTag, onTagChange, onClear }: TagFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tags');
        const result = await response.json();
        
        if (result.success) {
          setTags(result.data);
        } else {
          console.error('Failed to fetch tags:', result.error);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  const handleTagSelect = (tag: string) => {
    onTagChange(tag);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium rounded-lg border transition-colors
          ${selectedTag 
            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' 
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }
        `}
      >
        <Tag className="w-4 h-4 mr-2" />
        <span className="hidden sm:inline">
          {selectedTag ? `标签: ${selectedTag}` : '选择标签'}
        </span>
        <span className="sm:hidden">
          {selectedTag || '标签'}
        </span>
        <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Clear Button */}
      {selectedTag && (
        <button
          onClick={handleClear}
          className="ml-2 inline-flex items-center px-2 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="清除筛选"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                加载中...
              </div>
            ) : tags.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                暂无标签
              </div>
            ) : (
              <>
                {/* All option */}
                <button
                  onClick={handleClear}
                  className={`
                    w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${!selectedTag ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}
                  `}
                >
                  全部标签
                </button>
                
                {/* Divider */}
                <div className="border-t border-gray-100 dark:border-gray-600" />
                
                {/* Tag options */}
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className={`
                      w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      ${selectedTag === tag ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}
                    `}
                  >
                    <div className="flex items-center">
                      <Tag className="w-3 h-3 mr-2 opacity-60" />
                      {tag}
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
