import { ContentItem } from '@/types/content';
import { googleDriveService } from '@/lib/googleDrive';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
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
  
  // Get today's date and content
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayContent = groupedByDate[today] || [];
  const otherDates = sortedDates.filter(date => date !== today);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6 md:pt-8 pb-6 sm:pb-8">
        {/* Hero Section - Simplified */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-center items-center mb-4 sm:mb-6">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-gray-600 mb-2 sm:mb-3 sm:mr-4" />
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 tracking-tight mb-1 sm:mb-2">
                ButtonUp
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600">
                Startup Ideas & Discussion
              </p>
            </div>
          </div>
          
          {/* Search Bar - Mobile First */}
          <div className="max-w-full sm:max-w-md mx-auto">
            <SearchBar />
          </div>
        </div>

        {/* Today's Hot Discussions - Prominent Section */}
        {todayContent.length > 0 && (
          <div className={`mb-6 sm:mb-8 md:mb-12 px-3 sm:px-0 ${todayContent.length === 1 ? 'md:max-w-4xl md:mx-auto' : ''}`}>
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <div className="inline-flex items-center bg-gray-100 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-3 sm:mb-4">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs sm:text-sm font-semibold text-gray-800">今日热点</span>
              </div>
            </div>
            
            <div className={`highlight-grid grid gap-4 sm:gap-6 md:gap-8 ${
              todayContent.length === 1 
                ? 'grid-cols-1' 
                : todayContent.length === 2 
                  ? 'grid-cols-1 md:grid-cols-2' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {todayContent.map((item, index) => (
                <Link 
                  key={item.id}
                  href={`/content/${item.slug}`}
                  className="group highlight-card"
                >
                  <div className={`bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col group-hover:scale-[1.02] group-hover:-translate-y-1 ${
                    todayContent.length === 1 ? 'sm:min-h-[400px] md:min-h-[500px]' : ''
                  }`}>
                    {/* Card Header */}
                    <div className={`bg-gray-50 ${
                      todayContent.length === 1 
                        ? 'p-4 sm:p-6 md:p-8 pb-3 sm:pb-4 md:pb-6' 
                        : 'p-4 sm:p-6 pb-3 sm:pb-4'
                    }`}>
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                          #{index + 1} 热点
                        </div>
                        <TrendingUp className={`text-gray-600 ${
                          todayContent.length === 1 ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4 sm:w-5 sm:h-5'
                        }`} />
                      </div>
                      <h3 className={`font-bold text-gray-900 leading-tight group-hover:text-gray-700 transition-colors ${
                        todayContent.length === 1 
                          ? 'text-lg sm:text-xl md:text-2xl lg:text-3xl' 
                          : 'text-base sm:text-lg md:text-xl'
                      }`}>
                        {item.title}
                      </h3>
                    </div>
                    
                    {/* Card Content */}
                    <div className={`flex-1 flex flex-col ${
                      todayContent.length === 1 
                        ? 'p-4 sm:p-6 md:p-8 pt-3 sm:pt-4 md:pt-6' 
                        : 'p-4 sm:p-6 pt-3 sm:pt-4'
                    }`}>
                      <p className={`text-gray-600 leading-relaxed mb-4 sm:mb-5 md:mb-6 flex-1 ${
                        todayContent.length === 1 
                          ? 'text-sm sm:text-base md:text-lg line-clamp-4 sm:line-clamp-5 md:line-clamp-6' 
                          : 'text-sm sm:text-base line-clamp-3 sm:line-clamp-4'
                      }`}>
                        {item.excerpt}
                      </p>
                      
                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className={`flex flex-wrap gap-1.5 sm:gap-2 ${
                          todayContent.length === 1 ? 'mb-4 sm:mb-5 md:mb-6' : 'mb-3 sm:mb-4'
                        }`}>
                          {item.tags.slice(0, todayContent.length === 1 ? 5 : 3).map(tag => (
                            <span 
                              key={tag} 
                              className={`bg-gray-100 text-gray-700 rounded-full font-medium ${
                                todayContent.length === 1 
                                  ? 'text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2' 
                                  : 'text-xs px-2 sm:px-3 py-1'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > (todayContent.length === 1 ? 5 : 3) && (
                            <span className={`text-gray-500 ${
                              todayContent.length === 1 ? 'text-xs sm:text-sm' : 'text-xs'
                            }`}>
                              +{item.tags.length - (todayContent.length === 1 ? 5 : 3)}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Read More */}
                      <div className={`flex items-center font-medium text-gray-600 group-hover:text-gray-800 ${
                        todayContent.length === 1 ? 'text-sm sm:text-base' : 'text-sm'
                      }`}>
                        阅读全文
                        <ArrowRight className={`ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform ${
                          todayContent.length === 1 ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-4 h-4'
                        }`} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Other Content Section */}
        {otherDates.length > 0 && (
          <div className={`mb-6 sm:mb-8 md:mb-12 px-3 sm:px-0 ${todayContent.length === 1 ? 'md:max-w-4xl md:mx-auto' : ''}`}>
            {/* Section Title */}
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-gray-500" />
                本周其他洞察
              </h3>
              <p className="text-gray-600 mt-2">回顾本周的其他创业讨论和市场动态</p>
            </div>
            
            <div className="space-y-6 sm:space-y-8">
              {otherDates.map(date => (
                <div key={date} id={`date-${date}`} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Date Header - Clean Design */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-25 px-4 sm:px-6 py-5 sm:py-6">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-gray-900 rounded-full mr-3"></div>
                      <span>
                        {format(parseISO(date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
                      </span>
                    </h3>
                  </div>
                  {/* Content Items */}
                  <div className="p-4 sm:p-6">
                    <div className="space-y-6">
                      {groupedByDate[date].map((item, index) => (
                        <div key={item.id} className={`${index > 0 ? 'pt-6' : ''}`}>
                          {index > 0 && <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-6"></div>}
                          <Link 
                            href={`/content/${item.slug}`}
                            className="block group p-4 -m-4 rounded-xl hover:bg-gray-50 transition-all duration-200"
                          >
                            <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 group-hover:text-gray-700 transition-colors leading-snug">
                              {item.title}
                            </h4>
                            <p className="prose-mobile text-gray-600 leading-relaxed mb-4 line-clamp-3">
                              {item.excerpt}
                            </p>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map(tag => (
                                  <span 
                                    key={tag} 
                                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium"
                                  >
                                    {tag}
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

            {/* Mobile Date Navigation - Clean floating design */}
            <div className="lg:hidden mt-8">
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h4 className="text-sm font-medium text-gray-700 flex items-center mb-4">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
                  快速导航
                </h4>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1">
                  {otherDates.map(date => (
                    <a 
                      key={date}
                      href={`#date-${date}`}
                      className="flex-shrink-0 bg-gray-100 hover:bg-gray-200 px-4 py-3 rounded-xl transition-all duration-200 touch-target group"
                    >
                      <div className="text-xs font-semibold text-gray-800 whitespace-nowrap group-hover:text-gray-900">
                        {format(parseISO(date), 'M月d日', { locale: zhCN })}
                      </div>
                      <div className="text-xs text-gray-600 mt-0.5">
                        {groupedByDate[date].length}篇
                      </div>
                    </a>
                  ))}
                </div>
                <div className="mt-5 pt-4">
                  <Link 
                    href="/archive" 
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors group"
                  >
                    查看历史归档
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Only show if no content at all */}
        {otherDates.length === 0 && todayContent.length === 0 && (
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm text-center">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">暂无本周内容</h3>
            <p className="text-gray-600">请稍后查看最新的创业讨论汇总</p>
          </div>
        )}

        {/* RSS link moved to top bar */}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 mt-8 sm:mt-12 md:mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center text-gray-600">
          <p className="text-sm sm:text-base">&copy; 2024 创业洞察 buttonup. 汇总创业智慧，洞察行业趋势.</p>
          <p className="mt-2">
            <a href="/llm.txt" className="mobile-link text-blue-600 hover:text-blue-800 active:text-blue-900 touch-target text-sm sm:text-base">
              llms
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}