import { ContentItem } from '@/types/content';
import { format } from 'date-fns';
import Link from 'next/link';
import { Calendar, Tag } from 'lucide-react';

interface ContentListProps {
  contentItems: ContentItem[];
}

export default function ContentList({ contentItems }: ContentListProps) {
  console.log('🎨 ContentList rendering with items:', contentItems.length);
  console.log('🎨 ContentItems data:', contentItems.map(item => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    date: item.date,
    excerptLength: item.excerpt?.length || 0,
    tagsCount: item.tags?.length || 0
  })));

  if (contentItems.length === 0) {
    console.log('🎨 Rendering empty state');
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-lg">No content available yet.</p>
        <p className="text-gray-400 dark:text-gray-500 mt-2">Content will appear here once it&apos;s added to your Google Drive folder.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contentItems.map((item) => (
        <article key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Link href={`/content/${item.slug}`}>
                {item.title}
              </Link>
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 ml-4">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(item.date), 'MMM dd, yyyy')}
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            {item.excerpt}
          </p>
          
          {item.tags && item.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 mb-4">
              <Tag className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              {item.tags.map((tag) => (
                <span 
                  key={tag}
                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <Link 
            href={`/content/${item.slug}`}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
          >
            Read more →
          </Link>
        </article>
      ))}
    </div>
  );
}