import { generateRSSFeed } from '@/lib/rss';
import { fetchAllContent } from '@/lib/content-api';

// Enable ISR for RSS - revalidate every 30 minutes using Next.js built-in ISR
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('📡 Generating RSS feed...');
    
    // Fetch content using backend API
    const contentItems = await fetchAllContent();
    
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