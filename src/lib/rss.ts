import { ContentItem } from '@/types/content';

export function generateRSSFeed(contentItems: ContentItem[]): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com';
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE || 'Daily Content Blog';
  const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Daily content from Google Drive';

  const rssItems = contentItems
    .slice(0, 20) // Limit to latest 20 items
    .map(item => {
      const itemUrl = `${siteUrl}/content/${item.slug}`;
      const pubDate = new Date(item.date).toUTCString();
      
      return `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.excerpt}]]></description>
      <link>${itemUrl}</link>
      <guid isPermaLink="true">${itemUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      ${item.tags?.map(tag => `<category><![CDATA[${tag}]]></category>`).join('') || ''}
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${siteTitle}]]></title>
    <description><![CDATA[${siteDescription}]]></description>
    <link>${siteUrl}</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Next.js RSS Generator</generator>
    ${rssItems}
  </channel>
</rss>`;
}