'use client';

import { ListTree } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export default function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // Calculate reading progress
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setReadingProgress(Math.min(scrolled, 100));

      // Find active heading
      const headingElements = headings
        .map(h => document.getElementById(h.id))
        .filter(Boolean);
        
      let currentHeading = null;
      
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const element = headingElements[i];
        if (element) {
          const rect = element.getBoundingClientRect();
          // Consider a heading active if it's within 100px of the top
          if (rect.top <= 100) {
            currentHeading = element;
            break;
          }
        }
      }

      if (currentHeading) {
        setActiveHeading(currentHeading.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Desktop Floating TOC - Positioned relative to content layout */}
      <aside className="hidden xl:block fixed top-1/2 -translate-y-1/2 w-64 z-10" 
             style={{ 
               left: 'max(2rem, calc((100vw - 56rem) / 2 - 17rem))'
             }}>
        <div className="toc-container max-h-[70vh] overflow-y-auto">
          <div className="toc-header">
            <ListTree className="w-5 h-5 mr-2 brand-primary" />
            <span>目录</span>
            <div className="ml-auto toc-progress-bar">
              <div 
                className="toc-progress-fill" 
                style={{ width: `${readingProgress}%` }}
              />
            </div>
          </div>
          <nav className="p-4">
            <ul className="space-y-2 text-sm">
              {headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? 'ml-4' : ''}>
                  <a 
                    href={`#${h.id}`} 
                    className={`toc-link ${
                      activeHeading === h.id ? 'toc-link-active' : 'toc-link-inactive'
                    }`}
                  >
                    <span className="flex items-center">
                      {h.level === 2 && (
                        <span className={`toc-dot-h2 ${
                          activeHeading === h.id ? 'toc-dot-h2-active' : 'toc-dot-h2-inactive'
                        }`} />
                      )}
                      {h.level === 3 && (
                        <span className={`toc-dot-h3 ${
                          activeHeading === h.id ? 'toc-dot-h3-active' : 'toc-dot-h3-inactive'
                        }`} />
                      )}
                      {h.text}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile TOC - Collapsible */}
      <div className="xl:hidden mb-6 sm:mb-8">
        <details className="toc-container">
          <summary className="toc-mobile-summary">
            <ListTree className="w-5 h-5 mr-3 brand-primary" />
            <span>目录</span>
            <div className="ml-auto flex items-center space-x-3">
              <div className="toc-progress-bar">
                <div 
                  className="toc-progress-fill" 
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <svg className="w-4 h-4 transition-transform brand-secondary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </summary>
          <nav className="toc-mobile-nav">
            <ul className="space-y-2 text-sm pt-4">
              {headings.map(h => (
                <li key={h.id} className={h.level === 3 ? 'ml-4' : ''}>
                  <a 
                    href={`#${h.id}`} 
                    className={`toc-link ${
                      activeHeading === h.id ? 'toc-link-active' : 'toc-link-inactive'
                    }`}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      </div>
    </>
  );
}
