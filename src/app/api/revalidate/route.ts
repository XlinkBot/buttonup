import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { notifyBulkContentUpdate } from '@/lib/seo-notifications';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/secret key for security
    const authHeader = request.headers.get('authorization');
    const secret = process.env.REVALIDATE_SECRET;
    
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Auto revalidation triggered');
    
    // Revalidate content API cache tags
    revalidateTag('content-api');
    revalidateTag('notion-content');
    revalidateTag('content-list');
    
    // Revalidate all content pages using Next.js built-in ISR
    revalidatePath('/', 'layout'); // Revalidate entire app
    revalidatePath('/');
    revalidatePath('/archive');
    revalidatePath('/search');
    revalidatePath('/content/[slug]', 'page');
    revalidatePath('/rss.xml');
    revalidatePath('/sitemap.xml');
    
    console.log('✅ Next.js ISR revalidation completed');

    // 自动触发SEO通知（IndexNow + Google Search Console）
    console.log('🔄 Triggering automatic SEO notifications...');
    const seoResult = await notifyBulkContentUpdate('all');
    
    return NextResponse.json({ 
      message: 'Auto revalidation and SEO notification successful',
      timestamp: new Date().toISOString(),
      seoNotifications: seoResult
    });
  } catch (error) {
    console.error('❌ Auto revalidation error:', error);
    return NextResponse.json(
      { message: 'Auto revalidation failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to trigger revalidation',
    endpoints: {
      revalidate: 'POST /api/revalidate',
      auth: 'Bearer token (if REVALIDATE_SECRET is set)'
    }
  });
}