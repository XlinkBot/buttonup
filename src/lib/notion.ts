import { Client, DatabaseObjectResponse, PageObjectResponse } from '@notionhq/client';
import { ContentItem } from '@/types/content';
import { NComment, NewsItem} from '@/types/news';
import pinyin from 'tiny-pinyin';

interface RichTextItem {
  plain_text: string;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
  };
  href?: string;
}

interface BlockContent {
  rich_text?: RichTextItem[];
  language?: string;
  url?: string;
  caption?: RichTextItem[];
  name?: string;
  icon?: {
    emoji?: string;
  };
  file?: {
    url?: string;
  };
  external?: {
    url?: string;
  };
}

interface NotionBlock {
  type: string;
  paragraph?: BlockContent;
  heading_1?: BlockContent;
  heading_2?: BlockContent;
  heading_3?: BlockContent;
  bulleted_list_item?: BlockContent;
  numbered_list_item?: BlockContent;
  quote?: BlockContent;
  code?: BlockContent;
  image?: BlockContent;
  video?: BlockContent;
  file?: BlockContent;
  bookmark?: BlockContent;
  callout?: BlockContent;
  toggle?: BlockContent;
}

export interface NotionPageProperties {
  Title: {
    rich_text: Array<{
      plain_text: string;
    }>;
  };
  Date: {
    date: {
      start: string;
    } | null;
  };
  Tags: {
    multi_select: Array<{
      name: string;
    }>;
  };
  Status: {
    select: {
      name: string;
    } | null;
  };
  Slug?: {
    rich_text: Array<{
      plain_text: string;
    }>;
  };
  Excerpt?: {
    rich_text: Array<{
      plain_text: string;
    }>;
  };
  PodcastUrl?: {
    rich_text: Array<{
      plain_text: string;
    }>;
  };
}


class NotionService {
  private notion: Client;
  private datasourceId: string = '';
  private newsDatasourceId: string = '';
  private cache: Map<string, { data: ContentItem[]; timestamp: number }> = new Map();
  private cacheKey = 'all_content';
  private pendingSlugUpdates: Set<string> = new Set(); // Track pages being updated
  private isInitialized = false;

  /**
   * Generate URL-friendly slug from Chinese text
   * Converts Chinese characters to pinyin and creates clean URLs
   */
  private generateSlug(title: string): string {
    console.log(`🔧 Generating slug for title: "${title}"`);
    
    try {
      // Convert Chinese characters to pinyin using tiny-pinyin
      const pinyinResult = pinyin.convertToPinyin(title);
      
      console.log(`📝 Pinyin conversion result:`, pinyinResult);
      
      // Process the pinyin result into a clean slug
      const slug = pinyinResult
        .toLowerCase() // Convert to lowercase
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters, keep letters, numbers, spaces, and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
      
      console.log(`✅ Generated slug: "${slug}"`);
      return slug || 'untitled'; // Fallback if slug is empty
      
    } catch (error) {
      console.error('❌ Error generating pinyin slug:', error);
      
      // Fallback to simple ASCII slug generation
      const fallbackSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'untitled';
      
      console.log(`🔄 Using fallback slug: "${fallbackSlug}"`);
      return fallbackSlug;
    }
  }

