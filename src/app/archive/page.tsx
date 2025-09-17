import { googleDriveService } from '@/lib/googleDrive';
import { ContentItem } from '@/types/content';
import Header from '@/components/Header';
import { format, parseISO, isBefore, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { Calendar, Archive, Tag } from 'lucide-react';

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 1800; // 30 minutes in seconds

export default async function ArchivePage() {
  console.log('📁 历史归档页面加载中...');
  
  // Fetch content using Google Drive service
  // Next.js ISR will handle caching and revalidation automatically
  let contentItems: ContentItem[] = [];
  
  try {
    const isInitialized = await googleDriveService.initialize();
    if (isInitialized) {
      contentItems = await googleDriveService.getAllContent();
    }
  } catch (error) {
    console.error('❌ Error fetching content for archive:', error);
    // Return empty array if error occurs, page will still render
  }
  
  console.log(`📁 Archive loaded ${contentItems.length} items`);
  
  // Filter content older than 7 days
  const oneWeekAgo = subDays(new Date(), 7);
  const archiveItems = contentItems.filter(item => {
    const itemDate = parseISO(item.date);
    return isBefore(itemDate, oneWeekAgo);
  });

  // Group archive content by year and month
  const groupedContent = archiveItems.reduce((acc, item) => {
    const date = parseISO(item.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (!acc[year]) {
      acc[year] = {};
    }
    
    if (!acc[year][month]) {
      acc[year][month] = [];
    }
    
    acc[year][month].push(item);
    return acc;
  }, {} as Record<number, Record<number, ContentItem[]>>);

  const years = Object.keys(groupedContent).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">历史归档</h1>
          <p className="text-sm sm:text-base text-gray-600">按日期浏览一周前的全部内容</p>
        </div>

        {archiveItems.length === 0 ? (
          <div className="mobile-card bg-white text-center py-8 sm:py-12">
            <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">暂无历史归档</h3>
            <p className="text-sm sm:text-base text-gray-500">当内容超过一周后会自动出现在此处</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {years.map((year) => {
              const yearData = groupedContent[Number(year)];
              const months = Object.keys(yearData).sort((a, b) => Number(b) - Number(a));
              
              return (
                <div key={year} className="mobile-card bg-white shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{year}</h2>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {months.map((month) => {
                      const monthData = yearData[Number(month)];
                      const monthName = format(new Date(Number(year), Number(month)), 'yyyy年M月', { locale: zhCN });
                      
                      return (
                        <div key={month}>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                            {monthName}（{monthData.length} 篇）
                          </h3>
                          
                          <div className="space-y-3">
                            {monthData.map((item) => (
                              <div key={item.id} className="border-l-2 border-gray-200 pl-3 sm:pl-4 py-2">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 hover:text-gray-600 transition-colors">
                                      <Link href={`/content/${item.slug}`} className="mobile-link">
                                        {item.title}
                                      </Link>
                                    </h4>
                                    <p className="prose-mobile text-gray-600 mt-1 line-clamp-2">
                                      {item.excerpt}
                                    </p>
                                    {item.tags && item.tags.length > 0 && (
                                      <div className="flex items-center flex-wrap gap-1 mt-2">
                                        <Tag className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                        {item.tags.slice(0, 3).map((tag) => (
                                          <span 
                                            key={tag}
                                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                        {item.tags.length > 3 && (
                                          <span className="text-xs text-gray-500">
                                            +{item.tags.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs sm:text-sm text-gray-500 ml-3 sm:ml-4 flex-shrink-0">
                                    {format(parseISO(item.date), 'M月d日', { locale: zhCN })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}