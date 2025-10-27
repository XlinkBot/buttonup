import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession, PlayerConfig, PlayerState, BacktestSnapshot } from '@/types/arena';

// POST: 创建新的游戏会话
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { playerName, strategyType } = body;

    if (!playerName || !strategyType) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少玩家名称或策略类型',
        },
        { status: 400 }
      );
    }

    // 创建用户ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 计算时间范围（最近14天）
    const now = new Date();
    const endTime = now.getTime();
    const startTime = endTime - (14 * 24 * 60 * 60 * 1000); // 14天前

    // 创建用户配置
    const userPlayerConfig: PlayerConfig = {
      id: userId,
      name: playerName,
      strategyType,
      avatar: {
        icon: '👤',
        bgColor: '#3b82f6',
        textColor: '#ffffff',
      },
    };

    // 创建系统玩家配置
    const systemPlayerConfigs: PlayerConfig[] = [
      {
        id: 'player_0',
        name: '激进的创业板投资者',
        strategyType: 'aggressive',
        avatar: {
          icon: '🚀',
          bgColor: '#ff6b6b',
          textColor: '#ffffff',
        },
      },
      {
        id: 'player_1',
        name: '稳健的主板投资者',
        strategyType: 'balanced',
        avatar: {
          icon: '📈',
          bgColor: '#4ecdc4',
          textColor: '#ffffff',
        },
      },
      {
        id: 'player_2',
        name: '保守的蓝筹投资者',
        strategyType: 'conservative',
        avatar: {
          icon: '🛡️',
          bgColor: '#45b7d1',
          textColor: '#ffffff',
        },
      },
    ];

    const allPlayerConfigs = [userPlayerConfig, ...systemPlayerConfigs];

    // 创建初始玩家状态
    const initialStates: PlayerState[] = allPlayerConfigs.map(config => ({
      playerId: config.id,
      cash: 100000,
      portfolio: [],
      trades: [],
      totalAssets: 100000,
      totalReturn: 0,
      totalReturnPercent: 0,
      isActive: true,
      lastUpdateTime: Date.now(),
    }));

    // 创建初始快照
    const initialSnapshot: BacktestSnapshot = {
      timestamp: startTime,
      players: initialStates,
      trades: [],
      judgments: [],
      marketData: [],
    };

    // 创建会话
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const session: BacktestSession = {
      sessionId,
      name: `${playerName} 的竞技场`,
      description: `${playerName} (${strategyType}) vs 系统玩家`,
      status: 'pending', // 初始状态：等待开始
      startTime,
      endTime,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['single-player', 'auto-generated'],
      playerConfigs: allPlayerConfigs,
      snapshots: [initialSnapshot],
      metadata: {
        totalTicks: 0,
        totalTrades: 0,
      },
    };

    // 保存会话到 Redis
    await redisBacktestCache.saveSession(session);

    console.log(`✅ 创建新游戏会话: ${sessionId} for ${playerName}`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        session,
        userId,
      },
    });
  } catch (error) {
    console.error('创建游戏会话失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建游戏会话失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}