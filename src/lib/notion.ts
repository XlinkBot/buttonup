import { Client, DatabaseObjectResponse, DataSourceObjectResponse, GetDataSourceResponse, PageObjectResponse } from '@notionhq/client';
import { ContentItem } from '@/types/content';

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
}


class NotionService {
  private notion: Client;
  private datasourceId: string = '';
  private cache: Map<string, { data: ContentItem[]; timestamp: number }> = new Map();
  private cacheKey = 'all_content';
  private cacheDuration = 5 * 60 * 1000; // 5 minutes - 恢复缓存
  private pendingSlugUpdates: Set<string> = new Set(); // Track pages being updated
  private isInitialized = false;

  constructor() {
    console.log('🚀 NotionService constructor called');
    console.log('🔑 Environment variables check:');
    console.log('  - NOTION_API_KEY:', process.env.NOTION_API_KEY ? '✅ Set' : '❌ Not set');
    console.log('  - NOTION_DATABASE_ID:', process.env.NOTION_DATABASE_ID ? '✅ Set' : '❌ Not set');
    
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY environment variable is required');
    }

    this.notion = new Client({
      auth: process.env.NOTION_API_KEY,
    });


  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }
    const dbResp = await this.notion.databases.retrieve({
      database_id: process.env.NOTION_DATABASE_ID as string,
    });
    const dbo = dbResp as unknown as DatabaseObjectResponse;
    const dataSourceId = dbo.data_sources?.[0]?.id;
    console.log('🔍 Data source ID:', dataSourceId);
    this.datasourceId = dataSourceId;
    console.log('🔍 Database info:', JSON.stringify(dbResp, null, 2));
    this.isInitialized = true;
    console.log('🚀 NotionService initialized');

  }

  async getSimpleContentList(): Promise<ContentItem[]> {
    
    await this.initialize();
    const dsResponse = await this.notion.dataSources.query({
      data_source_id: this.datasourceId,
      filter: {
        property: 'Status',
        select: { equals: 'published' }
      },
      //use property id, not name
      filter_properties: ['DCjV','Hkwn','title','uz%3Dr', 'uqsf','lqcp','%3FC%5Dc'
      ]
    });

    return await Promise.all(dsResponse.results.map(async (item) => {
      const pageObject = item as unknown as PageObjectResponse;
      return  await this.parsePage(pageObject);
      
    })) as unknown as ContentItem[];

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

  private isCacheValid(cacheEntry: { data: ContentItem[]; timestamp: number }): boolean {
    return Date.now() - cacheEntry.timestamp < this.cacheDuration;
  }

  private getCachedContent(): ContentItem[] | null {
    const cacheEntry = this.cache.get(this.cacheKey);
    if (cacheEntry && this.isCacheValid(cacheEntry)) {
      console.log('💾 Using cached content');
      return cacheEntry.data;
    }
    return null;
  }

  private setCachedContent(content: ContentItem[]): void {
    this.cache.set(this.cacheKey, {
      data: content,
      timestamp: Date.now()
    });
    console.log(`💾 Cached ${content.length} content items`);
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
   * Get content by slug - optimized for single item lookup
   */
  async getContentBySlug(slug: string): Promise<ContentItem | null> {
    console.log(`🔍 Finding content by slug: ${slug}`);
    console.log(`⚠️  Performance Warning: Currently fetching ALL content to find single item`);
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

    return {
      id: pageObject.id,
      title: pageObject.properties['Title'].type === 'rich_text' ? pageObject.properties['Title'].rich_text[0]?.plain_text || '' : '',
      date: pageObject.properties['Date'].type === 'date' ? pageObject.properties['Date'].date?.start || '' : '',
      excerpt: pageObject.properties['Excerpt'].type === 'rich_text' ? pageObject.properties['Excerpt'].rich_text[0]?.plain_text || '' : '',
      slug: pageObject.properties['Slug'].type === 'rich_text' ? pageObject.properties['Slug'].rich_text[0]?.plain_text || '' : '',
      content: content,
      cover: pageObject.cover?.type === 'file' ? pageObject.cover.file.url : pageObject.cover?.external?.url || '',
    }



  }

  private generateExcerpt(content: string, maxLength: number = 300): string {
    // Remove markdown syntax for clean excerpt
    let cleanContent = content
      // Remove headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Remove lists
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Clean up whitespace
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Truncate and add ellipsis
    if (cleanContent.length > maxLength) {
      cleanContent = cleanContent.substring(0, maxLength).trim() + '...';
    }

    return cleanContent;
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
        // Generate slug from title and update Notion
        slug = page.properties['Title'].type === 'rich_text' ? page.properties['Title'].rich_text[0]?.plain_text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : '';
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
      }
    } catch (error) {
      console.error(`❌ Error parsing content for page ${page.id}:`, error);
      return null;
    }
  }
}

export const notionService = new NotionService();
