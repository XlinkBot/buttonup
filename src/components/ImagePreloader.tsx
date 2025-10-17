'use client';

import { useImagePreload } from '@/hooks/useImagePreload';
import { ContentItem } from '@/types/content';

interface ImagePreloaderProps {
  contentItems: ContentItem[];
}

export default function ImagePreloader({ contentItems }: ImagePreloaderProps) {
  // Extract image URLs from content items
  const imageUrls = contentItems
    .map(item => item.cover)
    .filter((cover): cover is string => Boolean(cover));

  // Use the preload hook
  useImagePreload(imageUrls, {
    enabled: true,
    rootMargin: '100px', // Start preloading when images are 100px away from viewport
    threshold: 0.1
  });

  return null; // This component doesn't render anything
}
