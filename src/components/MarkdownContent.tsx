'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/atom-one-dark.css';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .trim();
}

interface MarkdownContentProps {
  content: string;
}

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
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
            href={String(href || '')} 
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
      {content}
    </ReactMarkdown>
  );
}
