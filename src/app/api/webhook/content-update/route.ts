/**
 * 内容更新Webhook
 * 当Notion内容更新时自动触发SEO通知
 * 可以被Notion webhook、GitHub Actions或定时任务调用
 */

import { NextRequest, NextResponse } from 'next/server';
import { notifyContentPublished, notifyBulkContentUpdate, autoNotifyNewContent } from '@/lib/seo-notifications';

interface WebhookPayload {
  type: 'content_published' | 'content_updated' | 'bulk_update' | 'auto_check';
  contentSlug?: string;
  contentType?: 'content' | 'news';
  secret?: string;
}

export async function POST(request: NextRequest) {
  try {
    // 验证webhook密钥（可选）
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.WEBHOOK_SECRET;
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload: WebhookPayload = await request.json();
    console.log('📨 Content update webhook received:', payload);

    let result;

    switch (payload.type) {
      case 'content_published':
        if (!payload.contentSlug) {
          return NextResponse.json({ 
            message: 'contentSlug is required for content_published' 
          }, { status: 400 });
        }
        result = await notifyContentPublished(
          payload.contentSlug, 
          payload.contentType || 'content'
        );
        break;

      case 'content_updated':
        if (!payload.contentSlug) {
          return NextResponse.json({ 
            message: 'contentSlug is required for content_updated' 
          }, { status: 400 });
        }
        result = await notifyContentPublished( // 更新和发布使用相同逻辑
          payload.contentSlug, 
          payload.contentType || 'content'
        );
        break;

      case 'bulk_update':
        result = await notifyBulkContentUpdate(payload.contentType || 'all');
        break;

      case 'auto_check':
        result = await autoNotifyNewContent();
        break;

      default:
        return NextResponse.json({ 
          message: 'Invalid webhook type' 
        }, { status: 400 });
    }

    return NextResponse.json({
      message: 'Webhook processed successfully',
      type: payload.type,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error('❌ Webhook processing failed:', error);
    return NextResponse.json(
      { 
        message: 'Webhook processing failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Content Update Webhook',
    usage: {
      method: 'POST',
      contentTypes: ['content_published', 'content_updated', 'bulk_update', 'auto_check'],
      auth: 'Bearer token (if WEBHOOK_SECRET is set)',
      examples: {
        content_published: {
          type: 'content_published',
          contentSlug: 'my-article-slug',
          contentType: 'content'
        },
        bulk_update: {
          type: 'bulk_update',
          contentType: 'all'
        },
        auto_check: {
          type: 'auto_check'
        }
      }
    }
  });
}
