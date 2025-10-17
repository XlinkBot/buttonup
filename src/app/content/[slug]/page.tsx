import { fetchContentBySlug, fetchRecentArticles } from '@/lib/content-api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { ArrowLeft, Calendar, ArrowRight } from 'lucide-react';
import { ScrollToTopButton, ShareButtons } from '@/components/ClientButtons';
import TableOfContents from '@/components/TableOfContents';
import ReadingProgress from '@/components/ReadingProgress';
import CoverWithAudio from '@/components/CoverWithAudio';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import type { Metadata } from 'next';
import { generateLongTailKeywords, generateSeoDescription, generateBreadcrumbSchema } from '@/lib/seo-utils';

// Import highlight.js CSS for syntax highlighting - using dark theme
import 'highlight.js/styles/atom-one-dark.css';
import React from 'react';

export const revalidate = 300;

interface ContentPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate dynamic metadata for each content page
export async function generateMetadata({ params }: ContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = await fetchContentBySlug(slug);

  if (!content) {
    return {
      title: '页面未找到 | 创业洞察 ButtonUp',
      description: '抱歉，您要查找的页面不存在。'
    };
  }

  const pageUrl = `https://buttonup.cloud/content/${slug}`;
  const imageUrl = content.cover || '/og-image.png';
  
  // Generate SEO-optimized metadata
  const longTailKeywords = generateLongTailKeywords(content.title, content.tags || [], content.date);
  const seoDescription = generateSeoDescription(content.excerpt, content.tags || []);
  
  return {
    title: content.title,
    description: seoDescription,
    keywords: longTailKeywords.join(', '),
    authors: [{ name: "创业洞察 ButtonUp", url: "https://buttonup.cloud" }],
    openGraph: {
      title: content.title,
      description: content.excerpt,
      type: 'article',
      url: pageUrl,
      publishedTime: content.date,
      authors: ['创业洞察 ButtonUp'],
      tags: content.tags,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: content.title
        }
      ],
      siteName: '创业洞察 ButtonUp'
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.excerpt,
      images: [imageUrl],
      creator: '@buttonup_cloud'
    },
    alternates: {
      canonical: pageUrl
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  };
}

