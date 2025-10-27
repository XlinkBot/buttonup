import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession, PlayerConfig, PlayerState } from '@/types/arena';

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
  isRandomTrade: boolean;
  randomBuyProbability?: number;
  randomSellProbability?: number;
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
    
    // 创建用户ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // 创建玩家配置
    const userConfig: PlayerConfig = {
      id: userId,
      name: body.playerName,
      strategyType: body.isRandomTrade ? 'aggressive' : 'balanced',
      strategyConfig: {
        name: body.playerName,
        description: `${body.isRandomTrade ? '激进' : '稳健'}策略 - ${body.reasoning}`,
        strategyType: body.isRandomTrade ? 'aggressive' : 'balanced',
        stockPool: body.stockPool,
        buyThreshold: body.buyThreshold,
        sellThreshold: body.sellThreshold,
        positionSize: body.positionSize,
        maxShares: body.maxShares,
        signalSensitivity: body.signalSensitivity,
        rsiBuyThreshold: body.rsiBuyThreshold,
        rsiSellThreshold: body.rsiSellThreshold,
        isRandomTrade: body.isRandomTrade,
        randomBuyProbability: body.randomBuyProbability,
        randomSellProbability: body.randomSellProbability,
        reasoning: body.reasoning,
      },
    };
    
    // 创建玩家初始状态
    const userState: PlayerState = {
      playerId: userId,
      cash: 1000000,
      portfolio: [],
      trades: [],
      totalAssets: 1000000,
      totalReturn: 0,
      totalReturnPercent: 0,
      isActive: true,
      lastUpdateTime: Date.now(),
    };
    
    // 更新session：添加用户配置和状态
    if (!session.playerConfigs) {
      session.playerConfigs = [];
    }
    session.playerConfigs.push(userConfig);
    
    // 更新snapshots，为所有快照添加用户状态
    session.snapshots.forEach(snapshot => {
      snapshot.players.push({ ...userState }); // 深拷贝状态
    });
    
    // 更新session状态为running
    session.updatedAt = Date.now();
    
    // 保存更新后的session
    await redisBacktestCache.saveSession(session);
    
    console.log(`✅ 用户策略配置成功: ${body.playerName} (${userId})`);
    
    return NextResponse.json({
      success: true,
      message: '策略配置成功',
      data: {
        sessionId: session.sessionId,
        playerId: userId,
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

