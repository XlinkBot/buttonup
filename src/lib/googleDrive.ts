import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  date: string;
  excerpt: string;
  slug: string;
  tags?: string[];
}

interface GoogleServiceAccountKey {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

class GoogleDriveService {
  private drive: ReturnType<typeof google.drive>;
  private auth: JWT;
  private cache: Map<string, { data: ContentItem[]; timestamp: number }> = new Map();
  private cacheKey = 'all_content';
  private cacheDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    console.log('🚀 GoogleDriveService constructor called');
    console.log('🔑 Environment variables check:');
    console.log('  - GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? '✅ Set' : '❌ Not set');
    console.log('  - GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? '✅ Set' : '❌ Not set');
    console.log('  - GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID ? '✅ Set' : '❌ Not set');
    console.log('  - GOOGLE_KEY_FILE_PATH:', process.env.GOOGLE_KEY_FILE_PATH ? '✅ Set' : '❌ Not set');
    console.log('  - GOOGLE_KEY_FILE_JSON:', process.env.GOOGLE_KEY_FILE_JSON ? '✅ Set' : '❌ Not set');
    
    // Initialize with environment variables first
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/drive.readonly']
    });

    this.drive = google.drive({ version: 'v3', auth: this.auth });
    console.log('🚀 GoogleDriveService initialized with environment variables');
  }

  private loadKeyFile(): GoogleServiceAccountKey | null {
    console.log('🔐 Loading Google key file...');
    try {
      // Check if GOOGLE_KEY_FILE_PATH is provided
      if (process.env.GOOGLE_KEY_FILE_PATH) {
        console.log('📁 Using GOOGLE_KEY_FILE_PATH:', process.env.GOOGLE_KEY_FILE_PATH);
        const keyFilePath = path.resolve(process.env.GOOGLE_KEY_FILE_PATH);
        console.log('📁 Resolved key file path:', keyFilePath);
        const keyFileContent = fs.readFileSync(keyFilePath, 'utf8');
        const keyData = JSON.parse(keyFileContent);
        console.log('✅ Key file loaded successfully from path');
        console.log('📧 Key file client_email:', keyData.client_email);
        return keyData;
      }
      // Check if GOOGLE_KEY_FILE_JSON is provided (for deployment platforms)
      else if (process.env.GOOGLE_KEY_FILE_JSON) {
        console.log('📄 Using GOOGLE_KEY_FILE_JSON');
        const keyData = JSON.parse(process.env.GOOGLE_KEY_FILE_JSON);
        console.log('✅ Key file loaded successfully from JSON');
        console.log('📧 Key file client_email:', keyData.client_email);
        return keyData;
      } else {
        console.log('ℹ️ No key file environment variables found');
      }
    } catch (error) {
      console.warn('❌ Could not load Google key file, using environment variables:', error);
    }
    return null;
  }

  async initialize() {
    console.log('🔧 Starting Google Drive service initialization...');
    try {
      // Try to load key file first
      const keyData = this.loadKeyFile();
      
      if (keyData) {
        console.log('🔑 Reinitializing auth with key file data...');
        // Reinitialize auth with key file data
        this.auth = new google.auth.JWT({
          email: keyData.client_email,
          key: keyData.private_key,
          scopes: ['https://www.googleapis.com/auth/drive.readonly']
        });
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        console.log('✅ Auth reinitialized with key file');
      } else {
        console.log('🔑 Using environment variable auth');
      }
      
      console.log('🔐 Attempting to authorize...');
      await this.auth.authorize();
      console.log('✅ Google Drive service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive service:', error);
      return false;
    }
  }

  async getContentFiles() {
    console.log('📁 Fetching content files from Google Drive...');
    console.log('📁 Using folder ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);
    
    try {
      // Update query to include Google Docs and plain text files
      const query = `'${process.env.GOOGLE_DRIVE_FOLDER_ID}' in parents and (mimeType='text/plain' or mimeType='application/vnd.google-apps.document')`;
      console.log('📁 Drive query:', query);
      
      const response = await this.drive.files.list({
        q: query,
        orderBy: 'modifiedTime desc',
        fields: 'files(id, name, modifiedTime, webViewLink, mimeType)',
      });

      const files = response.data.files || [];
      console.log('📁 Files found:', files.length);
      console.log('📁 File details:', files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime
      })));

