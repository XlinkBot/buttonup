/**
 * UTM参数管理工具
 * 用于生成、解析和验证UTM参数
 */

export interface UTMParams {
  utm_source?: string;      // 流量来源 (google, facebook, newsletter, etc.)
  utm_medium?: string;      // 媒介类型 (cpc, email, social, organic, etc.)
  utm_campaign?: string;    // 活动名称 (summer_sale, product_launch, etc.)
  utm_term?: string;        // 关键词 (主要用于付费搜索)
  utm_content?: string;     // 内容标识 (用于A/B测试)
  utm_id?: string;          // 活动ID
}

/**
 * 预定义的UTM参数模板
 */
export const UTM_TEMPLATES = {
  // 社交媒体
  social: {
    facebook: { utm_source: 'facebook', utm_medium: 'social' },
    twitter: { utm_source: 'twitter', utm_medium: 'social' },
    linkedin: { utm_source: 'linkedin', utm_medium: 'social' },
    wechat: { utm_source: 'wechat', utm_medium: 'social' },
    weibo: { utm_source: 'weibo', utm_medium: 'social' },
  },
  
  // 邮件营销
  email: {
    newsletter: { utm_source: 'newsletter', utm_medium: 'email' },
    promotion: { utm_source: 'email', utm_medium: 'email' },
  },
  
  // 付费广告
  paid: {
    google_ads: { utm_source: 'google', utm_medium: 'cpc' },
    facebook_ads: { utm_source: 'facebook', utm_medium: 'cpc' },
    baidu_ads: { utm_source: 'baidu', utm_medium: 'cpc' },
  },
  
  // 内容营销
  content: {
    blog: { utm_source: 'blog', utm_medium: 'referral' },
    guest_post: { utm_source: 'guest_post', utm_medium: 'referral' },
  },
  
  // 直接推广
  direct: {
    qr_code: { utm_source: 'qr_code', utm_medium: 'offline' },
    print: { utm_source: 'print', utm_medium: 'offline' },
  }
} as const;

/**
 * 生成带UTM参数的URL
 */
export function generateUTMUrl(baseUrl: string, utmParams: UTMParams): string {
  const url = new URL(baseUrl);
  
  Object.entries(utmParams).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });
  
  return url.toString();
}

/**
 * 从URL中解析UTM参数
 */
export function parseUTMParams(url: string): UTMParams {
  const urlObj = new URL(url);
  const params: UTMParams = {};
  
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
  
  utmKeys.forEach(key => {
    const value = urlObj.searchParams.get(key);
    if (value) {
      params[key as keyof UTMParams] = value;
    }
  });
  
  return params;
}

/**
 * 从当前页面URL解析UTM参数
 */
export function getCurrentUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  return parseUTMParams(window.location.href);
}

/**
 * 验证UTM参数
 */
export function validateUTMParams(params: UTMParams): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 基本验证规则
  if (params.utm_source && params.utm_source.length > 100) {
    errors.push('utm_source不能超过100个字符');
  }
  
  if (params.utm_medium && params.utm_medium.length > 50) {
    errors.push('utm_medium不能超过50个字符');
  }
  
  if (params.utm_campaign && params.utm_campaign.length > 100) {
    errors.push('utm_campaign不能超过100个字符');
  }
  
  // 检查是否包含特殊字符
  const specialChars = /[<>'"&]/;
  Object.entries(params).forEach(([key, value]) => {
    if (value && specialChars.test(value)) {
      errors.push(`${key}包含不允许的特殊字符`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 清理UTM参数（移除空值和无效字符）
 */
export function sanitizeUTMParams(params: UTMParams): UTMParams {
  const sanitized: UTMParams = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      // 移除特殊字符，只保留字母、数字、下划线、连字符
      const cleaned = value.replace(/[^a-zA-Z0-9_\-\u4e00-\u9fff]/g, '').trim();
      if (cleaned) {
        sanitized[key as keyof UTMParams] = cleaned;
      }
    }
  });
  
  return sanitized;
}

/**
 * 生成常用的UTM参数组合
 */
export function generateCommonUTM(
  source: string,
  medium: string,
  campaign: string,
  options?: {
    term?: string;
    content?: string;
    id?: string;
  }
): UTMParams {
  return {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    ...(options?.term && { utm_term: options.term }),
    ...(options?.content && { utm_content: options.content }),
    ...(options?.id && { utm_id: options.id }),
  };
}

/**
 * 为外部链接自动添加UTM参数
 */
export function addUTMToExternalLinks(baseParams: UTMParams = { utm_source: 'buttonup' }) {
  if (typeof window === 'undefined') return;
  
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => addUTMToExternalLinks(baseParams));
    return;
  }
  
  const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="buttonup.cloud"])');
  
  externalLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href) {
      try {
        const utmUrl = generateUTMUrl(href, baseParams);
        link.setAttribute('href', utmUrl);
      } catch (error) {
        console.warn('Failed to add UTM to link:', href, error);
      }
    }
  });
}

/**
 * 跟踪UTM参数到GA4
 */
export function trackUTMToGA4(utmParams: UTMParams) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'utm_tracking', {
    event_category: 'UTM',
    event_label: `${utmParams.utm_source || 'unknown'}_${utmParams.utm_medium || 'unknown'}`,
    utm_source: utmParams.utm_source,
    utm_medium: utmParams.utm_medium,
    utm_campaign: utmParams.utm_campaign,
    utm_content: utmParams.utm_content,
    utm_term: utmParams.utm_term,
    utm_id: utmParams.utm_id,
  });
}

// 类型声明
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
