/**
 * Auto IndexNow Integration
 * 自动IndexNow集成，在内容更新时触发搜索引擎通知
 */

import { indexNowService } from './indexnow';

interface AutoIndexNowOptions {
  contentType?: 'content' | 'news' | 'all';
  specificUrls?: string[];
  skipIndexNow?: boolean;
}

/**
 * 自动触发IndexNow通知
 * 在内容发布、更新或删除时调用此函数
 */
export async function triggerAutoIndexNow(
  options: AutoIndexNowOptions = {}
): Promise<{
  success: boolean;
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  results?: any[];
  error?: string;
}> {
  // 如果明确跳过IndexNow或未配置，则直接返回
  if (options.skipIndexNow || !indexNowService.isConfigured()) {
    return { 
      success: true, 
      error: options.skipIndexNow ? 'Skipped by option' : 'IndexNow not configured' 
    };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
    let urlsToSubmit: string[] = [];

    if (options.specificUrls) {
      // 使用指定的URLs
      urlsToSubmit = options.specificUrls;
    } else {
      // 根据内容类型生成URLs
      switch (options.contentType) {
        case 'content':
          urlsToSubmit = [
            `${baseUrl}/`,
            `${baseUrl}/archive`,
            `${baseUrl}/sitemap.xml`
          ];
          break;
        case 'news':
          urlsToSubmit = [
            `${baseUrl}/`,
            `${baseUrl}/news`,
            `${baseUrl}/sitemap.xml`
          ];
          break;
        case 'all':
        default:
          urlsToSubmit = [
            `${baseUrl}/`,
            `${baseUrl}/news`,
            `${baseUrl}/archive`,
            `${baseUrl}/sitemap.xml`
          ];
          break;
      }
    }

    console.log(`🔄 Auto-triggering IndexNow for ${options.contentType || 'all'} content...`);
    
    const results = await indexNowService.submitUrls(urlsToSubmit);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ Auto IndexNow completed: ${successCount}/${results.length} engines notified`);
    
    return {
      success: successCount > 0,
      results
    };

  } catch (error) {
    console.error('❌ Auto IndexNow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 内容发布时的IndexNow通知
 */
export async function notifyContentPublished(contentSlug: string, contentType: 'content' | 'news' = 'content') {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
  const contentUrl = contentType === 'news' 
    ? `${baseUrl}/news/${contentSlug}`
    : `${baseUrl}/content/${contentSlug}`;

  return triggerAutoIndexNow({
    contentType,
    specificUrls: [
      contentUrl,
      `${baseUrl}/`,
      contentType === 'news' ? `${baseUrl}/news` : `${baseUrl}/archive`,
      `${baseUrl}/sitemap.xml`
    ]
  });
}

/**
 * 内容更新时的IndexNow通知
 */
export async function notifyContentUpdated(contentSlug: string, contentType: 'content' | 'news' = 'content') {
  return notifyContentPublished(contentSlug, contentType);
}

/**
 * 批量内容更新时的IndexNow通知
 */
export async function notifyBulkContentUpdate(contentType: 'content' | 'news' | 'all' = 'all') {
  return triggerAutoIndexNow({ contentType });
}

/**
 * 检查IndexNow配置状态
 */
export function getIndexNowStatus() {
  return {
    configured: indexNowService.isConfigured(),
    keyFileUrl: indexNowService.getKeyFileUrl(),
    baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud'
  };
}
