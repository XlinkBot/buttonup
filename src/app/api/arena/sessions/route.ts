import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession } from '@/types/arena';

// GET: 获取会话列表
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tags = searchParams.get('tags');
    
    const filter = tags ? { tags: tags.split(',') } : undefined;
    const sessions = await redisBacktestCache.listSessions(filter);
    
    return NextResponse.json({
      success: true,
      data: {
        sessions,
        count: sessions.length,
      },
    });
  } catch (error) {
    console.error('获取会话列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取会话列表失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

// POST: 创建新会话
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { name, description, startTime, endTime, playerConfigs, snapshots, tags } = body;
    
    if (!name || !startTime || !endTime || !playerConfigs || !snapshots) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少必填字段',
        },
        { status: 400 }
      );
    }
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();
    
    // 计算最佳和最差玩家
    let bestPlayerId: string | undefined;
    let worstPlayerId: string | undefined;
    const finalSnapshots = snapshots[snapshots.length - 1];
    const playerStates = finalSnapshots?.players || [];
    
    if (finalSnapshots && finalSnapshots.players.length > 0) {
      const sortedStates = [...finalSnapshots.players].sort((a, b) => b.totalReturn - a.totalReturn);
      bestPlayerId = sortedStates[0].playerId;
      worstPlayerId = sortedStates[sortedStates.length - 1].playerId;
    }
    
    const session: BacktestSession = {
      sessionId,
      name,
      description: description || '',
      status: 'completed', // 通过POST创建的通常是已完成的回测
      startTime,
      endTime,
      createdAt: now,
      updatedAt: now,
      tags: tags || [],
      playerStates,
      snapshots,
      metadata: {
        totalTicks: snapshots.length,
        totalTrades: snapshots.reduce((sum: number, s: { trades: { length: number }[] }) => sum + (s.trades?.length || 0), 0),
        bestPlayerId,
        worstPlayerId,
      },
    };
    
    await redisBacktestCache.saveSession(session);
    
    console.log(`✅ 会话创建成功: ${sessionId} (${name})`);
    
    return NextResponse.json({
      success: true,
      data: {
        session,
      },
    });
  } catch (error) {
    console.error('创建会话失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建会话失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

