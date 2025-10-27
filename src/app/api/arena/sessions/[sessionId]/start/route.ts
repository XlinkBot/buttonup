import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';

export async function POST(
  request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const sessionId = (await params).sessionId;
    
    // 获取session
    const session = await redisBacktestCache.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session不存在' },
        { status: 404 }
      );
    }
    
    
    console.log(`🎮 开始执行比赛回测: ${sessionId}`);
    
    // 设置session状态为running（表示正在运行中）
    session.status = 'running';
    session.updatedAt = Date.now();
    await redisBacktestCache.saveSession(session);
    
    // 返回成功，让前端开始轮询tick
    return NextResponse.json({
      success: true,
      message: '比赛已启动，前端将开始轮询',
      data: {
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
      },
    });
  } catch (error) {
    console.error('开始比赛失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '开始比赛失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
