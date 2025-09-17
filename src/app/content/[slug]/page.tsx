import { googleDriveService } from '@/lib/googleDrive';
import { ContentItem } from '@/types/content';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { ArrowLeft, Calendar, Tag, ListTree } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';

// Import highlight.js CSS for syntax highlighting
import 'highlight.js/styles/github.css';

// Enable ISR - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 60 * 60 * 4; // 30 minutes in seconds

interface ContentPageProps {
  params: {
    slug: string;
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  console.log(`📄 Loading content page for slug: ${params.slug}`);
  
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
    notFound();
  }
  
  const content = contentItems.find(item => item.slug === params.slug);

  if (!content) {
    console.log(`❌ Content not found for slug: ${params.slug}`);
    notFound();
  }

  console.log(`✅ Found content: ${content.title}`);

  // Build a simple table of contents (TOC) from markdown headings
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/<[^>]+>/g, '')
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  let match;
  while ((match = headingRegex.exec(content.content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    if (level <= 3) {
      headings.push({ id: slugify(text), text, level });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="relative">
        {/* Desktop Floating TOC - Fixed Position */}
        {headings.length > 0 && (
          <aside className="hidden xl:block fixed left-4 top-1/2 -translate-y-1/2 w-64 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border shadow-lg max-h-[70vh] overflow-y-auto">
              <div className="px-4 py-3 border-b flex items-center text-gray-900 font-semibold">
                <ListTree className="w-5 h-5 mr-2 text-blue-600" />
                目录
              </div>
              <nav className="p-4">
                <ul className="space-y-2 text-sm">
                  {headings.map(h => (
                    <li key={h.id} className={h.level === 3 ? 'ml-4' : ''}>
                      <a 
                        href={`#${h.id}`} 
                        className="block text-gray-700 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content - Centered */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
          {/* Back Button */}
          <div className="mb-6 sm:mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回首页
            </Link>
          </div>

          {/* Mobile TOC - Compact */}
          <div className="xl:hidden mb-6 sm:mb-8">
            {headings.length > 0 && (
              <details className="bg-white rounded-xl border shadow-sm">
                <summary className="px-4 sm:px-5 py-4 cursor-pointer hover:bg-gray-50 flex items-center text-gray-900 font-semibold">
                  <ListTree className="w-5 h-5 mr-3 text-blue-600" />
                  <span>目录</span>
                  <svg className="w-4 h-4 ml-auto transition-transform" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </summary>
                <nav className="px-4 sm:px-5 pb-4 border-t border-gray-100">
                  <ul className="space-y-2 text-sm pt-4">
                    {headings.map(h => (
                      <li key={h.id} className={h.level === 3 ? 'ml-4' : ''}>
                        <a 
                          href={`#${h.id}`} 
                          className="block text-gray-700 hover:text-blue-700 hover:bg-blue-50 px-2 py-2 rounded transition-colors"
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </details>
            )}
          </div>

          {/* Article - Centered Content */}
          <article className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8 md:p-12">
            <header className="mb-8 sm:mb-12 text-center border-b border-gray-100 pb-8 sm:pb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
                {content.title}
              </h1>

              {/* Meta Information */}
              <div className="flex items-center justify-center text-gray-600 mb-6">
                <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                <time dateTime={content.date} className="text-base sm:text-lg">
                  {format(new Date(content.date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
                </time>
              </div>

              {/* Excerpt */}
              <div className="max-w-3xl mx-auto">
                <p className="text-lg sm:text-xl text-gray-700 leading-relaxed mb-6">
                  {content.excerpt}
                </p>
              </div>

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
                  {content.tags.map((tag) => (
                    <span 
                      key={tag}
                      className="inline-block bg-gray-100 text-gray-700 text-sm px-4 py-2 rounded-full font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Optimized prose styles for reading */}
            <div className="prose prose-lg md:prose-xl max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-p:leading-relaxed prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:overflow-x-auto prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-img:rounded-xl prose-img:shadow-lg prose-ul:my-6 prose-ol:my-6 prose-li:my-2"
                 style={{ 
                   '--tw-prose-body': 'rgb(55 65 81)',
                   '--tw-prose-headings': 'rgb(17 24 39)',
                   '--tw-prose-lead': 'rgb(75 85 99)',
                   '--tw-prose-links': 'rgb(37 99 235)',
                   '--tw-prose-bold': 'rgb(17 24 39)',
                   '--tw-prose-counters': 'rgb(107 114 128)',
                   '--tw-prose-bullets': 'rgb(156 163 175)',
                   '--tw-prose-hr': 'rgb(229 231 235)',
                   '--tw-prose-quotes': 'rgb(17 24 39)',
                   '--tw-prose-quote-borders': 'rgb(229 231 235)',
                   '--tw-prose-captions': 'rgb(107 114 128)',
                   '--tw-prose-code': 'rgb(17 24 39)',
                   '--tw-prose-pre-code': 'rgb(229 231 235)',
                   '--tw-prose-pre-bg': 'rgb(17 24 39)',
                   '--tw-prose-th-borders': 'rgb(209 213 219)',
                   '--tw-prose-td-borders': 'rgb(229 231 235)',
                 } as React.CSSProperties}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  h1: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h1 id={id} className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 mt-12 sm:mt-16 first:mt-0 leading-tight">
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h2 id={id} className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-4 sm:mb-6 mt-10 sm:mt-12 leading-tight">
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h3 id={id} className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4 mt-8 sm:mt-10 leading-tight">
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => (
                    <p className="text-gray-800 leading-relaxed mb-6 text-lg">
                      {children}
                    </p>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    if (isInline) {
                      return (
                        <code className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-sm font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-6 py-4 my-8 italic text-lg text-gray-700 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside space-y-2 mb-6 pl-6 text-gray-800 text-lg">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside space-y-2 mb-6 pl-6 text-gray-800 text-lg">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                }}
              >
                {content.content}
              </ReactMarkdown>
            </div>
          </article>

          {/* Bottom Navigation */}
          <div className="mt-12 sm:mt-16 text-center">
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-medium rounded-xl transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回全部内容
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

// Generate static paths for all content at build time
export async function generateStaticParams() {
  console.log('🏗️ Generating static params for content pages...');
  
  try {
    // Fetch content at build time for static generation
    const isInitialized = await googleDriveService.initialize();
    if (!isInitialized) {
      console.log('❌ Google Drive not initialized, returning empty params');
      return [];
    }

    const contentItems = await googleDriveService.getAllContent();
    const params = contentItems.map((item) => ({
      slug: item.slug,
    }));
    
    console.log(`🏗️ Generated ${params.length} static params:`, params.map(p => p.slug));
    return params;
  } catch (error) {
    console.error('❌ Error generating static params:', error);
    return [];
  }
}