  constructor() {
    console.log('🚀 NotionService constructor called');
    console.log('🔑 Environment variables check:');
    console.log('  - NOTION_API_KEY:', process.env.NOTION_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('  - NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✅ Set' : '❌ Not set');
    console.log('  - NOTION_NEWS_DATABASE_ID:', process.env.NOTION_NEWS_DATABASE_ID ? '✅ Set' : '❌ Not set');
    
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }

    this.notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });


  }

  async initialize() {
    console.warn("initialize")
    if (this.isInitialized) {
      return;
    }

    if (!process.env.NOTION_NEWS_DATABASE_ID) {
      throw new Error('NOTION_NEWS_DATABASE_ID environment variable is required for news functionality');
    }

    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error('NOTION_DATABASE_ID environment variable is required for content functionality');
    }

    const newsDbResp = await this.notion.databases.retrieve({
      database_id: process.env.NOTION_NEWS_DATABASE_ID as string,
    });

    const newsDbo = newsDbResp as unknown as DatabaseObjectResponse;
    const newsDataSourceId = newsDbo.data_sources?.[0]?.id;
    console.warn("newsDataSourceId", newsDataSourceId)
    this.newsDatasourceId = newsDataSourceId;
    console.log('🚀 NotionService news initialized');

    const dbResp = await this.notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID as string,
    });
    const dbo = dbResp as unknown as DatabaseObjectResponse;
    const dataSourceId = dbo.data_sources?.[0]?.id;
    console.warn("dataSourceId", dataSourceId)
    this.datasourceId = dataSourceId;
    this.isInitialized = true;
    console.log('🚀 NotionService initialized');

  }


  async getSimpleContentList(): Promise<ContentItem[]> {
    console.warn("getSimpleContentList")
    await this.initialize();
    
    // Get current date for filtering future posts
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log(`📅 Filtering content with date <= ${today} (excluding future posts)`);
    
    const dsResponse = await this.notion.dataSources.query({
      data_source_id: this.datasourceId,
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
      },
      //use property id, not name
      filter_properties: ['DCjV','Hkwn','title','uz%3Dr', 'uqsf','lqcp','%3FC%5Dc','jiMO'
      ]
    });

    const contentItems = await Promise.all(dsResponse.results.map(async (item) => {
      const pageObject = item as unknown as PageObjectResponse;
      return  await this.parsePage(pageObject);
      
    })) as unknown as ContentItem[];
    
    console.log(`✅ Retrieved ${contentItems.length} published content items (excluding future dates)`);
    return contentItems;

  }

  /**
   * Get paginated content list with optional date filtering
   * 获取分页内容列表，支持日期过滤
   */
  async getPaginatedContent(options: {
    page?: number;
    pageSize?: number;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    items: ContentItem[];
    totalCount: number;
    hasMore: boolean;
    currentPage: number;
  }> {
    console.log(`📄 Getting paginated content:`, options);
    await this.initialize();
    
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const offset = (page - 1) * pageSize;
    
    // Get current date for filtering future posts
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Build filter conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filterConditions: any[] = [
      {
        property: 'Status',
        select: { equals: 'published' }
      },
      {
        property: 'Date',
        date: { on_or_before: today }
      }
    ];
    
    // Add date range filters if provided
    if (options.startDate) {
      filterConditions.push({
        property: 'Date',
        date: { on_or_after: options.startDate }
      });
    }
    
    if (options.endDate) {
      filterConditions.push({
        property: 'Date',
        date: { on_or_before: options.endDate }
      });
    }
    
    console.log(`📅 Applying filters:`, filterConditions);
    
    // First, get total count (without pagination)
    const totalResponse = await this.notion.dataSources.query({
      data_source_id: this.datasourceId,
      filter: {
        and: filterConditions
      },
      filter_properties: ['DCjV'] // Only get minimal data for counting
    });
    
    const totalCount = totalResponse.results.length;
    console.log(`📊 Total items found: ${totalCount}`);
    
    // Then get paginated results
    const dsResponse = await this.notion.dataSources.query({
      data_source_id: this.datasourceId,
      filter: {
        and: filterConditions
      },
      filter_properties: ['DCjV','Hkwn','title','uz%3Dr', 'uqsf','lqcp','%3FC%5Dc'],
      sorts: [
        {
          property: 'Date',
          direction: 'descending'
        }
      ]
    });
    
    // Apply manual pagination since Notion datasource doesn't support it directly
    const paginatedResults = dsResponse.results.slice(offset, offset + pageSize);
    
    const contentItems = await Promise.all(paginatedResults.map(async (item) => {
      const pageObject = item as unknown as PageObjectResponse;
      return await this.parsePage(pageObject);
    })) as ContentItem[];
    
    const hasMore = offset + pageSize < totalCount;
    
    console.log(`✅ Retrieved page ${page}: ${contentItems.length} items, hasMore: ${hasMore}`);
    
    return {
      items: contentItems.filter(item => item !== null),
      totalCount,
      hasMore,
      currentPage: page
    };
  }



  async getPageContent(pageId: string): Promise<string> {
    console.log(`📄 Fetching content for page ID: ${pageId}`);
    try {
      const response = await this.notion.blocks.children.list({
        block_id: pageId,
        page_size: 100,
      });

      let content = '';
      
      for (const block of response.results) {
        content += this.blockToMarkdown(block as NotionBlock);
      }

      console.log(`📄 Content fetched for ${pageId}, length: ${content.length} characters`);
      return content;
    } catch (error) {
      console.error(`❌ Error fetching content for page ${pageId}:`, error);
      return '';
    }
  }

  private blockToMarkdown(block: NotionBlock): string {
    const type = block.type;
    let text = '';

    switch (type) {
      case 'paragraph':
        text = this.richTextToMarkdown(block.paragraph?.rich_text || []);
        return text ? `${text}\n\n` : '';

      case 'heading_1':
        text = this.richTextToMarkdown(block.heading_1?.rich_text || []);
        return text ? `# ${text}\n\n` : '';

      case 'heading_2':
        text = this.richTextToMarkdown(block.heading_2?.rich_text || []);
        return text ? `## ${text}\n\n` : '';

      case 'heading_3':
        text = this.richTextToMarkdown(block.heading_3?.rich_text || []);
        return text ? `### ${text}\n\n` : '';

      case 'bulleted_list_item':
        text = this.richTextToMarkdown(block.bulleted_list_item?.rich_text || []);
        return text ? `- ${text}\n` : '';

      case 'numbered_list_item':
        text = this.richTextToMarkdown(block.numbered_list_item?.rich_text || []);
        return text ? `1. ${text}\n` : '';

      case 'quote':
        text = this.richTextToMarkdown(block.quote?.rich_text || []);
        return text ? `> ${text}\n\n` : '';

      case 'code':
        text = this.richTextToMarkdown(block.code?.rich_text || []);
        const language = block.code?.language || '';
        return text ? `\`\`\`${language}\n${text}\n\`\`\`\n\n` : '';

      case 'divider':
        return '---\n\n';

      case 'image':
        const imageUrl = block.image?.file?.url || block.image?.external?.url || '';
        const caption = this.richTextToMarkdown(block.image?.caption || []);
        return imageUrl ? `![${caption}](${imageUrl})\n\n` : '';

      case 'video':
        const videoUrl = block.video?.file?.url || block.video?.external?.url || '';
        const videoCaption = this.richTextToMarkdown(block.video?.caption || []);
        return videoUrl ? `[Video: ${videoCaption}](${videoUrl})\n\n` : '';

      case 'file':
        const fileUrl = block.file?.file?.url || block.file?.external?.url || '';
        const fileName = block.file?.name || 'File';
        return fileUrl ? `[${fileName}](${fileUrl})\n\n` : '';

      case 'bookmark':
        const bookmarkUrl = block.bookmark?.url || '';
        return bookmarkUrl ? `[Bookmark](${bookmarkUrl})\n\n` : '';

      case 'callout':
        text = this.richTextToMarkdown(block.callout?.rich_text || []);
        const icon = block.callout?.icon?.emoji || '💡';
        return text ? `${icon} ${text}\n\n` : '';

      case 'toggle':
        text = this.richTextToMarkdown(block.toggle?.rich_text || []);
        return text ? `<details><summary>${text}</summary>\n\n</details>\n\n` : '';

      case 'table':
        // For tables, we'd need to recursively get the table rows
        return '| Table content not fully supported yet |\n|---|\n\n';

      default:
        console.log(`⚠️ Unsupported block type: ${type}`);
        return '';
    }
  }

  private richTextToMarkdown(richText: RichTextItem[]): string {
    return richText.map(text => {
      let content = text.plain_text || '';
      
      if (text.annotations) {
        if (text.annotations.bold) {
          content = `**${content}**`;
        }
        if (text.annotations.italic) {
          content = `*${content}*`;
        }
        if (text.annotations.strikethrough) {
          content = `~~${content}~~`;
        }
        if (text.annotations.underline) {
          content = `<u>${content}</u>`;
        }
        if (text.annotations.code) {
          content = `\`${content}\``;
        }
      }

      if (text.href) {
        content = `[${content}](${text.href})`;
      }

      return content;
    }).join('');
  }



  public invalidateCache(): void {
    this.cache.delete(this.cacheKey);
    console.log('🗑️ Cache invalidated');
  }

  public async refreshContent(): Promise<ContentItem[]> {
    console.log('🔄 Force refreshing content...');
    this.invalidateCache();
    return await this.getSimpleContentList();
  }

  /**
   * Parse Notion page to NewsItem
   */
  private async parseNewsPage(page: PageObjectResponse): Promise<NewsItem | null> {
    console.log(`🔍 Parsing news for page: ${page.id}`);
    try {
      const title = page.properties['Title']?.type === 'title' 
        ? page.properties['Title'].title[0]?.plain_text || ''
        : page.properties['Title']?.type === 'rich_text'
        ? page.properties['Title'].rich_text[0]?.plain_text || ''
        : '';
      
      const summary = page.properties['Summary']?.type === 'rich_text' 
        ? page.properties['Summary'].rich_text[0]?.plain_text || ''
        : '';
      
      const url = page.properties['URL']?.type === 'url' 
        ? page.properties['URL'].url || ''
        : '';
      
      const publishedAt = page.properties['PublishedAt']?.type === 'date' 
        ? page.properties['PublishedAt'].date?.start || new Date().toISOString()
        : new Date().toISOString();
      
      // Fix: Source is select type, not rich_text
      const source = page.properties['Source']?.type === 'select' 
        ? page.properties['Source'].select?.name || ''
        : page.properties['Source']?.type === 'rich_text'
        ? page.properties['Source'].rich_text[0]?.plain_text || ''
        : '';
      
      const category = page.properties['Category']?.type === 'multi_select' 
        ? page.properties['Category'].multi_select.map(c => c.name).join(', ') || ''
        : '';
      
      const isHot = page.properties['IsHot']?.type === 'checkbox' 
        ? page.properties['IsHot'].checkbox || false
        : false;

      const highlightComment = page.properties['HighLightComment']?.type === 'rich_text' 
        ? page.properties['HighLightComment'].rich_text[0]?.plain_text || ''
        : '';

      //const comments = await this.getNewsComments(page.id);

      const newsItem: NewsItem = {
        id: page.id,
        title,
        summary,
        url,
        publishedAt,
        source,
        category,
        isHot,
        highlightComment,
        comments: []
      };


      return newsItem;
    } catch (error) {
      console.error(`❌ Error parsing news for page ${page.id}:`, error);
      return null;
    }
  }


  /**
   * Update slug in Notion page with rate limiting
   */
  private async updatePageSlug(pageId: string, slug: string): Promise<boolean> {
    // Prevent duplicate updates for the same page
    if (this.pendingSlugUpdates.has(pageId)) {
      console.log(`⏸️ Slug update already pending for page ${pageId}, skipping...`);
      return false;
    }

    try {
      this.pendingSlugUpdates.add(pageId);
      console.log(`🔄 Updating slug for page ${pageId}: ${slug}`);
      
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          Slug: {
            rich_text: [
              {
                text: {
                  content: slug
                }
              }
            ]
          }
        }
      });
      
      console.log(`✅ Successfully updated slug in Notion`);
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to update slug in Notion:`, error);
      return false;
    } finally {
      this.pendingSlugUpdates.delete(pageId);
    }
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
    
    await this.initialize();
    
    try {
      const searchResponse = await this.notion.search({
        query: query.trim(),
        filter: options.filter === 'page' ? { property: 'object', value: 'page' } : undefined,
        page_size: options.pageSize || 20, // Reduced page size for faster results as per Notion docs
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        }
      });

      console.log(`📄 Found ${searchResponse.results.length} search results`);



      const contentItems: ContentItem[] = [];
      const now = new Date();

      for (const page of searchResponse.results) {
        try {
          const contentItem = await this.parsePageToContentItem(page as PageObjectResponse);
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
    await this.initialize();
    const response = await this.notion.dataSources.query({
      data_source_id: this.datasourceId,
      filter: {
        property: 'Slug',
        formula: { string: { equals: slug } }
      }
    });

    const pageObject = response.results[0] as unknown as PageObjectResponse;

    const content = await this.getPageContent(pageObject.id);

    const podcasturl = pageObject.properties['podcasturl'] && pageObject.properties['podcasturl'].type === 'url' 
      ? pageObject.properties['podcasturl'].url || '' 
      : '';

    return {
      id: pageObject.id,
      title: pageObject.properties['Title'].type === 'rich_text' ? pageObject.properties['Title'].rich_text[0]?.plain_text || '' : '',
      date: pageObject.properties['Date'].type === 'date' ? pageObject.properties['Date'].date?.start || '' : '',
      excerpt: pageObject.properties['Excerpt'].type === 'rich_text' ? pageObject.properties['Excerpt'].rich_text[0]?.plain_text || '' : '',
      slug: pageObject.properties['Slug'].type === 'rich_text' ? pageObject.properties['Slug'].rich_text[0]?.plain_text || '' : '',
      content: content,
      cover: pageObject.cover?.type === 'file' ? pageObject.cover.file.url : pageObject.cover?.external?.url || '',
      podcasturl: podcasturl,
    }



  }


  /**
   * Lightweight parsing for search results - doesn't fetch full content
   */
  private async parsePageToContentItem(page: PageObjectResponse): Promise<ContentItem | null> {
    try {
      const title = page.properties['Title'].type === 'rich_text' ? page.properties['Title'].rich_text[0]?.plain_text || '' : '';
      const excerpt = page.properties['Excerpt'].type === 'rich_text' ? page.properties['Excerpt'].rich_text[0]?.plain_text || '' : '';
      const date = page.properties['Date'].type === 'date' ? page.properties['Date'].date?.start || '' : '';
      const slug = page.properties['Slug'].type === 'rich_text' ? page.properties['Slug'].rich_text[0]?.plain_text || '' : '';
      
      // Parse tags
      let tags: string[] = [];
      if (page.properties['Tags'] && page.properties['Tags'].type === 'multi_select') {
        tags = page.properties['Tags'].multi_select.map(tag => tag.name);
      }

      // Get cover image
      const cover = page.cover?.type === 'file' ? page.cover.file.url : page.cover?.external?.url || '';

      // Get podcast URL
      const podcasturl = page.properties['podcasturl'] && page.properties['podcasturl'].type === 'url' 
        ? page.properties['podcasturl'].url || '' 
        : '';

      return {
        id: page.id,
        title,
        excerpt,
        date,
        slug: slug || this.generateSlug(title),
        tags,
        cover,
        podcasturl,
        content: excerpt // Use excerpt as content for search results
      };
    } catch (error) {
      console.error(`❌ Error parsing page for search: ${page.id}`, error);
      return null;
    }
  }

  private async parsePage(page: PageObjectResponse): Promise<ContentItem | null> {
    console.log(`🔍 Parsing content for page: ${page.id}`);
    try {

      let slug: string;
      const existingSlug = page.properties['Slug'].type === 'rich_text' ? page.properties['Slug'].rich_text[0]?.plain_text || '' : '';
      
      if (existingSlug) {
        // Use existing slug from Notion
        slug = existingSlug;
        console.log(`✅ Using existing Notion slug: ${slug}`);
      } else {
        // Generate slug from title using pinyin conversion
        const title = page.properties['Title'].type === 'rich_text' ? page.properties['Title'].rich_text[0]?.plain_text || '' : '';
        slug = this.generateSlug(title);
        console.log(`🔧 Generated new slug: ${slug}`);
        console.log(`📝 Updating Notion with new slug...`);
        
        // Update Notion with the new slug (non-blocking)
        this.updatePageSlug(page.id, slug).catch(error => {
          console.error(`❌ Failed to update slug for page ${page.id}:`, error);
        });
      }
      

      return {
        id: page.id,
        title: page.properties['Title'].type === 'rich_text' ? page.properties['Title'].rich_text[0]?.plain_text || '' : '',
        date: page.properties['Date'].type === 'date' ? page.properties['Date'].date?.start || '' : '',
        excerpt: page.properties['Excerpt'].type === 'rich_text' ? page.properties['Excerpt'].rich_text[0]?.plain_text || '' : '',
        slug: slug,
        content: '',
        cover: page.cover?.type === 'file' ? page.cover.file.url : page.cover?.external?.url || '',
        tags: page.properties['Tags'].type === 'multi_select' ? page.properties['Tags'].multi_select.map(tag => tag.name) || [] : [],
        podcasturl: page.properties['podcasturl'] && page.properties['podcasturl'].type === 'url' ? page.properties['podcasturl'].url || '' : '',
      }
    } catch (error) {
      console.error(`❌ Error parsing content for page ${page.id}:`, error);
      return null;
    }
  }



  /**
   * Get comments for a news item using Notion Comments API
   * 使用 Notion Comments API 获取新闻评论
   */
  async getNewsComments(newsId: string): Promise<NComment[]> {
    console.log(`💬 Getting comments for news: ${newsId}`);
    
      try {
        const commentsResponse = await this.notion.comments.list({
          block_id: newsId
        });
        
        if (commentsResponse.results && commentsResponse.results.length > 0) {
          const comments = commentsResponse.results
          return comments.map(comment => ({
            id: comment.id,
            content: comment.rich_text[0]?.plain_text || '',
            createdAt: comment.created_time
          }));
        }
      } catch {
        console.log(`ℹ️ No comments found via Comments API for ${newsId}, trying other methods...`);
      }
    return [];
  }

  async getNewsById(newsId: string): Promise<NewsItem | null> {
    console.log(`🔍 Getting news by ID: ${newsId}`);
    await this.initialize();
    const response = await this.notion.pages.retrieve({ page_id: newsId });
    const comments = await this.getNewsComments(newsId);
    const newsItem = await this.parseNewsPage(response as PageObjectResponse);

    if (!newsItem) {
      return null;
    }
    return {
      ...newsItem,
      comments
    };
  }


  /**
   * Get today's news filtered by creation date
   * 获取今天的新闻（按创建时间筛选）
   */
  async getTodayNews(): Promise<NewsItem[]> {
    console.log('📰 Getting today\'s news...');
    
    try {
      await this.initialize();
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      const response = await this.notion.dataSources.query({
        data_source_id: this.newsDatasourceId,
        filter: {
          timestamp: 'created_time',
          created_time: {
            on_or_after: startOfDay.toISOString(),
            before: endOfDay.toISOString()
          }
        },
        sorts: [
          {
            property: 'IsHot',
            direction: 'descending'
          },
          {
            timestamp: 'created_time',
            direction: 'descending'
          }
        ]
      });
      
      console.log(`📰 Found ${response.results.length} news items for today`);

      const newsItems: NewsItem[] = [];
      for (const page of response.results) {
        const newsItem = await this.parseNewsPage(page as PageObjectResponse);
        if (newsItem) {
          newsItems.push(newsItem);
        }
      }
      
      console.log(`✅ Successfully parsed ${newsItems.length} today's news items`);
      return newsItems;
      
    } catch (error) {
      console.error('❌ Error getting today\'s news:', error);
      return [];
    }
  }
}
export const notionService = new NotionService();
