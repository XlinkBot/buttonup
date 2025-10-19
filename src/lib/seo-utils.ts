/**
 * SEO Optimization Utilities
 * Long-tail keyword generation and optimization helpers
 * Focus: Reddit AI创业内容 - Low competition keywords (KD 0-30)
 * 统一强调Reddit创业社区讨论内容来源
 */

/**
 * Generate long-tail keywords based on content
 * Strategy: Focus on Reddit创业内容，强调社区讨论来源
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
    
    // Reddit创业内容核心关键词（优先）
    ...baseKeywords.slice(0, 3).map(tag => `Reddit ${tag}讨论`),
    ...baseKeywords.slice(0, 3).map(tag => `Reddit ${tag}经验`),
    ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}案例`),
    ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}分享`),
    ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}心得`),
    
    // Reddit社区特定关键词
    ...baseKeywords.slice(0, 2).map(tag => `r/entrepreneur ${tag}`),
    ...baseKeywords.slice(0, 2).map(tag => `r/startups ${tag}`),
    ...baseKeywords.slice(0, 2).map(tag => `Reddit创业社区 ${tag}`),
    
    // Question-oriented long-tail keywords (如何、什么、为什么)
    ...baseKeywords.slice(0, 2).map(tag => `${tag}如何开始`),
    ...baseKeywords.slice(0, 2).map(tag => `${tag}需要多少钱`),
    ...baseKeywords.slice(0, 2).map(tag => `${tag}适合什么人`),
    ...baseKeywords.slice(0, 2).map(tag => `${tag}失败原因`),
    
    // Scenario-specific keywords (人群+主题组合)
    ...baseKeywords.slice(0, 2).map(tag => `个人${tag}项目`),
    ...baseKeywords.slice(0, 2).map(tag => `大学生${tag}方向`),
    ...baseKeywords.slice(0, 2).map(tag => `非技术${tag}入门`),
    ...baseKeywords.slice(0, 2).map(tag => `2025年${tag}机会`),
    
    // Time-based keywords with Reddit focus
    `${year}年${month}月Reddit AI创业讨论`,
    `${year}年Reddit AI创业项目推荐`,
    `${year}年Reddit个人AI创业方向`,
    
    // Reddit创业社区核心关键词
    'Reddit AI创业讨论汇总',
    'Reddit AI创业经验分享',
    'Reddit AI创业失败教训',
    'Reddit AI创业成功案例',
    'Reddit AI创业项目推荐',
    'Reddit个人AI创业入门',
    'Reddit AI创业机会发现',
    'Reddit AI创业者心得',
    'Reddit创业社区讨论',
    'Reddit创业论坛AI',
  ];
  
  // Remove duplicates and filter empty strings
  return [...new Set(longTailKeywords.filter(k => k && k.trim()))];
}

/**
 * Generate SEO-friendly description with long-tail keywords
 * Focus: Reddit创业内容，统一描述格式
 */
export function generateSeoDescription(
  excerpt: string,
  tags: string[],
  maxLength: number = 180
): string {
  const mainTags = tags.slice(0, 2).join('、');
  const prefix = mainTags ? `Reddit创业社区关于${mainTags}的讨论精华：` : 'Reddit创业社区讨论精华：';
  
  let description = `${prefix}${excerpt}`;
  
  // Truncate if too long
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }
  
  return description;
}

/**
 * Generate SEO keywords for different page types
 * Strategy: 统一Reddit创业内容关键词策略
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
    // Homepage: Brand terms + Reddit创业核心关键词
    return [
      // Brand keywords
      '创业洞察 ButtonUp',
      'ButtonUp AI创业',
      'ButtonUp 创业洞察',
      
      // Reddit创业核心关键词（与layout.tsx保持一致）
      'Reddit创业讨论', 'Reddit AI创业', 'Reddit创业社区', 'Reddit创业经验',
      'Reddit创业案例', 'Reddit创业分享', 'Reddit创业故事', 'Reddit创业心得',
      'Reddit创业失败', 'Reddit创业成功', 'Reddit创业机会', 'Reddit创业趋势',
      'r/entrepreneur', 'r/startups', 'r/SideProject', 'r/indiehackers',
      'Reddit创业论坛', 'Reddit创业板块', 'Reddit创业话题', 'Reddit创业问答'
    ];
  } else {
    // Article page: Reddit创业内容相关关键词
    const articleKeywords = [
      title || '',
      ...baseKeywords,
      // Reddit创业内容关键词
      ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}讨论`),
      ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}经验`),
      ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}案例`),
      // Question-oriented keywords
      ...baseKeywords.slice(0, 2).map(tag => `${tag}如何开始`),
      ...baseKeywords.slice(0, 2).map(tag => `${tag}项目推荐`),
      // Scenario-specific keywords
      ...baseKeywords.slice(0, 2).map(tag => `个人${tag}项目`),
      `${year}年Reddit ${baseKeywords[0] || 'AI创业'}机会`,
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
 * 统一强调Reddit创业内容来源
 */
export function generateAudioDescription(
  title: string,
  excerpt: string,
  tags: string[]
): string {
  const mainTag = tags[0] || 'AI创业';
  const duration = Math.ceil(excerpt.length / 50); // Estimate duration based on content length
  
  return `🎧 本文提供音频版本，时长约${duration}分钟。音频内容来自Reddit创业社区讨论精华，包括：${mainTag}经验分享、${mainTag}项目推荐、${mainTag}失败教训等核心要点。适合想要深入了解Reddit创业社区${mainTag}讨论的创业者收听。`;
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
