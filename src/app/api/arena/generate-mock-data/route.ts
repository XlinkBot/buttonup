import { NextResponse } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession, BacktestSnapshot, PlayerConfig, PlayerState } from '@/types/arena';

// 真实的玩家名字列表
const playerNames = [
  '隔壁老王', '东马鹏股神', '韭菜盒子', '不割韭菜', '稳健如狗',
  '量化菜鸟', '价值投资', '短线狙击手', '躺平大师', '抄底王',
  '山顶接盘', '底部割肉', '波段猎人', '趋势追踪', '技术流',
  '基本面哥', '消息灵通', '内幕帝', '散户楷模', '新手小白'
];

const nameIndex = 0;

// 生成玩家配置（静态）
function generatePlayerConfig(
  id: string,
  name: string,
  strategyType: 'aggressive' | 'balanced' | 'conservative'
): PlayerConfig {
  return {
    id,
    name,
    strategyType,
    customStrategyConfig: {
      stockPool: ['600519', '000001', '600036', '600887', '000858'],
      buyThreshold: 0.05,
      sellThreshold: 0.03,
      positionSize: 0.2,
      maxShares: 5,
      signalSensitivity: 0.5,
      rsiBuyThreshold: 30,
      rsiSellThreshold: 70,
    },
  };
}

// 生成玩家初始状态
function generatePlayerState(
  playerId: string,
  strategyType: 'aggressive' | 'balanced' | 'conservative',
  baseCash: number = 1000000
): PlayerState {
  // 随机收益率，根据策略类型调整
  const returnMultipliers = {
    aggressive: () => (Math.random() - 0.3) * 0.15, // -5% ~ 10%
    balanced: () => (Math.random() - 0.4) * 0.12, // -5% ~ 7%
    conservative: () => (Math.random() - 0.5) * 0.10, // -5% ~ 5%
  };

  const multiplier = returnMultipliers[strategyType]();
  const totalReturn = baseCash * multiplier;
  const totalReturnPercent = multiplier * 100;

  return {
    playerId,
    cash: baseCash + totalReturn,
    portfolio: [
      {
        symbol: '600519',
        stockName: '贵州茅台',
        quantity: Math.floor(Math.random() * 100),
        costPrice: 1500,
        currentPrice: 1520,
        profitLoss: Math.random() * 5000,
        profitLossPercent: 1.5,
      },
      {
        symbol: '000001',
        stockName: '平安银行',
        quantity: Math.floor(Math.random() * 500),
        costPrice: 12,
        currentPrice: 12.5,
        profitLoss: Math.random() * 3000,
        profitLossPercent: 4.2,
      },
    ],
    trades: [],
    totalAssets: baseCash + totalReturn,
    totalReturn,
    totalReturnPercent,
    isActive: true,
    lastUpdateTime: Date.now(),
  };
}

// 生成模拟快照
function generateSnapshot(
  playerStates: PlayerState[],
  timestamp: number
): BacktestSnapshot {
  return {
    timestamp,
    players: playerStates,
    trades: [],
    judgments: [],
    marketData: [],
  };
}

// 生成模拟会话
function generateSession(
  name: string,
  createdAt: number,
  playerCount: number = 8
): BacktestSession {
  const sessionId = `session_${createdAt}_${Math.random().toString(36).substring(7)}`;
  const startTime = createdAt;
  const endTime = createdAt + 14 * 24 * 60 * 60 * 1000; // 14天后

  // 随机选择玩家名字和策略
  const playerConfigs: PlayerConfig[] = [];
  const initialStates: PlayerState[] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < playerCount; i++) {
    // 随机选择名字
    let nameIdx;
    do {
      nameIdx = Math.floor(Math.random() * playerNames.length);
    } while (usedIndices.has(nameIdx));
    usedIndices.add(nameIdx);
    
    const playerName = playerNames[nameIdx];
    
    // 随机选择策略
    const strategies: ('aggressive' | 'balanced' | 'conservative')[] = ['aggressive', 'balanced', 'conservative'];
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    
    // 为每个会话生成唯一的 playerId
    const uniquePlayerId = `player_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`;
    playerConfigs.push(generatePlayerConfig(uniquePlayerId, playerName, strategy));
    initialStates.push(generatePlayerState(uniquePlayerId, strategy));
  }

  // 生成多个快照（模拟14天的交易）
  const snapshots: BacktestSnapshot[] = [];
  const interval = (endTime - startTime) / 20; // 20个快照

  for (let i = 0; i <= 20; i++) {
    const timestamp = startTime + i * interval;
    snapshots.push(generateSnapshot(initialStates, timestamp));
  }

  // 计算最佳和最差玩家
  const finalStates = snapshots[snapshots.length - 1].players;
  const sortedStates = [...finalStates].sort((a, b) => b.totalReturn - a.totalReturn);
  const bestPlayerId = sortedStates[0]?.playerId;
  const worstPlayerId = sortedStates[sortedStates.length - 1]?.playerId;

  return {
    sessionId,
    name,
    description: `${playerCount}个AI玩家的投资竞技场对战`,
    status: 'completed', // 模拟数据是已完成的
    startTime,
    endTime,
    createdAt,
    updatedAt: createdAt,
    tags: ['mock', 'test'],
    playerConfigs,
    snapshots,
    metadata: {
      totalTicks: snapshots.length,
      totalTrades: 0,
      bestPlayerId,
      worstPlayerId,
    },
  };
}

export async function POST() {
  try {
    console.log('🚀 开始生成模拟排行榜数据...\n');

    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const sessions: BacktestSession[] = [];

    // 生成当前月的6个会话（每个会话8个玩家）
    console.log('📅 生成当月会话...');
    for (let i = 0; i < 6; i++) {
      const daysAgo = i * 3; // 3天前的会话
      const createdAt = now - daysAgo * 24 * 60 * 60 * 1000;
      const session = generateSession(`本月竞技场 #${i + 1}`, createdAt);
      sessions.push(session);
      await redisBacktestCache.saveSession(session);
      console.log(`  ✅ ${session.name} (${session.sessionId})`);
    }

    // 生成上个月的8个会话
    console.log('\n📅 生成上月会话...');
    for (let i = 0; i < 8; i++) {
      const createdAt = now - oneMonth - (7 - i) * 3 * 24 * 60 * 60 * 1000;
      const session = generateSession(`上月竞技 #${i + 1}`, createdAt);
      sessions.push(session);
      await redisBacktestCache.saveSession(session);
      console.log(`  ✅ ${session.name} (${session.sessionId})`);
    }

    // 生成上上月的6个会话
    console.log('\n📅 生成上上月会话...');
    for (let i = 0; i < 6; i++) {
      const createdAt = now - 2 * oneMonth - (5 - i) * 4 * 24 * 60 * 60 * 1000;
      const session = generateSession(`往期竞技 #${i + 1}`, createdAt);
      sessions.push(session);
      await redisBacktestCache.saveSession(session);
      console.log(`  ✅ ${session.name} (${session.sessionId})`);
    }

    console.log('\n✨ 模拟数据生成完成！');

    return NextResponse.json({
      success: true,
      message: '模拟数据生成成功',
      data: {
        totalSessions: sessions.length,
        sessions: sessions.map(s => ({
          sessionId: s.sessionId,
          name: s.name,
          createdAt: s.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('❌ 生成失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '生成模拟数据失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