      return files as Array<{
        id?: string | null;
        name?: string | null;
        mimeType?: string | null;
        modifiedTime?: string | null;
        webViewLink?: string | null;
      }>;
    } catch (error) {
      console.error('❌ Error fetching files from Google Drive:', error);
      return [];
    }
  }

  async getFileContent(fileId: string, mimeType?: string): Promise<string> {
    console.log(`📄 Fetching content for file ID: ${fileId}, mimeType: ${mimeType}`);
    try {
      let response;
      
      if (mimeType === 'application/vnd.google-apps.document') {
        // For Google Docs, export as plain text
        console.log(`📄 Exporting Google Doc as plain text...`);
        response = await this.drive.files.export({
          fileId: fileId,
          mimeType: 'text/plain',
        }, {
          responseType: 'text'
        });
      } else {
        // For regular files, get media content
        console.log(`📄 Getting media content...`);
        response = await this.drive.files.get({
          fileId: fileId,
          alt: 'media',
        }, {
          responseType: 'text'
        });
      }

      const content = response.data as string;
      console.log(`📄 Content fetched for ${fileId}, length: ${content.length} characters`);
      return content;
    } catch (error) {
      console.error(`❌ Error fetching content for file ${fileId}:`, error);
      return '';
    }
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

  async getAllContent(useCache: boolean = true): Promise<ContentItem[]> {
    console.log('📋 Starting getAllContent process...');
    
    // Check cache first
    if (useCache) {
      const cachedContent = this.getCachedContent();
      if (cachedContent) {
        return cachedContent;
      }
    }

    console.log('🔄 Fetching fresh content from Google Drive...');
    const files = await this.getContentFiles();
    const contentItems: ContentItem[] = [];
    console.log(`📋 Processing ${files.length} files...`);

    for (const file of files) {
      console.log(`📋 Processing file: ${file.name} (ID: ${file.id}, MIME: ${file.mimeType})`);
      if (file.id && file.name && file.modifiedTime) {
        const content = await this.getFileContent(file.id, file.mimeType || undefined);
        if (content) {
          console.log(`📋 Parsing content for: ${file.name}`);
          const parsedContent = this.parseContent(content, file.name, file.modifiedTime);
          if (parsedContent) {
            contentItems.push(parsedContent);
            console.log(`✅ Added content item: ${parsedContent.title}`);
          } else {
            console.log(`❌ Failed to parse content for: ${file.name}`);
          }
        } else {
          console.log(`❌ No content retrieved for: ${file.name}`);
        }
      } else {
        console.log(`❌ Missing required file properties for: ${file.name}`);
      }
    }

    const sortedItems = contentItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Cache the results
    if (useCache) {
      this.setCachedContent(sortedItems);
    }
    
    console.log(`📋 Returning ${sortedItems.length} content items`);
    return sortedItems;
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

  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // Extract from YAML front matter
    const yamlMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      // Look for tags: ["tag1", "tag2"] or tags: [tag1, tag2]
      const yamlTagsMatch = yamlContent.match(/tags:\s*\[(.*?)\]/);
      if (yamlTagsMatch) {
        const yamlTags = yamlTagsMatch[1]
          .split(',')
          .map(tag => tag.trim().replace(/['"]/g, ''))
          .filter(tag => tag.length > 0);
        tags.push(...yamlTags);
      }
    }

    // Extract hashtag-style tags (#tag)
    const hashtagMatches = content.match(/#\w+/g);
    if (hashtagMatches) {
      const hashtagTags = hashtagMatches.map(tag => tag.substring(1));
      tags.push(...hashtagTags);
    }

    // Remove duplicates and return
    return [...new Set(tags)];
  }

  private parseContent(content: string, filename: string, modifiedTime: string): ContentItem | null {
    console.log(`🔍 Parsing content for filename: ${filename}`);
    try {
      // Extract date from filename (assuming format: YYYY-MM-DD-title.txt)
      const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
      const date = dateMatch ? dateMatch[1] : new Date(modifiedTime).toISOString().split('T')[0];
      console.log(`🔍 Extracted date: ${date}`);
      
      // Extract title from filename
      const title = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.txt$/, '');
      console.log(`🔍 Extracted title: ${title}`);
      
      // Create slug from title
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      console.log(`🔍 Generated slug: ${slug}`);
      
      // Extract excerpt (first 150 characters, strip markdown)
      const excerpt = this.generateExcerpt(content);
      console.log(`🔍 Generated excerpt length: ${excerpt.length}`);
      
      // Extract tags from content (look for #tag patterns and YAML front matter)
      const tags = this.extractTags(content);
      console.log(`🔍 Extracted tags: ${tags}`);

      const parsedItem = {
        id: filename,
        title,
        content,
        date,
        excerpt,
        slug,
        tags
      };
      
      console.log(`✅ Successfully parsed content item for: ${filename}`);
      return parsedItem;
    } catch (error) {
      console.error(`❌ Error parsing content for ${filename}:`, error);
      return null;
    }
  }
}

export const googleDriveService = new GoogleDriveService();