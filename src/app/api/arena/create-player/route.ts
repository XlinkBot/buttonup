import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { Player, PlayerAvatar } from '@/types/arena';
import type { StrategyConfig } from '@/lib/arena-strategy';

// POST 方法用于创建新的玩家
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { strategyConfig, playerName, strategyType } = body;

    if (!strategyConfig) {
      return NextResponse.json(
        { success: false, error: '策略配置不能为空' },
        { status: 400 }
      );
    }

    console.log('🎯 创建新玩家:', {
      playerName,
      strategyType,
      stockPool: strategyConfig.stockPool,
    });

    // 获取现有玩家
    const existingPlayers = await redisBacktestCache.getAllPlayers();
    
    // 生成新玩家ID
    const playerId = `player_${existingPlayers.length}`;
    
    // 生成玩家头像（随机选择）
    const avatars: PlayerAvatar[] = [
      { icon: '🎯', bgColor: '#ff6b6b', textColor: '#ffffff' },
      { icon: '🔥', bgColor: '#4ecdc4', textColor: '#ffffff' },
      { icon: '⭐', bgColor: '#45b7d1', textColor: '#ffffff' },
      { icon: '💎', bgColor: '#96ceb4', textColor: '#ffffff' },
      { icon: '🚀', bgColor: '#ffeaa7', textColor: '#2d3436' },
      { icon: '⚡', bgColor: '#fab1a0', textColor: '#ffffff' },
      { icon: '🎲', bgColor: '#a29bfe', textColor: '#ffffff' },
      { icon: '💰', bgColor: '#fd79a8', textColor: '#ffffff' },
    ];
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    // 创建新玩家
    const newPlayer: Player = {
      id: playerId,
      name: playerName || `自定义策略 ${existingPlayers.length + 1}`,
      strategyType: strategyType || 'aggressive', // 默认使用aggressive
      cash: 100000,
      portfolio: [],
      trades: [],
      tradingJudgments: [],
      assetHistory: [],
      totalAssets: 100000,
      totalReturn: 0,
      totalReturnPercent: 0,
      isActive: true,
      lastUpdateTime: Date.now(),
      avatar: randomAvatar,
      // 添加自定义配置到玩家对象（存储策略配置）
      customStrategyConfig: strategyConfig,
    };

    // 添加新玩家到现有玩家列表
    const updatedPlayers = [...existingPlayers, newPlayer];
    
    // 保存到Redis
    await redisBacktestCache.saveAllPlayers(updatedPlayers);

    console.log(`✅ 成功创建新玩家: ${newPlayer.name} (ID: ${playerId})`);

    return NextResponse.json({
      success: true,
      message: '新玩家创建成功',
      data: {
        player: {
          id: newPlayer.id,
          name: newPlayer.name,
          strategyType: newPlayer.strategyType,
          avatar: newPlayer.avatar,
        },
        totalPlayers: updatedPlayers.length,
      },
    });

  } catch (error) {
    console.error('❌ 创建玩家失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '创建玩家失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

