import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { StrategyConfig } from '@/types/arena';

interface ConfigureStrategyBody {
  playerName: string;
  stockPool: string[];
  buyThreshold: number;
  sellThreshold: number;
  positionSize: number;
  maxShares: number;
  signalSensitivity: number;
  rsiBuyThreshold: number;
  rsiSellThreshold: number;
  reasoning: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
  try {
    const sessionId = (await params).sessionId;
    const body: ConfigureStrategyBody = await request.json();
    
    // 获取session
    const session = await redisBacktestCache.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session不存在' },
        { status: 404 }
      );
    }
    
    // 检查session状态（只有pending状态可以配置）
    if (session.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Session状态为${session.status}，无法配置` },
        { status: 400 }
      );
    }
    
    // 查找需要配置的用户玩家（user_开头的）
    const userPlayer = session.playerStates?.find(p => 
      p.playerConfig.id.startsWith('user_') && !p.playerConfig.strategyConfig
    );
    
    if (!userPlayer) {
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }
    
    // 创建策略配置
    const strategyConfig: StrategyConfig = {
      name: body.playerName,
      description: `${body.playerName}的策略配置`,
      stockPool: body.stockPool,
      buyThreshold: body.buyThreshold,
      sellThreshold: body.sellThreshold,
      positionSize: body.positionSize,
      maxShares: body.maxShares,
      signalSensitivity: body.signalSensitivity,
      rsiBuyThreshold: body.rsiBuyThreshold,
      rsiSellThreshold: body.rsiSellThreshold,
      reasoning: body.reasoning,
    };
    
    // 更新用户的策略配置
    userPlayer.playerConfig = {
      ...userPlayer.playerConfig,
      name: body.playerName,
      strategyConfig: strategyConfig,
    };
    
    // 更新playerStates数组（确保引用更新）
    const playerIndex = session.playerStates.findIndex(p => p.playerId === userPlayer.playerId);
    if (playerIndex !== -1) {
      session.playerStates[playerIndex] = userPlayer;
    }
    
    // 更新session时间
    session.updatedAt = Date.now();
    
    // 保存更新后的session
    await redisBacktestCache.saveSession(session);
    
    console.log(`✅ 用户策略配置成功: ${body.playerName} (${userPlayer.playerId})`);
    console.log(`✅ 配置后的playerConfig:`, JSON.stringify(userPlayer.playerConfig, null, 2));
    
    return NextResponse.json({
      success: true,
      message: '策略配置成功',
      data: {
        sessionId: session.sessionId,
        playerId: userPlayer.playerId,
      },
    });
  } catch (error) {
    console.error('配置策略失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '配置策略失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

