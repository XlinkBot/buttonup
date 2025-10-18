import { ContentItem } from '@/types/content';
import { notionService } from '@/lib/notion';

/**
 * Fetch all content items directly from the data source (server-side only)
 * 服务器端直接调用数据层，避免HTTP请求
 */
export async function fetchAllContent(): Promise<ContentItem[]> {
  try {
    console.log('🔍 服务器端直接获取内容...');
    
    const contentItems = await notionService.getSimpleContentList();
    
    console.log(`✅ 服务器端成功获取 ${contentItems.length} 条内容`);
    
    return contentItems;
  } catch (error) {
    console.error('❌ 服务器端获取内容失败:', error);
    return [];
  }
}

/**
 * Search content using the optimized search API
 * 使用优化的搜索API进行内容搜索
 */
export async function searchContent(params: {
  q?: string;
  tag?: string;
  start?: string;
  end?: string;
}): Promise<ContentItem[]> {
  try {
    console.log(`🔍 服务器端搜索内容:`, params);
    
    // Use direct service call instead of HTTP for server-side
    if (params.q && params.q.trim().length >= 2) {
      const searchResults = await notionService.searchContent(params.q, {
        filter: 'page',
        pageSize: 50
      });
      
      // Apply additional filters
      let filteredResults = searchResults;
      
      if (params.tag) {
        filteredResults = filteredResults.filter(item => 
          item.tags?.some(t => t.toLowerCase() === params.tag!.toLowerCase())
        );
      }
      
      if (params.start || params.end) {
        filteredResults = filteredResults.filter(item => {
          const itemDate = new Date(item.date);
          const startDate = params.start ? new Date(params.start) : null;
          const endDate = params.end ? new Date(params.end) : null;

          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });
      }
      
      console.log(`✅ 服务器端搜索成功: ${filteredResults.length} 条结果`);
      return filteredResults;
    } else {
      // For filter-only queries, get all content and filter
      const allContent = await fetchAllContent();
      let filteredResults = allContent;
      
      if (params.tag) {
        filteredResults = filteredResults.filter(item => 
          item.tags?.some(t => t.toLowerCase() === params.tag!.toLowerCase())
        );
      }
      
      if (params.start || params.end) {
        filteredResults = filteredResults.filter(item => {
          const itemDate = new Date(item.date);
          const startDate = params.start ? new Date(params.start) : null;
          const endDate = params.end ? new Date(params.end) : null;

          if (startDate && itemDate < startDate) return false;
          if (endDate && itemDate > endDate) return false;
          return true;
        });
      }
      
      return filteredResults;
    }
  } catch (error) {
    console.error('❌ 服务器端搜索失败:', error);
    return [];
  }
}

/**
 * Transform audio URL to use proxy service
 * 将音频 URL 转换为代理服务 URL
 */
function transformAudioUrl(podcasturl: string | undefined, slug: string): string | undefined {
  if (!podcasturl) {
    return undefined;
  }
  
  // Convert external Notion audio URL to internal proxy URL
  // 将外部 Notion 音频 URL 转换为内部代理 URL
  return `/api/audio/${slug}`;
}

/**
 * Fetch a specific content item by slug directly from the data source (server-side only)
 * 服务器端直接通过slug获取内容，并将音频URL转换为代理URL
 */
export async function fetchContentBySlug(slug: string): Promise<ContentItem | null> {
  try {
    console.log(`🔍 服务器端直接获取内容: ${slug}`);
    
    const contentItem = await notionService.getContentBySlug(slug);
    
    if (contentItem) {
      console.log(`✅ 服务器端成功获取内容: ${contentItem.title}`);
      
      // Transform audio URL to use proxy service
      // 将音频 URL 转换为代理服务 URL
      const transformedContent = {
        ...contentItem,
        podcasturl: transformAudioUrl(contentItem.podcasturl, slug)
      };
      
      if (contentItem.podcasturl && transformedContent.podcasturl) {
        console.log(`🎵 音频 URL 已转换为代理服务: ${transformedContent.podcasturl}`);
      }
      
      return transformedContent;
    } else {
      console.log(`⚠️ 服务器端未找到内容: ${slug}`);
    }
    
    return contentItem;
  } catch (error) {
    console.error(`❌ 服务器端获取内容失败 (${slug}):`, error);
    return null;
  }
}

/**
 * Fetch recent articles excluding the current one (for "其他好文" section)
 * 获取最近的文章（排除当前文章），用于"其他好文"部分
 */
