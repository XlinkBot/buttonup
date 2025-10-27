import { NextResponse, NextRequest } from 'next/server';
import Redis from 'ioredis';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession, PlayerConfig, PlayerState, BacktestSnapshot } from '@/types/arena';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0,
});

interface MatchRoom {
  roomId: string;
  users: Array<{
    userId: string;
    userName: string;
    joinTime: number;
    strategyConfig?: UserStrategyConfig;
  }>;
  status: 'waiting' | 'matched';
  createdAt: number;
  sessionId?: string; // Session ID，在匹配完成时设置
}

interface UserStrategyConfig {
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
  reasoning: string;
}

const MATCH_ROOM_KEY = (roomId: string) => `arena:match:${roomId}`;
const MATCH_ROOM_LIST_KEY = 'arena:match:rooms';
const MAX_PLAYERS = 4;

// GET: 获取匹配状态
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    
    if (!roomId) {
      return NextResponse.json(
        { success: false, error: '缺少 roomId' },
        { status: 400 }
      );
    }
    
    const key = MATCH_ROOM_KEY(roomId);
    const data = await redis.get(key);
    
    if (!data) {
      return NextResponse.json(
        { success: false, error: '房间不存在' },
        { status: 404 }
      );
    }
    
    const room = JSON.parse(data) as MatchRoom;
    
    return NextResponse.json({
      success: true,
      data: { room },
    });
  } catch (error) {
    console.error('获取匹配状态失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

// POST: 加入匹配
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, roomId, userStrategyConfig } = body;
    
    if (!userId || !userName) {
      return NextResponse.json(
        { success: false, error: '缺少用户信息' },
        { status: 400 }
      );
    }
    
    let room: MatchRoom;
    let currentRoomId = roomId;
    
    // 如果有 roomId，加入现有房间；否则创建新房间
    if (currentRoomId) {
      const key = MATCH_ROOM_KEY(currentRoomId);
      const data = await redis.get(key);
      
      if (!data) {
        return NextResponse.json(
          { success: false, error: '房间不存在' },
          { status: 404 }
        );
      }
      
      room = JSON.parse(data) as MatchRoom;
      
      // 检查是否已满
      if (room.users.length >= MAX_PLAYERS) {
        return NextResponse.json(
          { success: false, error: '房间已满' },
          { status: 400 }
        );
      }
      
      // 检查用户是否已在房间中
      if (room.users.some(u => u.userId === userId)) {
        return NextResponse.json({
          success: true,
          data: { room, roomId: currentRoomId },
        });
      }

      room.users.push({
        userId,
        userName,
        joinTime: Date.now(),
        strategyConfig: userStrategyConfig,
      });
      
      await redis.setex(key, 300, JSON.stringify(room)); // 5分钟过期
    } else {
      // 创建新房间
      currentRoomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      room = {
        roomId: currentRoomId,
        users: [{
          userId,
          userName,
          joinTime: Date.now(),
          strategyConfig: userStrategyConfig,
        }],
        status: 'waiting',
        createdAt: Date.now(),
      };
      
      const key = MATCH_ROOM_KEY(currentRoomId);
      await redis.setex(key, 300, JSON.stringify(room));
      await redis.sadd(MATCH_ROOM_LIST_KEY, currentRoomId);
    }
    
    // 如果用户有策略配置，直接开始匹配；否则补齐系统玩家
    if (userStrategyConfig && room.users.length === 1 && room.users[0].userId === userId) {
      // 用户已配置策略，直接开始匹配
      setTimeout(async () => {
        await startMatch(currentRoomId);
      }, 1000); // 1秒后开始匹配
    } else if (room.users.length < MAX_PLAYERS) {
      // 补齐系统玩家到满员
      setTimeout(async () => {
        await autoAddSystemPlayers(currentRoomId);
      }, 1000); // 1秒后开始自动补齐
    }
    
    return NextResponse.json({
      success: true,
      data: { room, roomId: currentRoomId },
    });
  } catch (error) {
    console.error('加入匹配失败:', error);
    return NextResponse.json(
      { success: false, error: '加入失败' },
      { status: 500 }
    );
  }
}

