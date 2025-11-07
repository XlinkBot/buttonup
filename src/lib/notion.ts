import { ContentItem } from '@/types/content';
import { unstable_cache } from 'next/cache';
import { blockToMarkdown, NotionBlock, PageObjectResponse,parsePageToContentItem } from './notion-data';

/**
 * Base fetch function with Next.js cache tags
 * Wraps Notion API calls with caching support
 */
async function notionFetch(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: Record<string, any>;
    tags?: string[];
    revalidate?: number | false;
  } = {}
) {
  const url = `https://api.notion.com/v1/${endpoint}`;
  
  // 为 GET 请求启用缓存
  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': '2025-09-03',
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  // 对于 GET 请求，启用缓存
  if (!options.method || options.method === 'GET') {
    fetchOptions.cache = 'force-cache';
    fetchOptions.next = {
      tags: options.tags || ['notion-api'],
      revalidate: options.revalidate !== undefined ? options.revalidate : 3600 // 默认1小时缓存
    };
  } else {
    // 对于 POST/PATCH 请求，设置较短的缓存时间
    fetchOptions.next = {
      tags: options.tags || ['notion-api'],
      revalidate: options.revalidate !== undefined ? options.revalidate : 300 // 5分钟缓存
    };
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Notion API error (${response.status}): ${errorText}`);
  }

  return response.json();
}



class NotionService {

  constructor() {
    console.log('🚀 NotionService constructor called');
    console.log('🔑 Environment variables check:');
    console.log('  - NOTION_API_KEY:', process.env.NOTION_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('  - NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✅ Set' : '❌ Not set');
    console.log('  - NOTION_DATA_SOURCE_ID:', process.env.NOTION_DATA_SOURCE_ID ? '✅ Set' : '❌ Not set');
    
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }

  }




  async getSimpleContentList(): Promise<ContentItem[]> {
    console.log('🔍 getSimpleContentList() called - checking cache...');
    
    // Get a stable cache key that doesn't depend on user agent or other request headers
    const cacheKey = ['content-list'];
    
    // 使用 unstable_cache 包装数据库查询
    const getCachedContentList = unstable_cache(
      async () => {
        console.log('💾 Cache MISS - executing actual Notion API call');
        console.log('⏰ Timestamp:', new Date().toISOString());
        
        // Get current date for filtering future posts
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        console.log(`📅 Filtering content with date <= ${today} (excluding future posts)`);
        
        const dsResponse = await notionFetch(
          `data_sources/${process.env.NOTION_DATA_SOURCE_ID}/query`,
          {
            method: 'POST',
            body: {
              filter: {
                and: [
                  {
                    property: 'Status',
                    select: { equals: 'published' }
                  },
                  {
                    property: 'Date',
                    date: { on_or_before: today }
                  },
                  // 7days
                  {
                    property: 'Date',
                    date: { on_or_after: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString() }
                  }
                ]
              }
            },
            tags: ['notion-content', 'notion-datasource'],
            revalidate: 300 // 5分钟缓存
          }
        );

        const contentItems = await Promise.all(dsResponse.results.map(async (item: unknown) => {
          const pageObject = item as unknown as PageObjectResponse;
          return  await this.parsePage(pageObject);
          
        })) as unknown as ContentItem[];
        
        console.log(`✅ Retrieved ${contentItems.length} published content items (excluding future dates)`);
        return contentItems;
      },
      cacheKey, // cache key
      {
        tags: ['notion-content', 'content-list'],
        revalidate: 300, // 5分钟缓存
      }
    );

    const result = await getCachedContentList();
    console.log('🎯 getSimpleContentList() completed - returning cached/fresh data');
    return result;
  }

  async getAllContentList(): Promise<ContentItem[]> {
    console.log('🔍 getAllContentList() called - checking cache...');
    
    // Get a stable cache key that doesn't depend on user agent or other request headers
    const cacheKey = ['all-content-list'];
    
    // 使用 unstable_cache 包装数据库查询
    const getCachedAllContentList = unstable_cache(
      async () => {
        console.log('💾 Cache MISS - executing actual Notion API call for all content');
        console.log('⏰ Timestamp:', new Date().toISOString());
        
        // Get current date for filtering future posts
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        console.log(`📅 Filtering content with date <= ${today} (excluding future posts, no time limit)`);
        
        const dsResponse = await notionFetch(
          `data_sources/${process.env.NOTION_DATA_SOURCE_ID}/query`,
          {
            method: 'POST',
            body: {
              filter: {
                and: [
                  {
                    property: 'Status',
                    select: { equals: 'published' }
                  },
                  {
                    property: 'Date',
                    date: { on_or_before: today }
                  }
                ]
              },
              sorts: [
                {
                  property: 'Date',
                  direction: 'descending'
                }
              ]
            },
            tags: ['notion-content', 'notion-datasource', 'all-content'],
            revalidate: 600 // 10分钟缓存，所有内容变化较少
          }
        );

        const contentItems = await Promise.all(dsResponse.results.map(async (item: unknown) => {
          const pageObject = item as unknown as PageObjectResponse;
          return await this.parsePage(pageObject);
          
        })) as unknown as ContentItem[];
        
        console.log(`✅ Retrieved ${contentItems.length} published content items (all content, excluding future dates)`);
        return contentItems;
      },
      cacheKey, // cache key
      {
        tags: ['notion-content', 'all-content-list'],
        revalidate: 600, // 10分钟缓存
      }
    );

    const result = await getCachedAllContentList();
    console.log('🎯 getAllContentList() completed - returning cached/fresh data');
    return result;
  }





  /**
   * Recursively fetch children blocks for blocks that have children
   */
  private async fetchBlockChildren(blockId: string): Promise<NotionBlock[]> {
    try {
      const response = await notionFetch(
        `blocks/${blockId}/children?page_size=100`,
        { 
          tags: ['notion-blocks', `block-${blockId}`],
          revalidate: 1800
        }
      );

      const blocks: NotionBlock[] = [];
      for (const block of response.results) {
        const notionBlock = block as NotionBlock;
        
        // If this block has children, fetch them recursively
        if (notionBlock.has_children) {
          notionBlock.children = await this.fetchBlockChildren(notionBlock.id);
        }
        
        blocks.push(notionBlock);
      }

      return blocks;
    } catch (error) {
      console.error(`❌ Error fetching children for block ${blockId}:`, error);
      return [];
    }
  }

  async getPageContent(pageId: string): Promise<string> {
    console.log(`📄 Fetching content for page ID: ${pageId}`);
    
    // 使用 unstable_cache 包装页面内容查询
    const getCachedPageContent = unstable_cache(
      async (id: string) => {
        try {
          const response = await notionFetch(
            `blocks/${id}/children?page_size=100`,
            { 
              tags: ['notion-blocks', `page-${id}`],
              revalidate: 1800 // 30分钟缓存，页面内容变化更少
            }
          );

          let content = '';
          
          // Process each block and fetch children if needed
          for (const block of response.results) {
            const notionBlock = block as NotionBlock;
            
            // If this block has children, fetch them recursively
            if (notionBlock.has_children) {
              notionBlock.children = await this.fetchBlockChildren(notionBlock.id);
            }
            
            content += blockToMarkdown(notionBlock);
          }

          console.log(`📄 Content fetched for ${id}, length: ${content.length} characters`);
          return content;
        } catch (error) {
          console.error(`❌ Error fetching content for page ${id}:`, error);
          return '';
        }
      },
      [pageId], // 使用 pageId 作为缓存键
      {
        tags: ['notion-blocks', `page-${pageId}`],
        revalidate: 1800, // 30分钟缓存
      }
    );

    return getCachedPageContent(pageId);
  }


  /**
   * Search content using Notion's native search API
   * Uses Notion API's search endpoint for efficient searching
   */
  async searchContent(query: string, options: {
    filter?: 'page' | 'database';
    pageSize?: number;
  } = {}): Promise<ContentItem[]> {
    console.log(`🔍 Notion Search: Searching for "${query}"`);
    

    
    try {
      const searchResponse = await notionFetch(
        'search',
        {
          method: 'POST',
          body: {
            query: query.trim(),
            filter: options.filter === 'page' ? { property: 'object', value: 'page' } : undefined,
            page_size: options.pageSize || 20, // Reduced page size for faster results as per Notion docs
            sort: {
              direction: 'descending',
              timestamp: 'last_edited_time'
            }
          },
          tags: ['notion-search'],
          revalidate: 60 // Short cache for search results
        }
      );

      console.log(`📄 Found ${searchResponse.results.length} search results`);



      const contentItems: ContentItem[] = [];
      const now = new Date();

      for (const page of searchResponse.results) {
        try {
          const contentItem = await parsePageToContentItem(page as PageObjectResponse);
          if (contentItem) {
            // Filter out future dates
            const itemDate = new Date(contentItem.date);
            if (itemDate <= now) {
              contentItems.push(contentItem);
            } else {
              console.log(`📅 Excluding future post: "${contentItem.title}" (${contentItem.date})`);
            }
          }
        } catch (error) {
          console.error(`❌ Error parsing page ${page.id}:`, error);
          continue;
        }
      }

      console.log(`✅ Processed ${contentItems.length} content items from search (excluding future dates)`);
      return contentItems;

    } catch (error) {
      console.error('❌ Notion search error:', error);
      // Fallback to getting all content if search fails
      console.log('🔄 Falling back to full content list due to search error');
      const allContent = await this.getSimpleContentList();
      const queryLower = query.toLowerCase();
      
      // Filter search results and ensure no future dates
      const now = new Date();
      
      return allContent.filter(item => {
        // Text search filter
        const textMatch = item.title.toLowerCase().includes(queryLower) ||
          item.excerpt.toLowerCase().includes(queryLower) ||
          item.tags?.some(tag => tag.toLowerCase().includes(queryLower));
        
        // Date filter (exclude future dates)
        const itemDate = new Date(item.date);
        const notFuture = itemDate <= now;
        
        return textMatch && notFuture;
      });
    }
  }

  /**
   * Get content by slug - optimized for single item lookup
   */
  async getContentBySlug(slug: string): Promise<ContentItem | null> {
    console.log(`🔍 Finding content by slug: ${slug}`);

    // 使用 unstable_cache 包装单个内容查询
    const getCachedContentBySlug = unstable_cache(
      async (slugKey: string) => {
        const response = await notionFetch(
          `data_sources/${process.env.NOTION_DATA_SOURCE_ID}/query`,
          {
            method: 'POST',
            body: {
              filter: {
                property: 'Slug',
                rich_text: { equals: slugKey }
              }
            },
            tags: ['notion-content', `slug-${slugKey}`],
            revalidate: 600 // 10分钟缓存，单个内容变化较少
          }
        );

        if (!response.results || response.results.length === 0) {
          return null;
        }

        const pageObject = response.results[0] as unknown as PageObjectResponse;
        const content = await this.getPageContent(pageObject.id);

        const podcasturl = pageObject.properties['podcasturl'] && pageObject.properties['podcasturl'].type === 'url' 
          ? pageObject.properties['podcasturl'].url || '' 
          : '';
        console.log("cover url", pageObject.cover?.type === 'file' ? pageObject.cover.file?.url : pageObject.cover?.external?.url || '');
        return {
          id: pageObject.id,
          title: pageObject.properties['Title'].type === 'rich_text' ? pageObject.properties['Title'].rich_text[0]?.plain_text || '' : '',
          date: pageObject.properties['Date'].type === 'date' ? pageObject.properties['Date'].date?.start || '' : '',
          excerpt: pageObject.properties['Excerpt'].type === 'rich_text' ? pageObject.properties['Excerpt'].rich_text[0]?.plain_text || '' : '',
          slug: pageObject.properties['Slug'].type === 'rich_text' ? pageObject.properties['Slug'].rich_text[0]?.plain_text || '' : '',
          content: content,
          cover: pageObject.cover?.type === 'file' ? pageObject.cover.file?.url : pageObject.cover?.external?.url || '',
          podcasturl: podcasturl,
        };
      },
      [slug], // 使用 slug 作为缓存键
      {
        tags: ['notion-content', `slug-${slug}`],
        revalidate: 600, // 10分钟缓存
      }
    );

    return getCachedContentBySlug(slug);
  }

  /**
   * Get paginated content with optional tag filtering
   */
  async getPaginatedContent(options: {
    page?: number;
    pageSize?: number;
    tag?: string;
    cursor?: string;
  } = {}): Promise<{
    items: ContentItem[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
    nextCursor?: string;
  }> {
    const { page = 1, pageSize = 10, tag, cursor } = options;
    console.log(`🔍 Getting paginated content:`, { page, pageSize, tag, cursor });

    // Get current date for filtering future posts
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Build filter conditions
    const filterConditions: Array<Record<string, unknown>> = [
      {
        property: 'Status',
        select: { equals: 'published' }
      },
      {
        property: 'Date',
        date: { on_or_before: today }
      }
    ];

    // Add tag filter if specified
    if (tag) {
      filterConditions.push({
        property: 'Tags',
        multi_select: { contains: tag }
      });
    }

    const requestBody: Record<string, unknown> = {
      filter: {
        and: filterConditions
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ],
      page_size: pageSize
    };

    // Add cursor for pagination if provided
    if (cursor) {
      requestBody.start_cursor = cursor;
    }

    console.log(`📅 Filtering content with date <= ${today}${tag ? ` and tag: ${tag}` : ''}`);

    const response = await notionFetch(
      `data_sources/${process.env.NOTION_DATA_SOURCE_ID}/query`,
      {
        method: 'POST',
        body: requestBody,
        tags: ['notion-content', 'notion-datasource', ...(tag ? [`tag-${tag}`] : [])],
        revalidate: 600 // 5分钟缓存
      }
    );

    const contentItems = await Promise.all(
      response.results.map(async (item: unknown) => {
        const pageObject = item as unknown as PageObjectResponse;
        return await this.parsePage(pageObject);
      })
    );

    const validItems = contentItems.filter(item => item !== null) as ContentItem[];

    console.log(`✅ Retrieved ${validItems.length} content items (page ${page}${tag ? `, tag: ${tag}` : ''})`);

    return {
      items: validItems,
      totalCount: validItems.length, // Note: Notion doesn't provide total count directly
      hasMore: response.has_more || false,
      currentPage: page,
      nextCursor: response.next_cursor || undefined
    };
  }

  /**
   * Get all available tags from published content
   */
  async getAllTags(): Promise<string[]> {
    console.log('🏷️ Getting all available tags');

    const getCachedTags = unstable_cache(
      async () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        const response = await notionFetch(
          `data_sources/${process.env.NOTION_DATA_SOURCE_ID}/query`,
          {
            method: 'POST',
            body: {
              filter: {
                and: [
                  {
                    property: 'Status',
                    select: { equals: 'published' }
                  },
                  {
                    property: 'Date',
                    date: { on_or_before: today }
                  }
                ]
              }
            },
            tags: ['notion-tags'],
            revalidate: 600 // 10分钟缓存
          }
        );

        const allTags = new Set<string>();
        
        response.results.forEach((item: unknown) => {
          const pageObject = item as PageObjectResponse;
          if (pageObject.properties['Tags'] && pageObject.properties['Tags'].type === 'multi_select') {
            pageObject.properties['Tags'].multi_select.forEach((tag: { name: string }) => {
              allTags.add(tag.name);
            });
          }
        });

        const sortedTags = Array.from(allTags).sort();
        console.log(`✅ Found ${sortedTags.length} unique tags:`, sortedTags);
        return sortedTags;
      },
      ['all-tags'],
      {
        tags: ['notion-tags', 'all-tags'],
        revalidate: 600, // 10分钟缓存
      }
    );

    return getCachedTags();
  }




  private async parsePage(page: PageObjectResponse): Promise<ContentItem | null> {
    console.log(`🔍 Parsing content for page: ${page.id}`);
    try {

      return {
        id: page.id,
        title: page.properties['Title'].type === 'rich_text' ? page.properties['Title'].rich_text[0]?.plain_text || '' : '',
        date: page.properties['Date'].type === 'date' ? page.properties['Date'].date?.start || '' : '',
        excerpt: page.properties['Excerpt'].type === 'rich_text' ? page.properties['Excerpt'].rich_text[0]?.plain_text || '' : '',
        slug: page.properties['Slug'].type === 'rich_text' ? page.properties['Slug'].rich_text[0]?.plain_text || '' : '',
        content: '',
        cover: page.cover?.type === 'file' ? page.cover.file?.url : page.cover?.external?.url || '',
        tags: page.properties['Tags'].type === 'multi_select' ? page.properties['Tags'].multi_select.map((tag: { name: string }) => tag.name) || [] : [],
        podcasturl: page.properties['podcasturl'] && page.properties['podcasturl'].type === 'url' ? page.properties['podcasturl'].url || '' : '',
      }
    } catch (error) {
      console.error(`❌ Error parsing content for page ${page.id}:`, error);
      return null;
    }
  }

}
export const notionService = new NotionService();
