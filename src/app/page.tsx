import { ContentItem } from '@/types/content';
import { googleDriveService } from '@/lib/googleDrive';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import SubscriptionForm from '@/components/SubscriptionForm';
import { format, parseISO, isAfter, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { Calendar, TrendingUp, ArrowRight } from 'lucide-react';

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 1800; // 30 minutes in seconds

export default async function Home() {
  console.log('🏠 创业洞察首页加载中...');
  
  // Fetch content using Google Drive service
  // Next.js ISR will handle caching and revalidation automatically
  let contentItems: ContentItem[] = [];
  
  try {
    const isInitialized = await googleDriveService.initialize();
  if (isInitialized) {
    contentItems = await googleDriveService.getAllContent();
    }
  } catch (error) {
    console.error('❌ Error fetching content:', error);
    // Return empty array if error occurs, page will still render
  }
  
  console.log(`📂 Content items loaded: ${contentItems.length}`);
  
  // Filter content from the last 7 days
  const oneWeekAgo = subDays(new Date(), 7);
  const recentItems = contentItems.filter(item => {
    const itemDate = parseISO(item.date);
    return isAfter(itemDate, oneWeekAgo);
  });
  
  // Group by date for better display
  const groupedByDate = recentItems.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, ContentItem[]>);
  
  // Sort dates in descending order
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-6 md:pt-8 pb-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center mb-6">
            <TrendingUp className="w-16 h-16 text-gray-600 mr-4" />
            <div>
              <h1 className="text-5xl font-semibold text-gray-900 tracking-tight mb-2">
                ButtonUp
              </h1>
              <p className="text-[18px] md:text-xl text-gray-600">
                Startup Ideas & Discussion
              </p>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-4">
            <SearchBar />
          </div>
          {/* Subscription Form */}
          <div className="max-w-md mx-auto">
            <SubscriptionForm />
          </div>
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex gap-8">
          {/* Left Sidebar - Date Navigation */}
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border sticky top-8">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                  本周创业洞察
                </h3>
                <div className="mt-2">
                  <Link 
                    href="/archive" 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    查看历史归档
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              </div>
              
              {sortedDates.length === 0 ? (
                <div className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">暂无本周内容</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {sortedDates.map(date => (
                    <a 
                      key={date}
                      href={`#date-${date}`}
                      className="block p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {format(parseISO(date), 'M月d日 EEEE', { locale: zhCN })}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {groupedByDate[date].length} 篇内容
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {sortedDates.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-sm border text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无本周内容</h3>
                <p className="text-gray-600">请稍后查看最新的创业讨论汇总</p>
              </div>
            ) : (
              <div className="space-y-8">
                {sortedDates.map(date => (
                  <div key={date} id={`date-${date}`} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                        {format(parseISO(date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-6">
                        {groupedByDate[date].map(item => (
                          <div key={item.id} className="border-l-4 border-gray-200 pl-4">
                            <Link 
                              href={`/content/${item.slug}`}
                              className="block hover:bg-gray-50 -m-4 p-4 rounded-r-lg transition-colors"
                            >
                              <h4 className="text-lg font-medium text-gray-900 mb-3 hover:text-blue-600 transition-colors">
                                {item.title}
                              </h4>
                              <p className="text-gray-600 leading-relaxed mb-4 line-clamp-3">
                                {item.excerpt}
                              </p>
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {item.tags.map(tag => (
                                    <span 
                                      key={tag} 
                                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RSS link moved to top bar */}
      </main>

      <footer className="bg-white border-t border-gray-200 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 创业洞察 buttonup. 汇总创业智慧，洞察行业趋势.</p>
          <p className="mt-2">
            <a href="/llm.txt" className="text-blue-600 hover:text-blue-800">
              llms
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}