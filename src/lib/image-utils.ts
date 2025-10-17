/**
 * 图片缓存和优化工具函数
 */

interface ImageProxyOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
}

/**
 * 生成代理图片 URL 以启用缓存
 */
export function getProxiedImageUrl(originalUrl: string, options: ImageProxyOptions = {}): string {
  // 如果是本地图片，直接返回
  if (originalUrl.startsWith('/') || originalUrl.startsWith('data:')) {
    return originalUrl;
  }

  // 检查是否是外部图片
  const externalDomains = [
    'www.notion.so',
    'images.unsplash.com',
    'prod-files-secure.s3.us-west-2.amazonaws.com',
    's3.us-west-2.amazonaws.com'
  ];

  try {
    const url = new URL(originalUrl);
    const isExternal = externalDomains.includes(url.hostname);

    if (!isExternal) {
      return originalUrl;
    }

    // 构建代理 URL
    const proxyUrl = new URL('/api/image-proxy', 
      typeof window !== 'undefined' ? window.location.origin : 'https://buttonup.cloud'
    );
    
    // 直接设置 URL，不进行额外编码（浏览器会自动处理）
    proxyUrl.searchParams.set('url', originalUrl);
    
    if (options.width) {
      proxyUrl.searchParams.set('w', options.width.toString());
    }
    
    if (options.height) {
      proxyUrl.searchParams.set('h', options.height.toString());
    }
    
    if (options.quality) {
      proxyUrl.searchParams.set('q', options.quality.toString());
    }

    if (options.format) {
      proxyUrl.searchParams.set('f', options.format);
    }

    return proxyUrl.toString();

  } catch (error) {
    console.warn('Failed to parse image URL:', originalUrl, error);
    return originalUrl;
  }
}

/**
 * 检查图片是否需要代理
 */
export function shouldProxyImage(url: string): boolean {
  if (!url || url.startsWith('/') || url.startsWith('data:')) {
    return false;
  }

  const externalDomains = [
    'www.notion.so',
    'images.unsplash.com',
    'prod-files-secure.s3.us-west-2.amazonaws.com',
    's3.us-west-2.amazonaws.com'
  ];

  try {
    const urlObj = new URL(url);
    return externalDomains.includes(urlObj.hostname);
  } catch {
    return false;
  }
}

/**
 * 生成响应式图片 srcset
 */
export function generateSrcSet(originalUrl: string, widths: number[]): string {
  if (!shouldProxyImage(originalUrl)) {
    return '';
  }

  return widths
    .map(width => {
      const proxiedUrl = getProxiedImageUrl(originalUrl, { width, quality: 75 });
      return `${proxiedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * 预加载关键图片
 */
export function preloadImage(url: string, options: ImageProxyOptions = {}): void {
  if (typeof window === 'undefined') return;

  const proxiedUrl = shouldProxyImage(url) ? getProxiedImageUrl(url, options) : url;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = proxiedUrl;
  
  if (options.format) {
    link.type = `image/${options.format}`;
  }

  document.head.appendChild(link);
}

/**
 * 图片缓存状态检查
 */
export async function checkImageCache(url: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const proxiedUrl = shouldProxyImage(url) ? getProxiedImageUrl(url) : url;
    const response = await fetch(proxiedUrl, { method: 'HEAD' });
    
    const cacheControl = response.headers.get('cache-control');
    return cacheControl ? cacheControl.includes('max-age') : false;
  } catch {
    return false;
  }
}
