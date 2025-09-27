import { fetchAllContent } from '@/lib/content-api';

export async function GET() {
  try {
    console.log('🗺️ Generating sitemap...');
    
    // Fetch all content
    const contentItems = await fetchAllContent();
    
    const baseUrl = 'https://buttonup.cloud'; // 请替换为你的实际域名
    
    // Static pages
    const staticPages = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/rss.xml`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.8
      },
      {
        url: `${baseUrl}/llm.txt`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.6
      }
    ];
    
    // Dynamic content pages
    const contentPages = contentItems.map(item => ({
      url: `${baseUrl}/content/${item.slug}`,
      lastModified: new Date(item.date).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9
    }));
    
    const allPages = [...staticPages, ...contentPages];
    
    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    console.log(`🗺️ Sitemap generated with ${allPages.length} URLs`);

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