export async function fetchRecentArticles(currentSlug: string, limit: number = 3): Promise<ContentItem[]> {
  try {
    console.log(`🔍 获取最近 ${limit} 篇文章，排除当前文章: ${currentSlug}`);
    
    // Get all content and sort by date (newest first)
    const allContent = await fetchAllContent();
    
    // Filter out current article and get the most recent ones
    const recentArticles = allContent
      .filter(item => item.slug !== currentSlug) // 排除当前文章
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // 按日期降序排列
      .slice(0, limit); // 取前N篇
    
    console.log(`✅ 成功获取 ${recentArticles.length} 篇最近文章`);
    
    return recentArticles;
  } catch (error) {
    console.error('❌ 获取最近文章失败:', error);
    return [];
  }
}

/**
 * Fetch related articles based on tag similarity
 * 按标签相似度获取相关文章，用于内部链接网络建设
 */
export async function fetchRelatedArticles(
  currentSlug: string, 
  tags: string[], 
  limit: number = 3
): Promise<ContentItem[]> {
  try {
    console.log(`🔍 按标签相似度获取相关文章: ${currentSlug}, tags: ${tags.join(', ')}`);
    
    if (!tags || tags.length === 0) {
      // If no tags, fall back to recent articles
      return await fetchRecentArticles(currentSlug, limit);
    }
    
    // Get all content
    const allContent = await fetchAllContent();
    
    // Calculate similarity score for each article
    const articlesWithScore = allContent
      .filter(item => item.slug !== currentSlug) // 排除当前文章
      .map(item => {
        const itemTags = item.tags || [];
        
        // Calculate tag similarity score
        const commonTags = tags.filter(tag => 
          itemTags.some(itemTag => 
            itemTag.toLowerCase() === tag.toLowerCase()
          )
        );
        
        // Score based on:
        // 1. Number of common tags (weight: 10)
        // 2. Recency bonus (weight: 1)
        // 3. Title similarity bonus (weight: 5)
        const tagScore = commonTags.length * 10;
        const recencyScore = Math.max(0, 30 - Math.floor((Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24))); // Days since published
        const titleScore = tags.some(tag => 
          item.title.toLowerCase().includes(tag.toLowerCase())
        ) ? 5 : 0;
        
        const totalScore = tagScore + recencyScore + titleScore;
        
        return {
          ...item,
          similarityScore: totalScore,
          commonTags
        };
      })
      .filter(item => item.similarityScore > 0) // Only include articles with some similarity
      .sort((a, b) => b.similarityScore - a.similarityScore) // Sort by similarity score
      .slice(0, limit);
    
    console.log(`✅ 成功获取 ${articlesWithScore.length} 篇相关文章`);
    
    return articlesWithScore;
  } catch (error) {
    console.error('❌ 获取相关文章失败:', error);
    // Fall back to recent articles
    return await fetchRecentArticles(currentSlug, limit);
  }
}

/**
 * Generate SEO-friendly audio description
 * 为音频内容生成SEO友好的描述文本
 */
export function generateAudioDescription(
  title: string,
  excerpt: string,
  tags: string[]
): string {
  const mainTag = tags[0] || 'AI创业';
  const duration = Math.ceil(excerpt.length / 50); // Estimate duration based on content length
  
  // Generate different descriptions based on content type
  const descriptions = [
    `🎧 本文提供音频版本，时长约${duration}分钟。音频内容包括：${mainTag}经验分享、${mainTag}项目推荐、${mainTag}失败教训等核心要点。适合想要深入了解${mainTag}的创业者收听。`,
    `🎧 音频版内容，约${duration}分钟。涵盖${mainTag}实战经验、${mainTag}案例分析、${mainTag}成功秘诀。为${mainTag}创业者提供深度洞察和实用建议。`,
    `🎧 播客版${title}，时长${duration}分钟。深入探讨${mainTag}机会发现、${mainTag}项目选择、${mainTag}风险规避。适合${mainTag}入门者和有经验的创业者。`
  ];
  
  // Return a random description to avoid duplicate content
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Get articles by tag for internal linking
 * 按标签获取文章，用于内部链接
 */
export async function fetchArticlesByTag(tag: string, limit: number = 10): Promise<ContentItem[]> {
  try {
    console.log(`🔍 按标签获取文章: ${tag}`);
    
    const allContent = await fetchAllContent();
    
    const articlesByTag = allContent
      .filter(item => 
        item.tags?.some(t => t.toLowerCase() === tag.toLowerCase())
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    
    console.log(`✅ 成功获取 ${articlesByTag.length} 篇 ${tag} 相关文章`);
    
    return articlesByTag;
  } catch (error) {
    console.error(`❌ 获取 ${tag} 相关文章失败:`, error);
    return [];
  }
}