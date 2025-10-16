/**
 * 定时任务：自动SEO通知
 * 可以被Vercel Cron Jobs或外部cron服务调用
 * 每小时检查新内容并自动发送SEO通知
 */

import { NextRequest, NextResponse } from 'next/server';
import { autoNotifyNewContent, getSEONotificationStatus } from '@/lib/seo-notifications';

export async function GET(request: NextRequest) {
  try {
    // 验证cron密钥（推荐用于生产环境）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('⏰ Auto SEO cron job started');
    
    // 获取服务状态
    const status = getSEONotificationStatus();
    console.log('📊 SEO services status:', status);
    
    // 执行自动检查和通知
    const result = await autoNotifyNewContent();
    
    return NextResponse.json({
      message: 'Auto SEO cron job completed',
      timestamp: new Date().toISOString(),
      status,
      result
    });

  } catch (error) {
    console.error('❌ Auto SEO cron job failed:', error);
    return NextResponse.json(
      { 
        message: 'Auto SEO cron job failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// 也支持POST方法，方便手动触发
export async function POST(request: NextRequest) {
  return GET(request);
}
