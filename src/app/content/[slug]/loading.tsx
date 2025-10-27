export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header Skeleton */}
      <div className="border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>

      <main className="relative">
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
          {/* Breadcrumb Skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
            <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>

          {/* Article Container */}
          <article className="sm:bg-white sm:dark:bg-gray-800 sm:rounded-2xl sm:shadow-lg sm:dark:shadow-2xl sm:border sm:border-gray-200 sm:dark:border-gray-700 p-0 sm:p-8 md:p-12 w-full overflow-hidden">
            {/* Article Width Container */}
            <div className="max-w-[720px] mx-auto w-full px-4 sm:px-0">
              <header className="mb-8 sm:mb-12 text-center border-b border-gray-200 dark:border-gray-700 pb-8 sm:pb-12">
                {/* Cover Image Skeleton */}
                <div className="mb-8 sm:mb-12 -mx-4 sm:mx-0">
                  <div className="w-full aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse"></div>
                </div>

                {/* Title Skeleton */}
                <div className="space-y-3 mb-6 sm:mb-8">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6 mx-auto"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6 mx-auto"></div>
                </div>

                {/* Meta Information Skeleton */}
                <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-6 space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>

                {/* Excerpt Skeleton */}
                <div className="max-w-2xl mx-auto space-y-3 mb-8">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6 mx-auto"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-4/6 mx-auto"></div>
                </div>

                {/* Tags Skeleton */}
                <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
                    ></div>
                  ))}
                </div>
              </header>

              {/* Content Skeleton */}
              <div className="space-y-6 mt-8">
                {/* Paragraph 1 */}
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
                </div>

                {/* Heading */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                </div>

                {/* Paragraph 2 */}
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
                </div>

                {/* Heading 2 */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                </div>

                {/* Paragraph 3 */}
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-5/6"></div>
                </div>
              </div>

              {/* Sharing Section Skeleton */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-0">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4"></div>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* Bottom Navigation Skeleton */}
          <div className="mt-16 sm:mt-20">
            <div className="text-center mb-8 py-8 border-t border-gray-200 dark:border-gray-700">
              <div className="h-12 w-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse mx-auto"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
