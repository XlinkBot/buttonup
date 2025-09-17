import { ContentItem } from '@/types/content';
import { format } from 'date-fns';
import Link from 'next/link';
import { Calendar, Tag, Search } from 'lucide-react';

interface SearchResultsProps {
  contentItems: ContentItem[];
  searchParams: {
    q?: string;
    tag?: string;
    start?: string;
    end?: string;
  };
}

export default function SearchResults({ contentItems, searchParams }: SearchResultsProps) {
  const { q: query, tag, start, end } = searchParams;

  // Filter content based on search parameters
  let filteredItems = contentItems;

  if (query) {
    const searchTerm = query.toLowerCase();
    filteredItems = filteredItems.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.content.toLowerCase().includes(searchTerm) ||
      item.excerpt.toLowerCase().includes(searchTerm)
    );
  }

  if (tag) {
    filteredItems = filteredItems.filter(item => 
      item.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }

  if (start || end) {
    filteredItems = filteredItems.filter(item => {
      const itemDate = new Date(item.date);
      const startDate = start ? new Date(start) : null;
      const endDate = end ? new Date(end) : null;

      if (startDate && itemDate < startDate) return false;
      if (endDate && itemDate > endDate) return false;
      return true;
    });
  }

  const hasFilters = query || tag || start || end;

  return (
    <div>
      {hasFilters && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
            <h3 className="font-medium text-blue-900 text-sm sm:text-base">Search Results</h3>
          </div>
          <p className="text-blue-800 text-xs sm:text-sm">
            Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} 
            {query && ` for "${query}"`}
            {tag && ` tagged with "${tag}"`}
            {(start || end) && ` between ${start || 'beginning'} and ${end || 'now'}`}
          </p>
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="mobile-card bg-white text-center py-8 sm:py-12">
          <Search className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p className="text-sm sm:text-base text-gray-500">
            {hasFilters 
              ? 'Try adjusting your search criteria or clearing some filters.'
              : 'No content available yet.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredItems.map((item) => (
            <article key={item.id} className="mobile-card bg-white shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3 gap-3">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors flex-1 min-w-0">
                  <Link href={`/content/${item.slug}`} className="mobile-link">
                    {item.title}
                  </Link>
                </h3>
                <div className="flex items-center text-xs sm:text-sm text-gray-500 flex-shrink-0">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="whitespace-nowrap">
                    {format(new Date(item.date), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
              
              <p className="prose-mobile text-gray-600 mb-3 sm:mb-4 leading-relaxed">
                {item.excerpt}
              </p>
              
              {item.tags && item.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                  <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  {item.tags.map((tagItem) => (
                    <span 
                      key={tagItem}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 sm:py-1 rounded-full"
                    >
                      {tagItem}
                    </span>
                  ))}
                </div>
              )}
              
              <Link 
                href={`/content/${item.slug}`}
                className="mobile-link inline-flex items-center text-blue-600 hover:text-blue-800 active:text-blue-900 font-medium touch-target text-sm sm:text-base"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}