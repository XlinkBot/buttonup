import { googleDriveService } from '@/lib/googleDrive';
import { generateRSSFeed } from '@/lib/rss';
import { ContentItem } from '@/types/content';

// Enable ISR for RSS - revalidate every 30 minutes using Next.js built-in ISR
export const revalidate = 14400; // 4 hours in seconds

export async function GET() {
  try {
    console.log('📡 Generating RSS feed with Next.js ISR...');
    
    // Fetch content using Google Drive service
    // Next.js ISR will handle caching and revalidation automatically
    let contentItems: ContentItem[] = [];
    
    const isInitialized = await googleDriveService.initialize();
    if (isInitialized) {
      contentItems = await googleDriveService.getAllContent();
    }
    
    const rssFeed = generateRSSFeed(contentItems);
    
    console.log(`📡 RSS feed generated with ${contentItems.length} items`);

    return new Response(rssFeed, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=1800', // Cache for 4 hours
      },
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}