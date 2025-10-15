/**
 * SEO Optimization Utilities
 * Long-tail keyword generation and optimization helpers
 * Focus: AI创业
 */

/**
 * Generate long-tail keywords based on content
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
    // Base tags
    ...baseKeywords,
    
    // Title-based keywords
    title,
    
    // Tag + context combinations
    ...baseKeywords.slice(0, 3).map(tag => `${tag}趋势分析`),
    ...baseKeywords.slice(0, 3).map(tag => `${tag}案例研究`),
    ...baseKeywords.slice(0, 2).map(tag => `Reddit ${tag}讨论`),
    ...baseKeywords.slice(0, 2).map(tag => `${tag}经验分享`),
    
    // AI创业 focused long-tail keywords
    'AI创业',
    'AI创业洞察',
    'AI创业经验',
    'AI创业建议',
    'AI创业者必读',
    'AI创业趋势',
    'AI创业项目',
    
    // Time-based keywords with AI创业
    `${year}年AI创业趋势`,
    `${year}年${month}月AI创业热点`,
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
  maxLength: number = 160
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
