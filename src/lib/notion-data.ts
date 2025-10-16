import { ContentItem } from "@/types/content";

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
  
export interface PageObjectResponse {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: Record<string, any>;
    cover?: {
      type: 'file' | 'external';
      file?: { url: string };
      external?: { url: string };
    };
  }
  export interface NotionBlock {
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
  

export function blockToMarkdown(block: NotionBlock): string {
    const type = block.type;
    let text = '';

    switch (type) {
      case 'paragraph':
        text = richTextToMarkdown(block.paragraph?.rich_text || []);
        return text ? `${text}\n\n` : '';

      case 'heading_1':
        text = richTextToMarkdown(block.heading_1?.rich_text || []);
        return text ? `# ${text}\n\n` : '';

      case 'heading_2':
        text = richTextToMarkdown(block.heading_2?.rich_text || []);
        return text ? `## ${text}\n\n` : '';

      case 'heading_3':
        text = richTextToMarkdown(block.heading_3?.rich_text || []);
        return text ? `### ${text}\n\n` : '';

      case 'bulleted_list_item':
        text = richTextToMarkdown(block.bulleted_list_item?.rich_text || []);
        return text ? `- ${text}\n` : '';

      case 'numbered_list_item':
        text = richTextToMarkdown(block.numbered_list_item?.rich_text || []);
        return text ? `1. ${text}\n` : '';

      case 'quote':
        text = richTextToMarkdown(block.quote?.rich_text || []);
        return text ? `> ${text}\n\n` : '';

      case 'code':
        text = richTextToMarkdown(block.code?.rich_text || []);
        const language = block.code?.language || '';
        return text ? `\`\`\`${language}\n${text}\n\`\`\`\n\n` : '';

      case 'divider':
        return '---\n\n';

      case 'image':
        const imageUrl = block.image?.file?.url || block.image?.external?.url || '';
        const caption = richTextToMarkdown(block.image?.caption || []);
        return imageUrl ? `![${caption}](${imageUrl})\n\n` : '';

      case 'video':
        const videoUrl = block.video?.file?.url || block.video?.external?.url || '';
        const videoCaption = richTextToMarkdown(block.video?.caption || []);
        return videoUrl ? `[Video: ${videoCaption}](${videoUrl})\n\n` : '';

      case 'file':
        const fileUrl = block.file?.file?.url || block.file?.external?.url || '';
        const fileName = block.file?.name || 'File';
        return fileUrl ? `[${fileName}](${fileUrl})\n\n` : '';

      case 'bookmark':
        const bookmarkUrl = block.bookmark?.url || '';
        return bookmarkUrl ? `[Bookmark](${bookmarkUrl})\n\n` : '';

      case 'callout':
        text = richTextToMarkdown(block.callout?.rich_text || []);
        const icon = block.callout?.icon?.emoji || '💡';
        return text ? `${icon} ${text}\n\n` : '';

      case 'toggle':
        text = richTextToMarkdown(block.toggle?.rich_text || []);
        return text ? `<details><summary>${text}</summary>\n\n</details>\n\n` : '';

      case 'table':
        // For tables, we'd need to recursively get the table rows
        return '| Table content not fully supported yet |\n|---|\n\n';

      default:
        console.log(`⚠️ Unsupported block type: ${type}`);
        return '';
    }
  }

  export function richTextToMarkdown(richText: RichTextItem[]): string {
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


    /**
   * Lightweight parsing for search results - doesn't fetch full content
   */
    export async function parsePageToContentItem(page: PageObjectResponse): Promise<ContentItem | null> {
        try {
          const title = page.properties['Title'].type === 'rich_text' ? page.properties['Title'].rich_text[0]?.plain_text || '' : '';
          const excerpt = page.properties['Excerpt'].type === 'rich_text' ? page.properties['Excerpt'].rich_text[0]?.plain_text || '' : '';
          const date = page.properties['Date'].type === 'date' ? page.properties['Date'].date?.start || '' : '';
          const slug = page.properties['Slug'].type === 'rich_text' ? page.properties['Slug'].rich_text[0]?.plain_text || '' : '';
          
          // Parse tags
          let tags: string[] = [];
          if (page.properties['Tags'] && page.properties['Tags'].type === 'multi_select') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tags = page.properties['Tags'].multi_select.map((tag: any) => tag.name);
          }
    
          // Get cover image
          const cover = page.cover?.type === 'file' ? page.cover.file?.url : page.cover?.external?.url || '';
    
          // Get podcast URL
          const podcasturl = page.properties['podcasturl'] && page.properties['podcasturl'].type === 'url' 
            ? page.properties['podcasturl'].url || '' 
            : '';
    
          return {
            id: page.id,
            title,
            excerpt,
            date,
            slug: slug,
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