// 逐个自动添加系统玩家
async function autoAddSystemPlayers(roomId: string) {
  try {
    const key = MATCH_ROOM_KEY(roomId);
    const data = await redis.get(key);
    
    if (!data) return;
    
    const room = JSON.parse(data) as MatchRoom;
    
    // 如果已经在匹配或已开始，跳过
    if (room.status !== 'waiting') return;

    const currentCount = room.users.length;
    const needPlayers = MAX_PLAYERS - currentCount;

    if (needPlayers <= 0) {
      // 如果已经够人了，开始匹配
      await startMatch(roomId);
      return;
    }
    
    // 从现有的sessions中获取真实的玩家数据
    const sessions = await redisBacktestCache.listSessions();
    
    if (sessions.length === 0) {
      console.error('❌ 没有找到任何session数据');
      return;
    }
    
    // 从所有sessions的最后一个快照中收集所有玩家
    const availablePlayers = new Map<string, {
      id: string;
      name: string;
      strategyType: string;
    }>();
    
    sessions.forEach(session => {
      const lastSnapshot = session.snapshots[session.snapshots.length - 1];
      if (lastSnapshot && session.playerConfigs) {
        // 根据快照中的状态，找到对应的配置
        lastSnapshot.players.forEach(playerState => {
          const config = session.playerConfigs.find(c => c.id === playerState.playerId);
          if (config && config.id.startsWith('player_') && !room.users.some(u => u.userId === config.id)) {
            availablePlayers.set(config.id, {
              id: config.id,
              name: config.name,
              strategyType: config.strategyType,
            });
          }
        });
      }
    });
    
    // 转换为数组并随机选择一个
    const playerArray = Array.from(availablePlayers.values());
    
    if (playerArray.length === 0) {
      console.error('❌ 没有可用的系统玩家');
      return;
    }
    
    // 随机选择一个玩家（确保名字不重复）
    const usedNames = new Set(room.users.map(u => u.userName));
    let selectedPlayer;
    let attempts = 0;
    do {
      selectedPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
      attempts++;
      if (attempts > 50) break; // 防止无限循环
    } while (usedNames.has(selectedPlayer.name));
    
    // 添加系统玩家
    const systemUserId = selectedPlayer.id;
    room.users.push({
      userId: systemUserId,
      userName: selectedPlayer.name,
      joinTime: Date.now(),
    });
    
    // 更新房间
    await redis.setex(key, 300, JSON.stringify(room));
    
    console.log(`🤖 系统玩家加入: ${selectedPlayer.name} (${currentCount + 1}/${MAX_PLAYERS}) [${selectedPlayer.strategyType}]`);
    
    // 如果还没满员，继续添加下一个
    if (currentCount + 1 < MAX_PLAYERS) {
      setTimeout(async () => {
        await autoAddSystemPlayers(roomId);
      }, 2000); // 每2秒添加一个系统玩家
    } else {
      // 满员了，开始匹配
      setTimeout(async () => {
        await startMatch(roomId);
      }, 500);
    }
  } catch (error) {
    console.error('自动添加系统玩家失败:', error);
  }
}

// 自动补齐系统玩家并开始匹配
async function startMatch(roomId: string): Promise<string | undefined> {
  try {
    const key = MATCH_ROOM_KEY(roomId);
    const data = await redis.get(key);
    if (!data) return;
    
    const room = JSON.parse(data) as MatchRoom;
    
    // 如果已经在匹配或已开始，跳过
    if (room.status !== 'waiting') return;
    
    room.status = 'matched';
    
    
    // 从sessions中获取AI玩家数据，并从room中获取真实用户配置
    const sessions = await redisBacktestCache.listSessions();
    const playerDataMap = new Map<string, { config: PlayerConfig; state: PlayerState }>();

    // 添加AI玩家数据
    sessions.forEach(session => {
      if (session.playerConfigs) {
        const lastSnapshot = session.snapshots[session.snapshots.length - 1];
        if (lastSnapshot) {
          // 组合配置和状态
          lastSnapshot.players.forEach(playerState => {
            const config = session.playerConfigs.find(c => c.id === playerState.playerId);
            if (config) {
              playerDataMap.set(config.id, { config, state: playerState });
            }
          });
        }
      }
    });
    
    console.log(`🎮 开始创建session，玩家列表:`, room.users.map(u => u.userName).join(', '));
    
    // 创建回测会话，使用房间中玩家的真实ID
    const sessionId = await createMatchSession(room.users, playerDataMap);
    room.status = 'matched';
    room.sessionId = sessionId; // 保存 sessionId 到 room 中
    
    // 更新房间状态（延长到1分钟，确保前端能获取到 sessionId）
    await redis.setex(key, 60, JSON.stringify(room));
    
    console.log(`✅ 匹配成功: ${roomId} -> ${sessionId}`);
    
    // 30秒后删除房间（给前端足够时间完成跳转）
    setTimeout(async () => {
      await redis.del(key);
      await redis.srem(MATCH_ROOM_LIST_KEY, roomId);
      console.log(`🗑️ 已删除临时房间: ${roomId}`);
    }, 30000);
    
    // 返回 sessionId 给前端
    return sessionId;
  } catch (error) {
    console.error('开始匹配失败:', error);
    return undefined;
  }
}

