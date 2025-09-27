export async function GET() {
  const robotsContent = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://buttonup.cloud/sitemap.xml

# Block AI scrapers while allowing search engines
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

# Allow Google Bot
User-agent: Googlebot
Allow: /

# Allow Bing Bot  
User-agent: Bingbot
Allow: /

# Allow Baidu Spider
User-agent: Baiduspider
Allow: /

# Crawl-delay for polite crawling
Crawl-delay: 1

# Important pages that should be crawled frequently
Allow: /content/
Allow: /search
Allow: /rss.xml

# Block admin areas if any
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /node_modules/

# Block query parameters that don't change content
Disallow: /*?utm_*
Disallow: /*?ref=*
Disallow: /*?source=*`;

  return new Response(robotsContent, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    },
  });
}
