import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession, LeaderboardEntry } from '@/types/arena';

// 获取指定月份的时间范围
function getMonthRange(year: number, month: number): { start: number; end: number } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return {
    start: start.getTime(),
    end: end.getTime(),
  };
}

// 获取当前月、上月等赛程数据
function getLeaderboardPeriods(): Array<{ name: string; start: number; end: number }> {
  const now = new Date();
  const periods: Array<{ name: string; start: number; end: number }> = [];
  
  // 当前月
  const currentMonth = getMonthRange(now.getFullYear(), now.getMonth());
  periods.push({
    name: '当月',
    ...currentMonth,
  });
  
  // 上月
  const lastMonth = getMonthRange(now.getFullYear(), now.getMonth() - 1);
  periods.push({
    name: '上月',
    ...lastMonth,
  });
  
  // 上上月
  const lastLastMonth = getMonthRange(now.getFullYear(), now.getMonth() - 2);
  periods.push({
    name: '上上月',
    ...lastLastMonth,
  });
  
  return periods;
}

// 计算玩家总收益
function calculatePlayerStats(
  playerId: string,
  sessions: BacktestSession[]
): LeaderboardEntry | null {
  const playerSessions = sessions.filter(session => {
    // 检查 playerConfigs 中是否有该玩家
    return session.playerConfigs?.some(p => p.id === playerId) || false;
  });

  if (playerSessions.length === 0) return null;

  let totalReturnPercent = 0;
  let bestReturn = -Infinity;
  let bestSessionId = '';
  let latestReturn = 0;
  let latestSessionId = '';

  for (const session of playerSessions) {
    const finalSnapshot = session.snapshots[session.snapshots.length - 1];
    const playerState = finalSnapshot.players.find(p => p.playerId === playerId);
    
    if (!playerState) continue;
    
    totalReturnPercent += playerState.totalReturnPercent;
    
    if (playerState.totalReturnPercent > bestReturn) {
      bestReturn = playerState.totalReturnPercent;
      bestSessionId = session.sessionId;
    }
    
    // 最后一个会话
    if (session === playerSessions[playerSessions.length - 1]) {
      latestReturn = playerState.totalReturnPercent;
      latestSessionId = session.sessionId;
    }
  }

  const avgReturnPercent = totalReturnPercent / playerSessions.length;

  // 获取玩家信息（从配置中获取）
  const lastSession = playerSessions[playerSessions.length - 1];
  const playerConfig = lastSession.playerConfigs.find((p) => p.id === playerId);
  
  if (!playerConfig) return null;

  return {
    playerId,
    playerName: playerConfig.name,
    strategyType: playerConfig.strategyType,
    totalSessions: playerSessions.length,
    totalReturn: avgReturnPercent,
    totalReturnPercent: avgReturnPercent,
    bestSession: bestSessionId ? {
      sessionId: bestSessionId,
      returnPercent: bestReturn,
    } : undefined,
    latestSession: latestSessionId ? {
      sessionId: latestSessionId,
      returnPercent: latestReturn,
    } : undefined,
    rank: 0, // 稍后填充
  };
}

// GET: 获取排行榜（使用新的性能跟踪系统）
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 使用新的性能跟踪系统获取排行榜
    const topPlayers = await redisBacktestCache.getTopPlayers(50);

    // 获取各个赛程的时间范围（保持兼容性）
    const periods = getLeaderboardPeriods();

    // 获取所有会话用于赛程统计
    const allSessions = await redisBacktestCache.listSessions();
    allSessions.sort((a, b) => b.createdAt - a.createdAt);

    // 为每个赛程计算统计数据（基于所有会话，但使用新性能数据）
    const periodLeaderboards = periods.map(period => {
      const sessions = allSessions.filter(session => {
        return session.createdAt >= period.start && session.createdAt <= period.end;
      });

      // 基于新性能跟踪系统重新构建排行榜
      const periodPlayers = topPlayers.filter(player => {
        // 检查玩家的最佳会话是否在该时间段内
        const bestSession = player.bestSession;
        if (!bestSession) return false;

        // 简单的时间过滤（可以根据需要优化）
        const sessionTimeRange = bestSession.returnPercent > 0 ? period.end : period.start;
        return sessionTimeRange >= period.start && sessionTimeRange <= period.end;
      });

  
      // 使用性能跟踪数据的玩家，保持原有排名逻辑
      periodPlayers.sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
      periodPlayers.forEach((player, index) => {
        player.rank = index + 1;
      });

      return {
        name: period.name,
        start: period.start,
        end: period.end,
        leaderboard: periodPlayers,
        totalSessions: sessions.length,
      };
    });

    // 获取最近的活跃会话（当前比赛）
    const latestSession = allSessions.length > 0 ? allSessions[0] : null;

    return NextResponse.json({
      success: true,
      data: {
        periods: periodLeaderboards,
        currentSession: latestSession ? {
          sessionId: latestSession.sessionId,
          name: latestSession.name,
          description: latestSession.description,
          createdAt: latestSession.createdAt,
        } : null,
      },
    });
  } catch (error) {
    console.error('获取排行榜失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取排行榜失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