// 创建匹配会话
async function createMatchSession(
  users: Array<{ userId: string; userName: string; strategyConfig?: UserStrategyConfig }>,
  playerDataMap: Map<string, { config: PlayerConfig; state: PlayerState }>
): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  // 计算当月1号（当前时区）的开始时间（09:30）
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 9, 30, 0);
  const startTime = startOfMonth.getTime();
  const endTime = Date.now(); // 当前时间
  
  // 创建玩家配置和初始状态
  const playerConfigs: PlayerConfig[] = [];
  const initialStates: PlayerState[] = [];
  
  users.forEach((userInfo) => {
    const existingData = playerDataMap.get(userInfo.userId);

    // 判断是否为真实用户（userId以 user_ 开头）
    const isRealUser = userInfo.userId.startsWith('user_');

    if (existingData && !isRealUser) {
      // 系统玩家：使用现有配置，重置状态
      playerConfigs.push(existingData.config);
      initialStates.push({
        playerId: existingData.config.id,
        cash: 1000000,
        portfolio: [], // 重置为空，因为现有玩家的portfolio是基于旧状态的
        trades: [],
        totalAssets: 1000000,
        totalReturn: 0,
        totalReturnPercent: 0,
        isActive: true,
        lastUpdateTime: Date.now(),
      });
    } else if (isRealUser && userInfo.strategyConfig) {
      // 真实用户且有策略配置：创建用户配置和初始状态
      const userConfig: PlayerConfig = {
        id: userInfo.userId,
        name: userInfo.strategyConfig.playerName,
        strategyType: userInfo.strategyConfig.isRandomTrade ? 'aggressive' : 'balanced',
        strategyConfig: {
          name: userInfo.strategyConfig.playerName,
          description: `${userInfo.strategyConfig.isRandomTrade ? '激进' : '稳健'}策略 - ${userInfo.strategyConfig.reasoning}`,
          strategyType: userInfo.strategyConfig.isRandomTrade ? 'aggressive' : 'balanced',
          stockPool: userInfo.strategyConfig.stockPool,
          buyThreshold: userInfo.strategyConfig.buyThreshold,
          sellThreshold: userInfo.strategyConfig.sellThreshold,
          positionSize: userInfo.strategyConfig.positionSize,
          maxShares: userInfo.strategyConfig.maxShares,
          signalSensitivity: userInfo.strategyConfig.signalSensitivity,
          rsiBuyThreshold: userInfo.strategyConfig.rsiBuyThreshold,
          rsiSellThreshold: userInfo.strategyConfig.rsiSellThreshold,
          isRandomTrade: userInfo.strategyConfig.isRandomTrade,
          reasoning: userInfo.strategyConfig.reasoning,
        },
      };

      const userState: PlayerState = {
        playerId: userInfo.userId,
        cash: 1000000,
        portfolio: [],
        trades: [],
        totalAssets: 1000000,
        totalReturn: 0,
        totalReturnPercent: 0,
        isActive: true,
        lastUpdateTime: Date.now(),
      };

      playerConfigs.push(userConfig);
      initialStates.push(userState);
      console.log(`✅ 真实用户配置完成: ${userInfo.strategyConfig.playerName}`);
    } else if (isRealUser && !userInfo.strategyConfig) {
      // 真实用户但没有策略配置：跳过
      console.warn(`⚠️ 真实用户 ${userInfo.userName} 没有策略配置，跳过`);
    } else {
      // 其他情况（不应该发生）
      console.warn(`⚠️ 未知用户类型: ${userInfo.userId}`);
    }
  });
  
  // 创建快照（仅包含初始状态，不预生成后续数据）
  const snapshots: BacktestSnapshot[] = [
    {
      timestamp: startTime, // 仅创建开始时的初始快照
      players: initialStates, // 包含所有玩家的初始状态（系统玩家+真实用户）
      trades: [],
      judgments: [],
      marketData: [],
    }
  ];
  
  // 创建会话
  const session: BacktestSession = {
    sessionId,
    name: `竞技场对战`,
    description: `${users.length} 名玩家参与的对战`,
    status: 'pending', // 初始状态：等待开始
    startTime,
    endTime,
    createdAt: startTime,
    updatedAt: startTime,
    tags: ['match', 'online'],
    playerConfigs,
    snapshots,
    metadata: {
      totalTicks: snapshots.length,
      totalTrades: 0,
    },
  };
  
  // 保存到 Redis
  await redisBacktestCache.saveSession(session);
  
  return sessionId;
}

// DELETE: 离开匹配
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roomId = searchParams.get('roomId');
    const userId = searchParams.get('userId');
    
    if (!roomId || !userId) {
      return NextResponse.json(
        { success: false, error: '缺少参数' },
        { status: 400 }
      );
    }
    
    const key = MATCH_ROOM_KEY(roomId);
    const data = await redis.get(key);
    
    if (data) {
      const room = JSON.parse(data) as MatchRoom;
      room.users = room.users.filter(u => u.userId !== userId);
      
      if (room.users.length === 0) {
        await redis.del(key);
        await redis.srem(MATCH_ROOM_LIST_KEY, roomId);
      } else {
        await redis.setex(key, 300, JSON.stringify(room));
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('离开匹配失败:', error);
    return NextResponse.json(
      { success: false, error: '离开失败' },
      { status: 500 }
    );
  }
}

