import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const quality = searchParams.get('q') || '75';
  const width = searchParams.get('w');
  const height = searchParams.get('h');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  try {


    // 验证 URL 是否来自允许的域名
    const allowedDomains = [
      'www.notion.so',
      'images.unsplash.com',
      'prod-files-secure.s3.us-west-2.amazonaws.com',
      's3.us-west-2.amazonaws.com'
    ];

    const url = new URL(imageUrl);
    if (!allowedDomains.includes(url.hostname)) {
      return new NextResponse('Domain not allowed', { status: 403 });
    }

    // 获取图片
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'ButtonUp-ImageProxy/1.0',
      },
    });

    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: imageResponse.status });
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();

    // 设置缓存头
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=31536000'); // 24小时浏览器缓存，1年CDN缓存
    headers.set('ETag', `"${Buffer.from(imageBuffer).toString('base64').slice(0, 16)}"`);
    headers.set('Vary', 'Accept');

    // 添加图片优化信息
    if (width || height) {
      headers.set('X-Image-Optimized', 'true');
    }

    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

// 支持 HEAD 请求用于缓存验证
export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse(null, { status: 400 });
  }

  try {

    const allowedDomains = [
      'www.notion.so',
      'images.unsplash.com',
      'prod-files-secure.s3.us-west-2.amazonaws.com',
      's3.us-west-2.amazonaws.com'
    ];
    console.log("received URL is ", imageUrl)
    const url = new URL(imageUrl);
    if (!allowedDomains.includes(url.hostname)) {
      return new NextResponse(null, { status: 403 });
    }

    const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
    
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=31536000');
    headers.set('Content-Type', imageResponse.headers.get('content-type') || 'image/jpeg');

    return new NextResponse(null, {
      status: imageResponse.status,
      headers,
    });

  } catch (error) {
    console.error('Image proxy HEAD error:', error);
    return new NextResponse(null, { status: 500 });
  }
}
