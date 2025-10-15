/**
 * SEO Optimization Utilities
 * Long-tail keyword generation and optimization helpers
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
    
    // Generic long-tail keywords
    '创业洞察',
    '创业经验',
    '创业建议',
    '创业者必读',
    
    // Time-based keywords
    `${year}年创业趋势`,
    `${year}年${month}月创业热点`,
  ];
  
  // Remove duplicates and filter empty strings
  return [...new Set(longTailKeywords.filter(k => k && k.trim()))];
}

/**
 * Generate SEO-friendly description with long-tail keywords
 */
export function generateSeoDescription(
  excerpt: string,
  tags: string[],
  maxLength: number = 160
): string {
  const mainTags = tags.slice(0, 3).join('、');
  const prefix = mainTags ? `关于${mainTags}的创业洞察：` : '创业洞察：';
  
  let description = `${prefix}${excerpt}`;
  
  // Truncate if too long
  if (description.length > maxLength) {
    description = description.substring(0, maxLength - 3) + '...';
  }
  
  return description;
}

/**
 * Generate question-based long-tail keywords (for FAQ)
 */
export function generateQuestionKeywords(topic: string): string[] {
  return [
    `如何${topic}`,
    `${topic}是什么`,
    `${topic}怎么做`,
    `${topic}有哪些`,
    `${topic}案例`,
    `${topic}经验`,
    `${topic}建议`,
    `${topic}趋势`,
    `${topic}分析`,
    `${topic}推荐`,
  ];
}

/**
 * Generate location + topic keywords (if applicable)
 */
export function generateLocationKeywords(topic: string, locations: string[]): string[] {
  return locations.flatMap(location => [
    `${location}${topic}`,
    `${location}${topic}趋势`,
    `${location}${topic}案例`,
  ]);
}

/**
 * Generate time-sensitive keywords
 */
export function generateTimeKeywords(topic: string, date?: Date): string[] {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  
  return [
    `${year}年${topic}`,
    `${year}年${month}月${topic}`,
    `${year}年Q${quarter}${topic}`,
    `最新${topic}`,
    `${topic}最新动态`,
  ];
}

/**
 * Combine and deduplicate keywords
 */
export function combineKeywords(...keywordArrays: string[][]): string {
  const allKeywords = keywordArrays.flat();
  const uniqueKeywords = [...new Set(allKeywords.filter(k => k && k.trim()))];
  return uniqueKeywords.join(', ');
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

/**
 * Generate FAQ structured data
 */
export function generateFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate How-To structured data
 */
export function generateHowToSchema(
  name: string,
  description: string,
  steps: { name: string; text: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text
    }))
  };
}

