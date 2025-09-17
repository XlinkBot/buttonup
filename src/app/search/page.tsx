import { googleDriveService } from '@/lib/googleDrive';
import { ContentItem } from '@/types/content';
import { Suspense } from 'react';
import Header from '@/components/Header';
import SearchResults from '@/components/SearchResults';
import SearchFilters from '@/components/SearchFilters';

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 14400; // 4 hours in seconds

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    tag?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const searchParamsData = await searchParams;
  console.log('🔍 Loading search page with Next.js ISR...');
  
  // Fetch content using Google Drive service
  // Next.js ISR will handle caching and revalidation automatically
  let contentItems: ContentItem[] = [];
  
  try {
    const isInitialized = await googleDriveService.initialize();
    if (isInitialized) {
      contentItems = await googleDriveService.getAllContent();
    }
  } catch (error) {
    console.error('❌ Error fetching content for search:', error);
    // Return empty array if error occurs, page will still render
  }
  
  console.log(`🔍 Search loaded ${contentItems.length} items`);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Search Content</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">Find specific content using keywords, tags, or date ranges.</p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Suspense fallback={<div className="text-gray-500 dark:text-gray-400 text-sm p-4">加载筛选器...</div>}>
              <SearchFilters />
            </Suspense>
          </div>
          
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Suspense fallback={<div className="text-gray-500 dark:text-gray-400 text-sm p-4">加载搜索结果...</div>}>
              <SearchResults 
                contentItems={contentItems} 
                searchParams={searchParamsData}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}