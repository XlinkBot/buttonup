import { NextRequest, NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';
import { HttpsProxyAgent } from 'https-proxy-agent';
import axios, { AxiosResponse } from 'axios';

interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export const revalidate = 300; // 5 minutes cache

/**
 * GET /api/audio/[slug]
 * Proxy audio files from Notion to client with streaming support
 * 通过代理服务提供音频文件，支持流式传输和范围请求
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  
  // Validate slug to prevent path traversal attacks
  if (!slug || typeof slug !== 'string' || slug.includes('..') || slug.includes('/')) {
    return NextResponse.json(
      { error: 'Invalid slug parameter' },
      { status: 400 }
    );
  }

  console.log(`🎵 Audio Proxy: Fetching audio for slug: ${slug}`);
  
  try {
    // Get content item to retrieve the original audio URL
    const content = await notionService.getContentBySlug(slug);
    
    if (!content) {
      console.log(`❌ Audio Proxy: Content not found for slug: ${slug}`);
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    if (!content.podcasturl) {
      console.log(`❌ Audio Proxy: No audio URL found for slug: ${slug}`);
      return NextResponse.json(
        { error: 'Audio not available for this content' },
        { status: 404 }
      );
    }

    console.log(`🎵 Audio Proxy: Proxying audio from: ${content.podcasturl}`);

    // Get range header for partial content support
    const range = request.headers.get('range');
    
    // Prepare headers for the upstream request
    const upstreamHeaders: Record<string, string> = {
      'User-Agent': 'ButtonUp-AudioProxy/1.0',
    };
    
    // Forward range header if present
    if (range) {
      upstreamHeaders['Range'] = range;
    }

    let audioResponse: AxiosResponse;
    // Fetch the audio file from the original URL, if local testing, need proxy for local testing by https-proxy-agent
    if (process.env.NODE_ENV === 'development') {
        audioResponse = await axios.get(content.podcasturl, {
        headers: upstreamHeaders,
        httpsAgent: new HttpsProxyAgent(process.env.HTTP_PROXY || process.env.HTTPS_PROXY || ''),
        responseType: 'stream', // Enable streaming for better performance
      });
    } else {
        audioResponse = await axios.get (content.podcasturl, {
        headers: upstreamHeaders,
        responseType: 'stream', // Enable streaming for better performance
      });
    }

    // Accept both 200 (full content) and 206 (partial content) as successful responses
    if (audioResponse.status !== 200 && audioResponse.status !== 206) {
      console.error(`❌ Audio Proxy: Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch audio file' },
        { status: 502 }
      );
    }

    // Get content type and length
    const contentType = audioResponse.headers['content-type'] || 'audio/mpeg';
    const contentLength = audioResponse.headers['content-length'];
    const acceptRanges = audioResponse.headers['accept-ranges'];
    
    // Prepare response headers
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300, s-maxage=300', // 5 minutes cache
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
    };

    // Add content length if available
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    // Add accept-ranges header for seeking support
    if (acceptRanges) {
      responseHeaders['Accept-Ranges'] = acceptRanges;
    } else {
      responseHeaders['Accept-Ranges'] = 'bytes';
    }

    // Handle partial content response
    if (audioResponse.status === 206) {
      const contentRange = audioResponse.headers['content-range'];
      if (contentRange) {
        responseHeaders['Content-Range'] = contentRange;
      }
      
      console.log(`🎵 Audio Proxy: Serving partial content for ${slug}`);
      
      return new NextResponse(audioResponse.data, {
        status: 206,
        headers: responseHeaders,
      });
    }

    console.log(`✅ Audio Proxy: Successfully serving full audio for ${slug}`);
    
    // Return the full audio file
    return new NextResponse(audioResponse.data, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`❌ Audio Proxy: Error serving audio for ${slug}:`, error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/audio/[slug]
 * Support HEAD requests for audio metadata
 */
export async function HEAD(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  
  // Validate slug
  if (!slug || typeof slug !== 'string' || slug.includes('..') || slug.includes('/')) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    // Get content item to retrieve the original audio URL
    const content = await notionService.getContentBySlug(slug);
    
    if (!content || !content.podcasturl) {
      return new NextResponse(null, { status: 404 });
    }

    // Make HEAD request to the original URL
    const audioResponse = await fetch(content.podcasturl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'ButtonUp-AudioProxy/1.0',
      },
    });

    if (!audioResponse.ok) {
      return new NextResponse(null, { status: 502 });
    }

    // Get metadata headers
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    const contentLength = audioResponse.headers.get('content-length');
    const acceptRanges = audioResponse.headers.get('accept-ranges');
    
    // Prepare response headers
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Accept-Ranges': acceptRanges || 'bytes',
    };

    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    return new NextResponse(null, {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error(`❌ Audio Proxy HEAD: Error for ${slug}:`, error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * OPTIONS /api/audio/[slug]
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
