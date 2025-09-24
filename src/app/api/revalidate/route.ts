import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/secret key for security
    const authHeader = request.headers.get('authorization');
    const secret = process.env.REVALIDATE_SECRET;
    
    if (secret && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Manual revalidation triggered');
    
    // Revalidate content API cache tags
    revalidateTag('content-api');
    
    // Revalidate all content pages using Next.js built-in ISR
    revalidatePath('/', 'layout'); // Revalidate entire app
    revalidatePath('/');
    revalidatePath('/archive');
    revalidatePath('/search');
    revalidatePath('/content/[slug]', 'page');
    revalidatePath('/rss.xml');
    revalidatePath('/api/content');
    revalidatePath('/api/content/[slug]', 'page');
    
    console.log('✅ Next.js ISR revalidation completed');
    
    return NextResponse.json({ 
      message: 'Revalidation successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Revalidation error:', error);
    return NextResponse.json(
      { message: 'Revalidation failed', error: error instanceof Error ? error.message : 'Unknown error' },
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