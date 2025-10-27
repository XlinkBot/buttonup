import { NextResponse } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';

// GET: 获取最近创建的session（仅pending或running状态）
export async function GET(): Promise<NextResponse> {
  try {
    // 获取所有sessions，按创建时间排序
    const sessions = await redisBacktestCache.listSessions();
    
    if (sessions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '没有找到任何session',
        },
        { status: 404 }
      );
    }
    
    // 优先返回 pending 或 running 状态的session
    const activeSession = sessions.find(s => s.status === 'pending' || s.status === 'running');
    
    // 如果没有活跃的session，返回最新的session
    const latestSession = activeSession || sessions[0]; // listSessions 已经按时间降序排序
    
    return NextResponse.json({
      success: true,
      data: {
        sessionId: latestSession.sessionId,
        session: latestSession,
      },
    });
  } catch (error) {
    console.error('获取最近session失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

