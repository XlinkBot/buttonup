/**
 * 统一的SEO通知服务
 * 整合IndexNow和Google Search Console API
 * 在内容更新时自动通知搜索引擎
 */

import { indexNowService } from './indexnow';
import { googleSearchConsoleService } from './google-search-console';
import { revalidateTag } from 'next/cache';

interface SEONotificationOptions {
  contentSlug?: string;
  contentType?: 'content' | 'news' | 'all';
  specificUrls?: string[];
  skipIndexNow?: boolean;
  skipGoogle?: boolean;
  revalidateCache?: boolean;
}

interface SEONotificationResult {
  success: boolean;
  indexNow?: {
    success: boolean;
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    results?: any[];
    error?: string;
  };
  google?: {
    success: boolean;
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    results?: any[];
    error?: string;
  };
  cache?: {
    revalidated: boolean;
  };
}

/**
 * 统一的SEO通知函数
 * 同时触发IndexNow和Google Search Console通知
 */
export async function notifySearchEngines(
  options: SEONotificationOptions = {}
): Promise<SEONotificationResult> {
  console.log('🔄 Starting SEO notifications...', options);
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
  let urlsToNotify: string[] = [];

  // 构建要通知的URL列表
  if (options.specificUrls) {
    urlsToNotify = options.specificUrls;
  } else if (options.contentSlug) {
    // 单个内容页面
    const contentUrl = options.contentType === 'news' 
      ? `${baseUrl}/news/${options.contentSlug}`
      : `${baseUrl}/content/${options.contentSlug}`;
    
    urlsToNotify = [
      contentUrl,
      `${baseUrl}/`,
      options.contentType === 'news' ? `${baseUrl}/news` : `${baseUrl}/archive`,
      `${baseUrl}/sitemap.xml`
    ];
  } else {
    // 批量通知
    switch (options.contentType) {
      case 'content':
        urlsToNotify = [
          `${baseUrl}/`,
          `${baseUrl}/archive`,
          `${baseUrl}/sitemap.xml`
        ];
        break;
      case 'news':
        urlsToNotify = [
          `${baseUrl}/`,
          `${baseUrl}/news`,
          `${baseUrl}/sitemap.xml`
        ];
        break;
      case 'all':
      default:
        urlsToNotify = [
          `${baseUrl}/`,
          `${baseUrl}/archive`,
          `${baseUrl}/sitemap.xml`
        ];
        break;
    }
  }

  const result: SEONotificationResult = { success: false };

  // 1. 缓存重新验证
  if (options.revalidateCache !== false) {
    try {
      revalidateTag('notion-content');
      revalidateTag('content-list');
      result.cache = { revalidated: true };
      console.log('✅ Cache revalidated');
    } catch (error) {
      console.error('❌ Cache revalidation failed:', error);
      result.cache = { revalidated: false };
    }
  }

  // 2. IndexNow通知
  if (!options.skipIndexNow && indexNowService.isConfigured()) {
    try {
      console.log('📡 Sending IndexNow notifications...');
      const indexNowResults = await indexNowService.submitUrls(urlsToNotify);
      const successCount = indexNowResults.filter(r => r.success).length;
      
      result.indexNow = {
        success: successCount > 0,
        results: indexNowResults
      };
      
      console.log(`✅ IndexNow completed: ${successCount}/${indexNowResults.length} engines notified`);
    } catch (error) {
      console.error('❌ IndexNow failed:', error);
      result.indexNow = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  } else {
    console.log('⚠️ IndexNow skipped or not configured');
    result.indexNow = {
      success: false,
      error: options.skipIndexNow ? 'Skipped by option' : 'Not configured'
    };
  }

  // 3. Google Search Console通知
  if (!options.skipGoogle && googleSearchConsoleService.isConfigured()) {
    try {
      console.log('📡 Sending Google Search Console notifications...');
      const googleResults = await googleSearchConsoleService.submitUrls(urlsToNotify);
      const successCount = googleResults.filter(r => r.success).length;
      
      result.google = {
        success: successCount > 0,
        results: googleResults
      };
      
      console.log(`✅ Google Search Console completed: ${successCount}/${googleResults.length} URLs submitted`);
    } catch (error) {
      console.error('❌ Google Search Console failed:', error);
      result.google = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  } else {
    console.log('⚠️ Google Search Console skipped or not configured');
    result.google = {
      success: false,
      error: options.skipGoogle ? 'Skipped by option' : 'Not configured'
    };
  }

  // 判断整体成功状态
  result.success = !!(result.indexNow?.success || result.google?.success);
  
  console.log('🎯 SEO notifications completed:', {
    overall: result.success,
    indexNow: result.indexNow?.success,
    google: result.google?.success,
    cache: result.cache?.revalidated
  });

  return result;
}

/**
 * 内容发布时的自动通知
 */
export async function notifyContentPublished(contentSlug: string, contentType: 'content' | 'news' = 'content') {
  console.log(`📢 Content published notification: ${contentSlug} (${contentType})`);
  
  return notifySearchEngines({
    contentSlug,
    contentType,
    revalidateCache: true
  });
}

/**
 * 内容更新时的自动通知
 */
export async function notifyContentUpdated(contentSlug: string, contentType: 'content' | 'news' = 'content') {
  console.log(`📝 Content updated notification: ${contentSlug} (${contentType})`);
  
  return notifySearchEngines({
    contentSlug,
    contentType,
    revalidateCache: true
  });
}

/**
 * 批量内容更新时的通知
 */
export async function notifyBulkContentUpdate(contentType: 'content' | 'news' | 'all' = 'all') {
  console.log(`📦 Bulk content update notification: ${contentType}`);
  
  return notifySearchEngines({
    contentType,
    revalidateCache: true
  });
}

/**
 * 获取SEO通知服务状态
 */
export function getSEONotificationStatus() {
  return {
    indexNow: {
      configured: indexNowService.isConfigured(),
      keyFileUrl: indexNowService.getKeyFileUrl()
    },
    google: {
      configured: googleSearchConsoleService.isConfigured()
    },
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud'
  };
}

/**
 * 定时任务：自动检查并通知新内容
 * 这个函数可以被cron job或webhook调用
 */
export async function autoNotifyNewContent() {
  console.log('⏰ Auto notification check started...');
  
  try {
    // 获取最近的内容（这里需要根据你的数据源调整）
    const { fetchWeeklyContent: fetchAllContent } = await import('./content-api');
    const allContent = await fetchAllContent();
    
    // 获取最近24小时内的内容
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentContent = allContent.filter(item => {
      const contentDate = new Date(item.date);
      return contentDate > yesterday;
    });
    
    if (recentContent.length > 0) {
      console.log(`🆕 Found ${recentContent.length} recent content items, sending notifications...`);
      
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
      const urlsToNotify = new Set<string>();
      
      // 收集所有唯一的 URL
      recentContent.slice(0, 5).forEach(item => {
        urlsToNotify.add(`${baseUrl}/content/${item.slug}`);
      });
      
      // 添加基础 URL（只需要添加一次）
      urlsToNotify.add(`${baseUrl}/`);
      urlsToNotify.add(`${baseUrl}/archive`);
      urlsToNotify.add(`${baseUrl}/sitemap.xml`);
      urlsToNotify.add(`${baseUrl}/tools`);
      urlsToNotify.add(`${baseUrl}/tools/file-converter`);
      
      console.log(`📋 Total unique URLs to submit: ${urlsToNotify.size}`);
      
      // 一次性提交所有 URL
      const result = await notifySearchEngines({
        specificUrls: Array.from(urlsToNotify),
        revalidateCache: true
      });
      
      console.log(`✅ Auto notification completed: ${result.success ? 'successful' : 'failed'}`);
      
      return {
        success: result.success,
        processed: recentContent.length,
        urlsSubmitted: urlsToNotify.size
      };
    } else {
      console.log('📭 No recent content found, skipping notifications');
      return {
        success: true,
        processed: 0,
        successful: 0
      };
    }
    
  } catch (error) {
    console.error('❌ Auto notification failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
