import { fetchAllContent } from '@/lib/content-api';

export async function GET() {
  try {
    console.log('🗺️ Generating sitemap...');
    
    // Fetch all content (no time limit)
    const allContentItems = await fetchAllContent();
    
    // Use all content items for sitemap
    const contentItems = allContentItems;
    
    const now = new Date();
    const baseUrl = 'https://buttonup.cloud';
    
    // Static pages - only include indexable pages
    const staticPages = [
      {
        url: `${baseUrl}/`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${baseUrl}/archive`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 0.9
      },
      {
        url: `${baseUrl}/tools`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.8
      },
      {
        url: `${baseUrl}/tools/file-converter`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'monthly',
        priority: 0.7
      }
    ];
    
    // Dynamic content pages - 优化lastModified以反映真实的内容更新时间
    const contentPages = contentItems.map(item => {
      // 使用内容的发布日期作为lastModified，这对SEO更准确
      const contentDate = new Date(item.date);
      
      // 如果内容是最近7天内的，设置为每日更新频率
      const daysSincePublished = Math.floor((now.getTime() - contentDate.getTime()) / (1000 * 60 * 60 * 24));
      const changeFreq = daysSincePublished <= 7 ? 'daily' : 'weekly';
      
      return {
        url: `${baseUrl}/content/${item.slug}`,
        lastModified: contentDate.toISOString(),
        changeFrequency: changeFreq,
        priority: daysSincePublished <= 7 ? 0.9 : 0.8 // 新内容优先级更高
      };
    });
    
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

    console.log(`🗺️ Sitemap generated with ${allPages.length} URLs (${staticPages.length} static, ${contentPages.length} content pages)`);

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
