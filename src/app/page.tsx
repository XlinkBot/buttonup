import { ContentItem } from "@/types/content";
import { fetchAllContent } from "@/lib/content-api";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { format, parseISO, isAfter, subDays } from "date-fns";
import { zhCN } from "date-fns/locale";
import Link from "next/link";
import { Calendar, ArrowRight, Flame, BarChart3, Zap, Newspaper, TrendingUp } from "lucide-react";
import Image from "next/image";

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 300;

// Add metadata for homepage to override layout defaults
export const metadata = {
  alternates: {
    canonical: 'https://buttonup.cloud/',
  },
};

export default async function Home() {
  console.log("🏠 创业洞察首页加载中...");

  // Fetch content using backend API
  const contentItems = await fetchAllContent();

  console.log(`📂 Content items loaded: ${contentItems.length}`);

  // Filter content from the last 7 days
  const oneWeekAgo = subDays(new Date(), 7);
  const recentItems = contentItems.filter((item) => {
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
  const sortedDates = Object.keys(groupedByDate).sort((a, b) =>
    b.localeCompare(a)
  );

  // Get today's date and content
  const today = format(new Date(), "yyyy-MM-dd");
  const todayContent = groupedByDate[today] || [];
  const otherDates = sortedDates.filter((date) => date !== today);

  // Generate structured data for homepage
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "创业洞察 ButtonUp",
    "url": "https://buttonup.cloud",
    "description": "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析",
    "inLanguage": "zh-CN",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://buttonup.cloud/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "创业洞察 ButtonUp",
    "url": "https://buttonup.cloud",
    "logo": "https://buttonup.cloud/logo.png",
    "sameAs": [
      "https://twitter.com/buttonup_co"
    ],
    "description": "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析"
  };

  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "创业洞察 ButtonUp",
    "description": "每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析",
    "url": "https://buttonup.cloud",
    "inLanguage": "zh-CN",
    "author": {
      "@type": "Organization",
      "name": "创业洞察 ButtonUp"
    },
    "publisher": {
      "@type": "Organization",
      "name": "创业洞察 ButtonUp",
      "logo": {
        "@type": "ImageObject",
        "url": "https://buttonup.cloud/logo.png"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(blogStructuredData)
        }}
      />
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
        {/* F-Type Layout: Logo First */}
        <div className="mb-8 sm:mb-12">
          {/* Main Title - SEO H1 */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3 sm:mb-4">
              创业洞察 ButtonUp
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl">
              每日汇总Reddit上的创业讨论，为创业者提供最新洞察和趋势分析
            </p>
          </div>

          {/* Main Search Task - Prominent */}
          <div className="max-w-2xl">
            <SearchBar />
          </div>

          {/* Quick Access to News - Eye-catching Design - Mobile Only */}
          <div className="mt-6 sm:mt-8 md:hidden">
            <Link 
              href="/news"
              className="group relative block bg-white dark:bg-gray-800 rounded-2xl border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 bg-blue-50 dark:bg-blue-950/20 opacity-50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 dark:bg-blue-900/30 rounded-full -translate-y-16 translate-x-16 opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full translate-y-10 -translate-x-10 opacity-40"></div>
              
              {/* Content */}
              <div className="relative px-5 py-4 sm:px-6 sm:py-4">
                <div className="flex items-center">
                  {/* Icon with animated background */}
                  <div className="relative">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500 dark:bg-blue-600 rounded-xl flex items-center justify-center mr-4 sm:mr-5 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 transition-all duration-300 group-hover:scale-110 shadow-lg">
                      <Newspaper className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    {/* Pulse effect */}
                    <div className="absolute inset-0 w-12 h-12 sm:w-14 sm:h-14 bg-blue-400 dark:bg-blue-500 rounded-xl animate-ping opacity-20"></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mr-2">
                        AI 聊财经
                      </h3>
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                        测试
                      </span>
                    </div>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                      <span className="text-sm">立即体验</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                  
                  {/* Trending indicator */}
                  <div className="hidden sm:flex flex-col items-center ml-4">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mb-1"></div>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">热门</span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Today's Hot - Redesigned Cards */}
        {todayContent.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center mb-6 sm:mb-8">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-orange-600 dark:text-orange-400" />
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  今日热点
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1">
                  ・更新于 {format(new Date(), "HH:mm")}
                </p>
              </div>
              <div className="ml-2 sm:ml-3 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse bg-orange-600 dark:bg-orange-400"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {todayContent.map((item, index) => {
                const icons = [Flame, BarChart3, Zap];
                const IconComponent = icons[index % 3];

                return (
                  <Link
                    key={item.id}
                    href={`/content/${item.slug}`}
                    className="group w-full"
                  >
                    <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-400 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden h-full flex flex-col group-hover:-translate-y-1 min-h-[280px] sm:min-h-[320px]">
                      {/* Cover Image */}
                      {item.cover && (
                        <div className="relative overflow-hidden">
                          <Image
                            src={item.cover}
                            alt={item.title}
                            className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                            style={{
                              aspectRatio: "16/9",
                              objectPosition: "center",
                            }}
                            width={500}
                            height={300}
                          />
                          {/* Overlay gradient for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
                          {/* Badge overlay */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className="text-xs font-semibold text-white bg-orange-600/90 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full shadow-lg">
                              #{index + 1}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Card Header with Icon */}
                      <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                        {!item.cover && (
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex items-center">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                                <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400" />
                              </div>
                              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 sm:px-3 py-1 rounded-full">
                                #{index + 1}
                              </span>
                            </div>
                          </div>
                        )}
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors line-clamp-2 mb-3 sm:mb-4">
                          {item.title}
                        </h3>
                      </div>

                      {/* Card Content */}
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 flex flex-col">
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-3 sm:mb-4 flex-1 line-clamp-3">
                          {item.excerpt}
                        </p>

                        {/* Tags */}
                        {(item.tags && item.tags.length > 0) || item.podcasturl ? (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                            {/* Podcast tag if audio exists */}
                            {item.podcasturl && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 sm:px-3 py-1 rounded-full font-medium border border-orange-200 dark:border-orange-600/30">
                                🎧 播客
                              </span>
                            )}
                            {/* Regular tags */}
                            {item.tags && item.tags.slice(0, item.podcasturl ? 2 : 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 sm:px-3 py-1 rounded-full font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {/* Show remaining count */}
                            {item.tags && item.tags.length > (item.podcasturl ? 2 : 3) && (
                              <span className="text-xs text-gray-500">
                                +{item.tags.length - (item.podcasturl ? 2 : 3)}
                              </span>
                            )}
                          </div>
                        ) : null}

                        {/* Bottom aligned Read More button */}
                        <div className="pt-3 sm:pt-4 mt-auto">
                          <button className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-orange-200 dark:border-orange-600 rounded text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-500 transition-colors">
                            阅读全文
                            <ArrowRight className="ml-1.5 sm:ml-2 w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Other Content - Simplified */}
        {otherDates.length > 0 && (
          <div className="mb-12">
            {/* Section Title */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-orange-500 dark:text-orange-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  本周其他洞察
                </h2>
              </div>
              <Link
                href="/archive"
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
              >
                查看全部 →
              </Link>
            </div>

            {/* Simplified list view for other content */}
            <div className="space-y-6">
              {otherDates.slice(0, 3).map(
                (
                  date // Show the most recent 3 other dates
                ) => (
                  <div
                    key={date}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                  >
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {format(parseISO(date), "MMMM d, yyyy", {
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {groupedByDate[date].slice(0, 3).map(
                          (
                            item // Show max 3 items
                          ) => (
                            <Link
                              key={item.id}
                              href={`/content/${item.slug}`}
                              className="block group"
                            >
                              <div className="flex items-start space-x-4 p-4 -m-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                {/* Cover Image Thumbnail */}
                                {item.cover && (
                                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600">
                                    <Image
                                      src={item.cover}
                                      alt={item.title}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                      width={80}
                                      height={80}
                                    />
                                  </div>
                                )}

                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors mb-2 line-clamp-2">
                                    {item.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                                    {item.excerpt}
                                  </p>
                                  {(item.tags && item.tags.length > 0) || item.podcasturl ? (
                                    <div className="flex flex-wrap gap-1">
                                      {/* Podcast tag if audio exists */}
                                      {item.podcasturl && (
                                        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full font-medium">
                                          🎧 播客
                                        </span>
                                      )}
                                      {/* Regular tags */}
                                      {item.tags && item.tags.slice(0, item.podcasturl ? 1 : 2).map((tag) => (
                                        <span
                                          key={tag}
                                          className="text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-1" />
                              </div>
                            </Link>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Empty State - Only show if no content at all */}
        {otherDates.length === 0 && todayContent.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              暂无本周内容
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              请稍后查看最新的创业讨论汇总
            </p>
          </div>
        )}

        {/* RSS link moved to top bar */}
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 py-6 sm:py-8 mt-8 sm:mt-12 md:mt-16">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 text-center text-gray-600 dark:text-gray-400">
          <div className="space-y-3">
            {/* Company description and contact in one line */}
            <p className="text-sm">
              &copy; 2024 创业洞察 buttonup. 汇总创业智慧，洞察行业趋势.
              <span className="mx-2">|</span>
              <a href="mailto:myladyyang@gmail.com" className="text-sm">
                myladyyang@gmail.com
              </a>{" "}
              |{" "}
              <a
                href="/llm.txt"
                className="mobile-link text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 active:text-blue-900 dark:active:text-blue-200 touch-target"
              >
                llms
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
