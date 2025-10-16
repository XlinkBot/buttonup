/**
 * Google Search Console API Integration
 * 用于主动提交URL到Google进行索引
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

interface IndexingResponse {
  success: boolean;
  url: string;
  error?: string;
  quotaExceeded?: boolean;
}

class GoogleSearchConsoleService {
  private auth?: JWT;
  private siteUrl: string;

  constructor() {
    this.siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
    this.initializeAuth();
  }

  /**
   * 初始化Google认证
   */
  private initializeAuth() {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      console.log('⚠️ Google Service Account Key not configured');
      return;
    }

    try {
      const credentials = JSON.parse(serviceAccountKey);
      
      this.auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/indexing']
      });
      
      console.log('✅ Google Search Console authentication initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google authentication:', error);
    }
  }

  /**
   * 检查是否已配置Google Search Console
   */
  isConfigured(): boolean {
    return !!this.auth;
  }

  /**
   * 提交单个URL到Google Search Console
   */
  async submitUrl(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<IndexingResponse> {
    if (!this.isConfigured() || !this.auth) {
      return {
        success: false,
        url,
        error: 'Google Search Console not configured'
      };
    }

    try {
      // 创建indexing API客户端
      const indexing = google.indexing({ version: 'v3', auth: this.auth });
      
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type,
        },
      });

      if (response.status === 200) {
        console.log(`✅ Google indexing request sent for: ${url}`);
        return {
          success: true,
          url
        };
      } else {
        return {
          success: false,
          url,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error: unknown) {
      const typedError = error as { code?: number; message?: string };
      // 检查是否是配额超限
      if (typedError.code === 429 || typedError.message?.includes('quota')) {
        return {
          success: false,
          url,
          error: 'Quota exceeded',
          quotaExceeded: true
        };
      }

      console.error(`❌ Google indexing failed for ${url}:`, typedError);
      return {
        success: false,
        url,
        error: typedError.message || 'Unknown error'
      };
    }
  }

  /**
   * 批量提交URLs到Google Search Console
   */
  async submitUrls(urls: string[], type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'): Promise<IndexingResponse[]> {
    console.log(`📡 Submitting ${urls.length} URLs to Google Search Console...`);
    
    const results: IndexingResponse[] = [];
    
    // Google API有配额限制，需要控制并发
    const batchSize = 5;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.submitUrl(url, type));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 检查是否遇到配额限制
      if (batchResults.some(r => r.quotaExceeded)) {
        console.log('⚠️ Google Search Console quota exceeded, stopping batch submission');
        break;
      }
      
      // 添加延迟避免触发速率限制
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Google Search Console submission completed: ${successCount}/${results.length} URLs submitted`);
    
    return results;
  }

  /**
   * 获取配置状态
   */
  getStatus() {
    return {
      configured: this.isConfigured(),
      siteUrl: this.siteUrl,
      hasAuth: !!this.auth
    };
  }
}

// 导出单例实例
export const googleSearchConsoleService = new GoogleSearchConsoleService();

/**
 * 便捷函数：通知Google新内容发布
 */
export async function notifyGoogleContentPublished(contentSlug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
  const contentUrl = `${baseUrl}/content/${contentSlug}`;
  
  return googleSearchConsoleService.submitUrls([
    contentUrl,
    `${baseUrl}/`,
    `${baseUrl}/archive`,
    `${baseUrl}/sitemap.xml`
  ]);
}

/**
 * 便捷函数：通知Google内容更新
 */
export async function notifyGoogleContentUpdated(contentSlug: string) {
  return notifyGoogleContentPublished(contentSlug);
}
