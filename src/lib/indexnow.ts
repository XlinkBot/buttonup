/**
 * IndexNow Service
 * 实现IndexNow协议，向支持的搜索引擎提交URL更新通知
 * 
 * 支持的搜索引擎：
 * - Bing
 * - Yandex
 * - Seznam.cz
 * - Naver
 */

interface IndexNowSubmission {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}

interface IndexNowResponse {
  success: boolean;
  engine: string;
  statusCode?: number;
  error?: string;
}

class IndexNowService {
  private apiKey: string;
  private baseUrl: string;
  private keyLocation: string;
  
  // IndexNow支持的搜索引擎端点
  private readonly endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
    'https://search.seznam.cz/indexnow',
    'https://searchadvisor.naver.com/indexnow'
  ];

  constructor() {
    this.apiKey = process.env.INDEXNOW_API_KEY || '';
    this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
    this.keyLocation = `${this.baseUrl}/${this.apiKey}.txt`;
    
    if (!this.apiKey) {
      console.warn('⚠️ IndexNow API key not configured');
    }
  }

  /**
   * 提交单个URL到IndexNow
   */
  async submitUrl(url: string): Promise<IndexNowResponse[]> {
    return this.submitUrls([url]);
  }

  /**
   * 批量提交URL到IndexNow
   */
  async submitUrls(urls: string[]): Promise<IndexNowResponse[]> {
    if (!this.apiKey) {
      console.error('❌ IndexNow API key not configured');
      return [];
    }

    if (urls.length === 0) {
      console.warn('⚠️ No URLs provided for IndexNow submission');
      return [];
    }

    // 确保URL是完整的绝对URL
    const fullUrls = urls.map(url => {
      if (url.startsWith('http')) {
        return url;
      }
      return `${this.baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    });

    const submission: IndexNowSubmission = {
      host: new URL(this.baseUrl).hostname,
      key: this.apiKey,
      keyLocation: this.keyLocation,
      urlList: fullUrls
    };

    console.log(`🔄 Submitting ${fullUrls.length} URLs to IndexNow:`, fullUrls);

    const results: IndexNowResponse[] = [];

    // 并行提交到所有支持的搜索引擎
    const promises = this.endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'ButtonUp-IndexNow/1.0'
          },
          body: JSON.stringify(submission)
        });

        const engineName = this.getEngineName(endpoint);
        
        if (response.ok) {
          console.log(`✅ Successfully submitted to ${engineName} (${response.status})`);
          return {
            success: true,
            engine: engineName,
            statusCode: response.status
          };
        } else {
          console.warn(`⚠️ ${engineName} returned status ${response.status}`);
          return {
            success: false,
            engine: engineName,
            statusCode: response.status,
            error: `HTTP ${response.status}`
          };
        }
      } catch (error) {
        const engineName = this.getEngineName(endpoint);
        console.error(`❌ Error submitting to ${engineName}:`, error);
        return {
          success: false,
          engine: engineName,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const responses = await Promise.allSettled(promises);
    
    responses.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          engine: 'Unknown',
          error: result.reason
        });
      }
    });

    const successCount = results.filter(r => r.success).length;
    console.log(`📊 IndexNow submission complete: ${successCount}/${results.length} engines successful`);

    return results;
  }

  /**
   * 从端点URL提取搜索引擎名称
   */
  private getEngineName(endpoint: string): string {
    if (endpoint.includes('bing.com')) return 'Bing';
    if (endpoint.includes('yandex.com')) return 'Yandex';
    if (endpoint.includes('seznam.cz')) return 'Seznam';
    if (endpoint.includes('naver.com')) return 'Naver';
    if (endpoint.includes('indexnow.org')) return 'IndexNow';
    return 'Unknown';
  }

  /**
   * 验证IndexNow配置
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.baseUrl;
  }

  /**
   * 获取验证密钥文件内容
   */
  getKeyFileContent(): string {
    return this.apiKey;
  }

  /**
   * 获取密钥文件URL
   */
  getKeyFileUrl(): string {
    return this.keyLocation;
  }
}

// 导出单例实例
export const indexNowService = new IndexNowService();

// 导出类型
export type { IndexNowResponse, IndexNowSubmission };
