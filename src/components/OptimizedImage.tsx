'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { getProxiedImageUrl, shouldProxyImage } from '@/lib/image-utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  sizes?: string;
  style?: React.CSSProperties;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  loading = 'lazy',
  sizes,
  style,
  placeholder = 'blur',
  blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==",
  fetchPriority = 'auto'
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [optimizedSrc, setOptimizedSrc] = useState(src);

  // 优化图片 URL 以启用缓存
  useEffect(() => {
    if (shouldProxyImage(src)) {
      const proxiedUrl = getProxiedImageUrl(src, {
        width,
        height,
        quality: priority ? 85 : 75, // 优先图片使用更高质量
      });
      setOptimizedSrc(proxiedUrl);
    } else {
      setOptimizedSrc(src);
    }
  }, [src, width, height, priority]);

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}
        style={{ width, height, ...style }}
      >
        <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div 
          className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}
          style={style}
        />
      )}
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        {...(!priority && { loading })} // 只有在非优先级时才设置 loading
        sizes={sizes}
        style={style}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onError={() => setHasError(true)}
        onLoad={() => setIsLoading(false)}
        fetchPriority={fetchPriority}
      />
    </div>
  );
}
