import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession, PlayerConfig, PlayerState, BacktestSnapshot, MatchRoom } from '@/types/arena';

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
    
    const room = await redisBacktestCache.getMatchRoom(roomId);
    
    if (!room) {
      return NextResponse.json(
        { success: false, error: '房间不存在' },
        { status: 404 }
      );
    }
    
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
    const { userId } = body;
    
    if (!userId ) {
      return NextResponse.json(
        { success: false, error: '缺少用户信息' },
        { status: 400 }
      );
    }
    
    let room: MatchRoom;
    
    {
      // 创建新房间
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      room = {
        roomId,
        users: [{
          id: userId,
          name: "玩家",
          avatar: undefined,
          strategyConfig: undefined,
        }],
        status: 'waiting',
        createdAt: Date.now(),
      };
      
      await redisBacktestCache.saveMatchRoom(room);
    }
    

    setTimeout(async () => {
      await autoAddSystemPlayers(room.roomId);
    }, 1000); // 1秒后开始自动补齐
    
    
    return NextResponse.json({
      success: true,
      data: { room },
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
    const room = await redisBacktestCache.getMatchRoom(roomId);
    
    if (!room) return;
    
    // 如果已经在匹配或已开始，跳过
    if (room.status !== 'waiting') return;

    const currentCount = room.users.length;
    const needPlayers = MAX_PLAYERS - currentCount;

    if (needPlayers <= 0) {
      // 如果已经够人了，开始匹配
      await startMatch(roomId);
      return;
    }
    
    // 从系统玩家池获取一个可用的系统玩家
    const usedPlayerIds = room.users.map(u => u.id).filter(id => id.startsWith('system_'));
    const availableSystemPlayers = await redisBacktestCache.getRandomAvailableSystemPlayers(usedPlayerIds, 5);
    
    if (availableSystemPlayers.length === 0) {
      console.error('❌ 没有可用的系统玩家');
      return;
    }
    
    // 随机选择一个玩家（确保名字不重复）
    const usedNames = new Set(room.users.map(u => u.name));
    let selectedPlayer = availableSystemPlayers[0];
    let attempts = 0;
    
    for (const player of availableSystemPlayers) {
      if (!usedNames.has(player.name)) {
        selectedPlayer = player;
        break;
      }
      attempts++;
      if (attempts > 50) break; // 防止无限循环
    }
    
    // 添加系统玩家
    const systemUserId = selectedPlayer.id;
    room.users.push({
      id: systemUserId,
      name: selectedPlayer.name,
      avatar: selectedPlayer.avatar,
      strategyConfig: selectedPlayer.strategyConfig,
    });
    
    // 更新房间
    await redisBacktestCache.saveMatchRoom(room);
    
    console.log(`🤖 系统玩家加入: ${selectedPlayer.name} (${currentCount + 1}/${MAX_PLAYERS})`);
    
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
    const room = await redisBacktestCache.getMatchRoom(roomId);
    if (!room) return;
    
    // 如果已经在匹配或已开始，跳过
    if (room.status !== 'waiting') return;
    
    room.status = 'matched';
    
    console.log(`🎮 开始创建session，玩家列表:`, room.users.map(u => u.name).join(', '));
    

    const allSystemPlayers = room.users
    // 构建 playerDataMap（用于创建session时根据userId查找玩家配置）
    const playerDataMap = new Map<string, { config: PlayerConfig; state: PlayerState }>();
    
    // 添加所有系统玩家配置到 playerDataMap
    allSystemPlayers.forEach(player => {
      const playerConfigForMap: PlayerConfig = {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        strategyConfig: player.strategyConfig,
      };
      
      playerDataMap.set(player.id, {
        config: playerConfigForMap,
        state: {
          playerId: player.id,
          playerConfig: player,
          cash: 1000000,
          portfolio: [],
          totalAssets: 1000000,
          totalReturn: 0,
          totalReturnPercent: 0,
          isActive: true,
          lastUpdateTime: Date.now(),
        },
      });
    });
    
    // 创建回测会话，使用房间中已有的所有玩家（真实用户 + 系统玩家）
    const sessionId = await createMatchSession(room.users, playerDataMap);
    room.status = 'matched';
    room.sessionId = sessionId; // 保存 sessionId 到 room 中
    
    // 更新房间状态（延长到1分钟，确保前端能获取到 sessionId）
    await redisBacktestCache.updateMatchRoom(room, 60);
    
    console.log(`✅ 匹配成功: ${roomId} -> ${sessionId}`);
    
    // 30秒后删除房间（给前端足够时间完成跳转）
    setTimeout(async () => {
      await redisBacktestCache.deleteMatchRoom(roomId);
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
  users: MatchRoom['users'],
  playerDataMap: Map<string, { config: PlayerConfig; state: PlayerState }>
): Promise<string> {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  console.log("luffy debug playermap", playerDataMap)
  // 计算当月1号（当前时区）的开始时间（09:30）
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 9, 30, 0);
  const startTime = startOfMonth.getTime();
  const endTime = Date.now(); // 当前时间
  
  // 创建玩家配置和初始状态
  const initialStates: PlayerState[] = [];
  
  users.forEach((userInfo) => {
    const existingData = playerDataMap.get(userInfo.id);
    if (existingData) {

    initialStates.push({
      playerId: existingData?.config?.id,
      playerConfig: existingData?.config,
      cash: 1000000,
      portfolio: [],
      totalAssets: 1000000,
      totalReturn: 0,
      totalReturnPercent: 0,
      isActive: true,
      lastUpdateTime: Date.now(),
    });
    }else {
      return NextResponse.json({
        success: false,
        error: '玩家数据不存在',
      }, { status: 404 });
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
    playerStates: initialStates,
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
    
    const room = await redisBacktestCache.getMatchRoom(roomId);
    
    if (room) {
      room.users = room.users.filter(u => u.id !== userId);
      
      if (room.users.length === 0) {
        await redisBacktestCache.deleteMatchRoom(roomId);
      } else {
        await redisBacktestCache.saveMatchRoom(room);
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