export default async function ContentPage({ params }: ContentPageProps) {
  const { slug } = await params;
  console.log(`📄 Loading content page for slug: ${slug}`);
  
  // Fetch content using backend API
  const content = await fetchContentBySlug(slug);

  if (!content) {
    console.log(`❌ Content not found for slug: ${slug}`);
    notFound();
  }

  console.log(`✅ Found content: ${content.cover}`);

  // Fetch recent articles for "其他好文" section
  const recentArticles = await fetchRecentArticles(slug, 3);

  // Generate SEO-optimized data for structured schema
  const pageUrl = `https://buttonup.cloud/content/${slug}`;
  const longTailKeywords = generateLongTailKeywords(content.title, content.tags || [], content.date);

  // Generate structured data for SEO with enhanced long-tail keywords
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": content.title,
    "description": content.excerpt,
    "image": content.cover ? [content.cover] : ["/og-image.png"],
    "datePublished": content.date,
    "dateModified": content.date,
    "author": {
      "@type": "Organization",
      "name": "创业洞察 ButtonUp",
      "url": "https://buttonup.cloud"
    },
    "publisher": {
      "@type": "Organization",
      "name": "创业洞察 ButtonUp",
      "logo": {
        "@type": "ImageObject",
        "url": "https://buttonup.cloud/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://buttonup.cloud/content/${slug}`
    },
    "keywords": longTailKeywords.join(', '),
    "articleSection": "AI创业洞察",
    "inLanguage": "zh-CN",
    // Add more SEO-friendly fields
    "wordCount": content.content.split(/\s+/).length,
    "timeRequired": `PT${Math.ceil(content.content.split(/\s+/).length / 200)}M`,
    "about": content.tags?.map(tag => ({
      "@type": "Thing",
      "name": tag
    })) || [],
    // Bing 特别关注的字段
    "genre": "AI创业",
    "audience": {
      "@type": "Audience",
      "audienceType": "AI创业者"
    },
    "isAccessibleForFree": true,
    "copyrightYear": new Date(content.date).getFullYear(),
    "copyrightHolder": {
      "@type": "Organization",
      "name": "创业洞察 ButtonUp"
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
    "description": "每日汇总Reddit上的AI创业讨论，为AI创业者提供最新AI洞察和趋势分析"
  };

  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "创业洞察 ButtonUp",
    "url": "https://buttonup.cloud",
    "description": "每日汇总Reddit上的AI创业讨论，为AI创业者提供最新AI洞察和趋势分析",
    "inLanguage": "zh-CN",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://buttonup.cloud/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  // Breadcrumb structured data for better SEO
  const breadcrumbStructuredData = generateBreadcrumbSchema([
    { name: "首页", url: "https://buttonup.cloud" },
    { name: format(new Date(content.date), 'yyyy-MM-dd'), url: `https://buttonup.cloud/archive?date=${content.date}` },
    { name: content.title, url: pageUrl }
  ]);

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

  // Normalize markdown: ensure proper handling of bold text formatting
  // This prevents issues with **text** being parsed incorrectly
  const normalizedContent = content.content
    // Ensure blank line before lines starting with **text** (standalone bold headings)
    .replace(/^(\*\*[^\n]+\*\*)(?=\n)/gm, '\n$1')
    .replace(/([^\n])\n(\*\*[^\n]+\*\*)(?=\n)/g, '$1\n\n$2')
    // Ensure proper spacing around bold text within paragraphs
    .replace(/([^\n])\n(\*\*[^*]+\*\*[^*\n]*)/g, '$1\n\n$2');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30  text-gray-900 dark:text-white transition-colors duration-300">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
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
          __html: JSON.stringify(websiteStructuredData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData)
        }}
      />
      <Header />
      
      <main className="relative">
        <ReadingProgress />
        <TableOfContents headings={headings} />

        {/* Main Content - Optimized Width for Reading */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-12 pb-8 sm:pb-12">
          {/* Breadcrumb Navigation */}
          <div className="mb-6 sm:mb-8">
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <Link href="/" className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors">首页</Link>
              <span>›</span>
              <span className="text-gray-900 dark:text-gray-100">{format(new Date(content.date), 'yyyy-MM-dd')}</span>
            </nav>
            <Link 
              href="/"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 font-medium transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回首页
            </Link>
          </div>


          {/* Article - Responsive Theme with Optimal Reading Width */}
          <article className="
            /* Mobile: No background, border, or shadow - seamless experience */
            sm:bg-white sm:dark:bg-gray-800 
            sm:rounded-2xl sm:shadow-lg sm:dark:shadow-2xl 
            sm:border sm:border-gray-200 sm:dark:border-gray-700 
            p-0 sm:p-8 md:p-12 
            w-full overflow-hidden
          ">
            {/* Article Width Container for Optimal Reading */}
            <div className="max-w-[720px] mx-auto w-full px-4 sm:px-0">
              <header className="mb-8 sm:mb-12 text-center border-b border-gray-200 dark:border-gray-700 pb-8 sm:pb-12 relative">
                {/* Hero Gradient Background - Hidden on mobile, visible on larger screens */}
                <div className="hidden sm:block absolute inset-0 bg-gradient-to-br from-gray-50 via-orange-50/50 to-orange-100/30  dark:to-orange-900/10 rounded-t-2xl -m-6 sm:-m-8 md:-m-12"></div>
                
                <div className="relative z-10">
                  {/* Cover Image with Audio */}
                  {content.cover && (
                    <div className="mb-8 sm:mb-12 -mx-4 sm:mx-0">
                      <CoverWithAudio
                        title={content.title}
                        cover={content.cover}
                        podcasturl={content.podcasturl}
                      />
                    </div>
                  )}
                  
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6 sm:mb-8 leading-[1.2] tracking-tight">
                {content.title}
              </h1>

                  {/* Enhanced Meta Information */}
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-6 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-orange-600 dark:text-orange-400" />
                <time dateTime={content.date} className="text-base sm:text-lg">
                  {format(new Date(content.date), 'yyyy年M月d日 EEEE', { locale: zhCN })}
                </time>
                    </div>
                    <span className="text-gray-500 dark:text-gray-600">•</span>
                    <span className="text-base sm:text-lg">5 min read</span>
              </div>

                  {/* Enhanced Excerpt */}
                  <div className="max-w-2xl mx-auto">
                    <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8 font-light">
                  {content.excerpt}
                </p>
              </div>

                  {/* Enhanced Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3">
                  {content.tags.map((tag) => (
                    <span 
                      key={tag}
                          className="inline-block bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm px-4 py-2 rounded-full font-medium border border-orange-200 dark:border-orange-600/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
                </div>
                
                {/* Decorative element - Hidden on mobile */}
                <div className="hidden sm:block absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-12 h-1 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
            </header>

            {/* Optimized prose styles for responsive reading */}
              <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  h1: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h1 id={id} className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-6 md:mb-8 mt-8 sm:mt-12 md:mt-16 first:mt-0  pl-4 sm:pl-6">
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <div className="relative mt-8 sm:mt-10 md:mt-12">
                        <h2 id={id} className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 md:mb-6  ">
                        {children}
                      </h2>
                      </div>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children);
                    const id = slugify(text);
                    return (
                      <h3 id={id} className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 md:mb-4 mt-6 sm:mt-8 md:mt-10 leading-[1.2] relative ">
                        {children}
                      </h3>
                    );
                  },
                  p: ({ children }) => {
                    // 检查段落是否只包含一个强调文本（作为标题使用）
                    const childArray = React.Children.toArray(children);
                    const nonWhitespaceChildren = childArray.filter(
                      (c) => !(typeof c === 'string' && c.trim() === '')
                    );
                    
                    // 如果段落只有一个strong元素，将其渲染为标题
                    if (nonWhitespaceChildren.length === 1) {
                      const onlyChild = nonWhitespaceChildren[0];
                      if (
                        React.isValidElement<{ children: React.ReactNode }>(onlyChild) &&
                        onlyChild.type === 'strong'
                      ) {
                        const titleChildren = onlyChild.props.children;
                        const titleText = React.Children.toArray(titleChildren)
                          .map((n) => (typeof n === 'string' ? n : ''))
                          .join(' ')
                          .trim();
                        const id = titleText ? slugify(titleText) : undefined;
                        return (
                          <h5 id={id} className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 md:mb-4 mt-6 sm:mt-8 md:mt-10 leading-[1.2] relative ">
                            {titleChildren}
                          </h5>
                        );
                      }
                    }
                    
                    // 默认段落：中文首行缩进
                    const textContent = String(children).trim();
                    const isChinese = /^[\u4e00-\u9fa5]/.test(textContent);
                    return (
                      <p className={`text-gray-800 dark:text-gray-200 leading-[1.65] mb-4 sm:mb-6 text-base sm:text-lg max-w-[65ch] ${isChinese ? 'indent-6 sm:indent-8' : ''}`}>
                        {children}
                      </p>
                    );
                  },
                  strong: ({ children }) => (
                    <strong className="font-bold text-gray-900 dark:text-gray-100">
                      {children}
                    </strong>
                  ),
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 underline decoration-orange-600/50 hover:decoration-orange-700 underline-offset-2 transition-colors duration-200"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match;
                    if (isInline) {
                      return (
                        <code className="bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-green-400 px-2 py-1 rounded text-sm font-mono border border-gray-300 dark:border-gray-600">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <div className="relative">
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-300 dark:border-gray-600">
                          {match?.[1] || 'code'}
                        </div>
                        <code className={`${className} block bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm leading-relaxed`} {...props}>
                          {children}
                        </code>
                      </div>
                    );
                  },
                  blockquote: ({ children }) => (
                    <div className="relative my-5 sm:my-6">
                      <blockquote className="border-l-2 border-orange-500 dark:border-orange-400/80 bg-orange-50/70 dark:bg-orange-900/15 pl-3 sm:pl-4 py-3 sm:py-4 italic text-sm sm:text-base text-gray-800 dark:text-gray-200 rounded-r-lg backdrop-blur-[2px] relative">
                        <div className="absolute top-1 sm:top-2 left-1 sm:left-2 text-orange-600 dark:text-orange-400 text-xl sm:text-2xl opacity-40">&quot;</div>
                        <div className="pl-2 sm:pl-3">{children}</div>
                        <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 text-orange-600 dark:text-orange-400 text-xl sm:text-2xl opacity-40 rotate-180">&quot;</div>
                      </blockquote>
                    </div>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mt-2 sm:mt-3 mb-5 sm:mb-6 text-gray-800 dark:text-gray-200 text-base sm:text-lg max-w-[65ch]">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 sm:pl-6 space-y-1.5 sm:space-y-2 mt-2 sm:mt-3 mb-5 sm:mb-6 text-gray-800 dark:text-gray-200 text-base sm:text-lg max-w-[65ch]">
                      {children}
                    </ol>
                  ),
                  hr: () => (
                    <div className="flex items-center my-12">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                      <div className="mx-4 w-3 h-3 bg-orange-600 dark:bg-orange-400 rounded-full"></div>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                    </div>
                  ),

                  table: ({ children }) => (
                    <div className="my-8 overflow-x-auto">
                      <table className="table-container">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="table-header">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="table-body">
                      {children}
                    </tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="table-row">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="table-header-cell">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="table-data-cell">
                      {children}
                    </td>
                  ),
                }}
              >
                {normalizedContent}
              </ReactMarkdown>
            </>
            
            {/* Sharing Section */}
            <div className="max-w-[720px] mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-0">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  喜欢这篇文章？分享给朋友吧！
                </div>
                <ShareButtons />
              </div>
            </div>

            {/* 其他好文 Section */}
            {recentArticles.length > 0 && (
              <div className="max-w-[720px] mx-auto mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                  其他好文
                </h3>
                <div className="space-y-4">
                  {recentArticles.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/content/${article.slug}`}
                      className="group block p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200"
                    >
                      <div className="flex items-start space-x-4">
                        {/* Article Number */}
                        <div className="flex-shrink-0 w-8 h-8 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        
                        {/* Article Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 mb-2">
                            {article.title}
                          </h4>
                          
                          {/* Article Meta */}
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                            <time dateTime={article.date}>
                              {format(new Date(article.date), 'yyyy年M月d日', { locale: zhCN })}
                            </time>
                            {article.tags && article.tags.length > 0 && (
                              <>
                                <span className="mx-2">•</span>
                                <span>{article.tags.slice(0, 2).join('、')}</span>
                              </>
                            )}
                          </div>
                          
                          {/* Article Excerpt */}
                          {article.excerpt && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                        </div>
                        
                        {/* Arrow Icon */}
                        <div className="flex-shrink-0">
                          <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-orange-500 dark:group-hover:text-orange-400 group-hover:translate-x-1 transition-all duration-200" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* View More Link */}
                <div className="mt-6 text-center">
                  <Link
                    href="/"
                    className="inline-flex items-center text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                  >
                    查看更多AI创业洞察
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            )}
            </div>
          </article>

          {/* Enhanced Bottom Navigation */}
          <div className="mt-16 sm:mt-20">
            {/* Brand Footer */}
            <div className="text-center mb-8 py-8 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-300 group shadow-lg hover:shadow-orange-500/25 hover:shadow-2xl transform hover:-translate-y-0.5"
              >
                <ArrowLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                返回全部内容
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <ScrollToTopButton />
    </div>
  );
}

// Using ISR (Incremental Static Regeneration) only
// Pages will be generated on-demand when first requested
// and then cached for subsequent requests until revalidation