/**
 * SEO Optimization Utilities
 * Long-tail keyword generation and optimization helpers
 * Focus: AI创业 - Low competition keywords (KD 0-30)
 */

/**
 * Generate long-tail keywords based on content
 * Strategy: Focus on low-competition long-tail keywords instead of high-competition core terms
 */
export function generateLongTailKeywords(
  title: string,
  tags: string[],
  date?: string
): string[] {
  const baseKeywords = tags || [];
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  const month = date ? new Date(date).getMonth() + 1 : new Date().getMonth() + 1;
  
  const longTailKeywords: string[] = [
    // Base tags (keep original tags)
    ...baseKeywords,
    
    // Title-based keywords
    title,
    
    // Question-oriented long-tail keywords (如何、什么、为什么)
    ...baseKeywords.slice(0, 3).map(tag => `${tag}如何开始`),
    ...baseKeywords.slice(0, 3).map(tag => `${tag}需要多少钱`),
    ...baseKeywords.slice(0, 2).map(tag => `${tag}适合什么人`),
    ...baseKeywords.slice(0, 2).map(tag => `${tag}失败原因`),
    
    // Scenario-specific keywords (人群+主题组合)
    ...baseKeywords.slice(0, 3).map(tag => `个人${tag}项目`),
    ...baseKeywords.slice(0, 2).map(tag => `大学生${tag}方向`),
    ...baseKeywords.slice(0, 2).map(tag => `非技术${tag}入门`),
    ...baseKeywords.slice(0, 2).map(tag => `2025年${tag}机会`),
    
    // Time-based keywords with specific focus
    `${year}年${month}月AI创业新机会`,
    `${year}年AI创业项目推荐`,
    `${year}年个人AI创业方向`,
    
    // Low-competition AI创业 focused keywords
    'AI创业经验分享',
    'AI创业失败教训',
    'AI创业成功案例',
    'AI创业项目推荐',
    '个人AI创业入门',
    'AI创业机会发现',
    
    // Reddit-specific long-tail keywords
    ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}讨论汇总`),
    ...baseKeywords.slice(0, 2).map(tag => `${tag}创业者心得`),
  ];
  
  // Remove duplicates and filter empty strings
  return [...new Set(longTailKeywords.filter(k => k && k.trim()))];
}

/**
 * Generate SEO-friendly description with long-tail keywords
 * Focus: AI创业
 */
export function generateSeoDescription(
  excerpt: string,
  tags: string[],
  maxLength: number = 180
): string {
  const mainTags = tags.slice(0, 3).join('、');
  const prefix = mainTags ? `关于${mainTags}的AI创业洞察：` : 'AI创业洞察：';
  
  let description = `${prefix}${excerpt}`;
  
  // Truncate if too long
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }
  
  return description;
}

/**
 * Generate SEO keywords for different page types
 * Strategy: Different keyword strategies for homepage vs article pages
 */
export function generateSeoKeywords(
  pageType: 'homepage' | 'article',
  title?: string,
  tags?: string[],
  date?: string
): string[] {
  const baseKeywords = tags || [];
  const year = date ? new Date(date).getFullYear() : new Date().getFullYear();
  
  if (pageType === 'homepage') {
    // Homepage: Brand terms + 1-2 core long-tail keywords
    return [
      // Brand keywords
      '创业洞察 ButtonUp',
      'ButtonUp AI创业',
      'ButtonUp 创业洞察',
      
      // Core long-tail keywords (low competition)
      '2025年AI创业新机会',
      '个人AI创业项目推荐',
      'AI创业经验分享',
      'Reddit AI创业讨论汇总',
      'AI创业失败教训',
      'AI创业成功案例',
      '如何开始AI创业',
      'AI创业需要什么技能',
      '大学生AI创业方向',
      '非技术AI创业入门',
      'AI创业机会发现',
      'AI创业者心得',
      'AI创业项目推荐',
      '个人AI创业入门',
      'AI创业趋势分析',
      'AI创业案例研究'
    ];
  } else {
    // Article page: 3-5 precise long-tail keywords
    const articleKeywords = [
      title || '',
      ...baseKeywords,
      // Question-oriented keywords
      ...baseKeywords.slice(0, 2).map(tag => `${tag}如何开始`),
      ...baseKeywords.slice(0, 2).map(tag => `${tag}项目推荐`),
      // Scenario-specific keywords
      ...baseKeywords.slice(0, 2).map(tag => `个人${tag}项目`),
      `${year}年${baseKeywords[0] || 'AI创业'}机会`,
      // Experience-focused keywords
      ...baseKeywords.slice(0, 2).map(tag => `${tag}经验分享`),
      ...baseKeywords.slice(0, 2).map(tag => `${tag}失败教训`),
    ];
    
    return [...new Set(articleKeywords.filter(k => k && k.trim()))];
  }
}

/**
 * Calculate keyword relevance score for content
 * Higher score = better match for SEO
 */
export function calculateKeywordRelevance(
  content: string,
  keywords: string[]
): { keyword: string; score: number }[] {
  const contentLower = content.toLowerCase();
  
  return keywords.map(keyword => {
    const keywordLower = keyword.toLowerCase();
    let score = 0;
    
    // Title match (highest weight)
    if (contentLower.includes(keywordLower)) {
      score += 10;
    }
    
    // Frequency in content
    const frequency = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
    score += frequency * 2;
    
    // Length bonus (longer keywords are more specific)
    score += keyword.length * 0.1;
    
    return { keyword, score };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Generate audio description for SEO
 * Creates SEO-friendly text description for audio content
 */
export function generateAudioDescription(
  title: string,
  excerpt: string,
  tags: string[]
): string {
  const mainTag = tags[0] || 'AI创业';
  const duration = Math.ceil(excerpt.length / 50); // Estimate duration based on content length
  
  return `🎧 本文提供音频版本，时长约${duration}分钟。音频内容包括：${mainTag}经验分享、${mainTag}项目推荐、${mainTag}失败教训等核心要点。适合想要深入了解${mainTag}的创业者收听。`;
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
