import { NextRequest, NextResponse } from 'next/server';

/**
 * IndexNow验证密钥文件端点
 * 动态提供IndexNow验证密钥文件
 */

interface KeyRouteParams {
  params: Promise<{
    key: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: KeyRouteParams
) {
  const { key } = await params;
  const apiKey = process.env.INDEXNOW_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'IndexNow API key not configured' },
      { status: 500 }
    );
  }

  // 验证请求的密钥是否匹配
  if (key !== apiKey) {
    return NextResponse.json(
      { error: 'Invalid key' },
      { status: 404 }
    );
  }

  // 返回密钥文件内容
  return new Response(apiKey, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 缓存24小时
    },
  });
}
