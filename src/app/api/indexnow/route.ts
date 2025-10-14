import { NextRequest, NextResponse } from 'next/server';
import { indexNowService } from '@/lib/indexnow';

/**
 * IndexNow API endpoint
 * 支持手动和自动触发IndexNow通知
 */

interface IndexNowRequestBody {
  urls?: string[];
  url?: string;
  type?: 'content' | 'news' | 'all';
}

export async function POST(request: NextRequest) {
  try {
    // 验证请求来源（可选：添加API密钥验证）
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.INDEXNOW_API_SECRET;
    
    if (apiKey && authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: IndexNowRequestBody = await request.json();
    
    if (!indexNowService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'IndexNow not configured',
          message: 'INDEXNOW_API_KEY environment variable is required'
        },
        { status: 500 }
      );
    }

    let urlsToSubmit: string[] = [];

    if (body.urls) {
      // 批量提交指定的URLs
      urlsToSubmit = body.urls;
    } else if (body.url) {
      // 提交单个URL
      urlsToSubmit = [body.url];
    } else if (body.type) {
      // 根据类型自动生成URLs
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://buttonup.cloud';
      
      switch (body.type) {
        case 'content':
          // 触发内容页面重新索引 - 这里可以添加获取最新内容的逻辑
          urlsToSubmit = [
            `${baseUrl}/`,
            `${baseUrl}/archive`
          ];
          break;
        case 'news':
          // 触发新闻页面重新索引
          urlsToSubmit = [
            `${baseUrl}/news`,
            `${baseUrl}/`
          ];
          break;
        case 'all':
          // 触发所有主要页面重新索引
          urlsToSubmit = [
            `${baseUrl}/`,
            `${baseUrl}/news`,
            `${baseUrl}/archive`,
            `${baseUrl}/playground`
          ];
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid type. Must be: content, news, or all' },
            { status: 400 }
          );
      }
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters. Provide urls, url, or type.' },
        { status: 400 }
      );
    }

    if (urlsToSubmit.length === 0) {
      return NextResponse.json(
        { error: 'No URLs to submit' },
        { status: 400 }
      );
    }

    // 提交到IndexNow
    const results = await indexNowService.submitUrls(urlsToSubmit);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `IndexNow submission completed`,
      stats: {
        submitted: urlsToSubmit.length,
        engines: results.length,
        successful: successCount,
        failed: failureCount
      },
      urls: urlsToSubmit,
      results: results
    });

  } catch (error) {
    console.error('❌ IndexNow API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // 获取IndexNow配置状态
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  if (action === 'status') {
    return NextResponse.json({
      configured: indexNowService.isConfigured(),
      keyFileUrl: indexNowService.getKeyFileUrl(),
      endpoints: [
        'https://api.indexnow.org/indexnow',
        'https://www.bing.com/indexnow',
        'https://yandex.com/indexnow',
        'https://search.seznam.cz/indexnow',
        'https://searchadvisor.naver.com/indexnow'
      ]
    });
  }

  if (action === 'key') {
    // 返回验证密钥（用于调试）
    if (!indexNowService.isConfigured()) {
      return NextResponse.json(
        { error: 'IndexNow not configured' },
        { status: 500 }
      );
    }

    return new Response(indexNowService.getKeyFileContent(), {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  return NextResponse.json({
    message: 'IndexNow API endpoint',
    usage: {
      POST: 'Submit URLs for indexing',
      'GET?action=status': 'Check configuration status',
      'GET?action=key': 'Get verification key'
    }
  });
}
