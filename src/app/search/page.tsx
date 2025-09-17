import { googleDriveService } from '@/lib/googleDrive';
import { ContentItem } from '@/types/content';
import { Suspense } from 'react';
import Header from '@/components/Header';
import SearchResults from '@/components/SearchResults';
import SearchFilters from '@/components/SearchFilters';

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 1800; // 30 minutes in seconds

interface SearchPageProps {
  searchParams: {
    q?: string;
    tag?: string;
    start?: string;
    end?: string;
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Search Content</h1>
          <p className="text-gray-600">Find specific content using keywords, tags, or date ranges.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Suspense fallback={<div>Loading filters...</div>}>
              <SearchFilters />
            </Suspense>
          </div>
          
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Loading search results...</div>}>
              <SearchResults 
                contentItems={contentItems} 
                searchParams={searchParams}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}