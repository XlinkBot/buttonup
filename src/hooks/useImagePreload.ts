'use client';

import { useEffect, useRef } from 'react';

interface UseImagePreloadOptions {
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number;
}

export function useImagePreload(
  images: string[],
  options: UseImagePreloadOptions = {}
) {
  const {
    enabled = true,
    rootMargin = '50px',
    threshold = 0.1
  } = options;
  
  const preloadedImages = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const preloadImage = (src: string) => {
      if (preloadedImages.current.has(src)) return;
      
      const img = new Image();
      img.src = src;
      preloadedImages.current.add(src);
    };

    // Preload images that are likely to be viewed soon
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const imgElement = entry.target as HTMLElement;
            const src = imgElement.dataset.preloadSrc;
            if (src) {
              preloadImage(src);
            }
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );

    // Find all elements with data-preload-src attribute
    const elementsToObserve = document.querySelectorAll('[data-preload-src]');
    elementsToObserve.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin, threshold]);

  // Preload critical images immediately
  useEffect(() => {
    if (!enabled) return;
    
    images.slice(0, 3).forEach((src) => {
      if (!preloadedImages.current.has(src)) {
        const img = new Image();
        img.src = src;
        preloadedImages.current.add(src);
      }
    });
  }, [images, enabled]);
}
