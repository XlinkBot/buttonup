import { NextResponse, NextRequest } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';

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

// GET: 获取排行榜
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 使用性能跟踪系统获取排行榜
    const topPlayers = await redisBacktestCache.getTopPlayers(50);

    // 获取各个赛程的时间范围
    const periods = getLeaderboardPeriods();

    // 获取最近的会话用于当前比赛信息
    const recentSessions = await redisBacktestCache.listSessions({ tags: ['match', 'online'] });
    recentSessions.sort((a, b) => b.createdAt - a.createdAt);

    // 为每个赛程构建排行榜（简化处理，直接使用全局排行榜）
    const periodLeaderboards = periods.map(period => {
      // 筛选该时间段内的会话
      const sessionsInPeriod = recentSessions.filter(session => {
        return session.createdAt >= period.start && session.createdAt <= period.end;
      });

      return {
        name: period.name,
        start: period.start,
        end: period.end,
        leaderboard: topPlayers.slice(0, 20), // 每个赛程显示前20名
        totalSessions: sessionsInPeriod.length,
      };
    });

    // 获取最近的活跃会话（当前比赛）
    const latestSession = recentSessions.length > 0 ? recentSessions[0] : null;

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
