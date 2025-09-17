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
export const revalidate = 1800; // 30 minutes in seconds

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
      
      <main className="max-w-6xl mx-auto px-4 pt-6 md:pt-8 pb-8">
        <div className="mb-6">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Link>
        </div>

        <div className="flex gap-8">
          {/* Sidebar: TOC */}
          <aside className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 rounded-lg border shadow-sm">
              <div className="px-4 py-3 border-b flex items-center text-gray-900 font-semibold">
                <ListTree className="w-5 h-5 mr-2 text-blue-600" />
                目录
              </div>
              <nav className="p-4">
                {headings.length === 0 ? (
                  <p className="text-sm text-gray-500">无可用目录</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {headings.map(h => (
                      <li key={h.id} className={h.level === 3 ? 'ml-4' : ''}>
                        <a href={`#${h.id}`} className="text-gray-700 hover:text-blue-700">
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </nav>
            </div>
          </aside>

          {/* Article */}
          <article className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <header className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{content.title}</h1>

              {/* Meta & Summary card */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center text-gray-600 mb-3">
                  <Calendar className="w-5 h-5 mr-2 text-gray-500" />
                  <time dateTime={content.date}>
                    {format(new Date(content.date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
                  </time>
                </div>
                <div className="text-gray-700 leading-relaxed">
                  {content.excerpt}
                </div>
                {content.tags && content.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    <Tag className="w-5 h-5 text-gray-400" />
                    {content.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </header>

            <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-a:text-blue-600 hover:prose-a:text-blue-800">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  h1: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h1 id={id} className="text-3xl font-bold text-gray-900 mb-6 mt-8 first:mt-0">
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h2 id={id} className="text-2xl font-semibold text-gray-900 mb-4 mt-8">
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h3 id={id} className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => (
                    <p className="text-gray-800 leading-relaxed mb-4">
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
                    <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3 my-4 italic">
                      {children}
                    </blockquote>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 mb-4 text-gray-800">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-800">
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
        </div>

        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            ← 返回全部内容
          </Link>
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