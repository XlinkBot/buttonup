import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { SessionStatus } from '@/types/arena';

// GET: 获取指定会话详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const sessionId = (await params).sessionId;
    
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少 sessionId 参数',
        },
        { status: 400 }
      );
    }
    
    const session = await redisBacktestCache.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '会话不存在',
        },
        { status: 404 }
      );
    }
    
    // 获取会话统计信息
    const stats = await redisBacktestCache.getSessionStats(sessionId);
    
    return NextResponse.json({
      success: true,
      data: {
        session,
        stats,
      },
    });
  } catch (error) {
    console.error('获取会话详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取会话详情失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// DELETE: 删除会话
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const sessionId = (await params).sessionId;
    
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少 sessionId 参数',
        },
        { status: 400 }
      );
    }
    
    const deleted = await redisBacktestCache.deleteSession(sessionId);
    
    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: '会话不存在或删除失败',
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '会话已删除',
    });
  } catch (error) {
    console.error('删除会话失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '删除会话失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// PATCH: 更新会话状态
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const sessionId = (await params).sessionId;
    const body = await request.json();
    const { status } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少 sessionId 参数',
        },
        { status: 400 }
      );
    }
    
    const session = await redisBacktestCache.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: '会话不存在',
        },
        { status: 404 }
      );
    }
    
    // 更新session状态
    if (status) {
      session.status = status as SessionStatus;
      session.updatedAt = Date.now();
      await redisBacktestCache.saveSession(session);
    }
    
    return NextResponse.json({
      success: true,
      message: '会话状态已更新',
      data: {
        session,
      },
    });
  } catch (error) {
    console.error('更新会话状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '更新会话状态失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

