import { NextResponse } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession } from '@/types/arena';

interface PlayerStats {
  playerId: string;
  playerName: string;
  totalSessions: number;
  sessions: string[];
}

export async function GET() {
  try {
    // 获取所有会话
    const sessions = await redisBacktestCache.listSessions();
    
    // 统计玩家
    const playerMap = new Map<string, PlayerStats>();

    sessions.forEach(session => {
      const finalSnapshot = session.snapshots[session.snapshots.length - 1];
      
      finalSnapshot.players.forEach(player => {
        if (!playerMap.has(player.playerId)) {
          playerMap.set(player.playerId, {
            playerId: player.playerId,
            playerName: player.playerId, // Use playerId as fallback for name
            sessions: [],
            totalSessions: 0,
          });
        }

        const stats = playerMap.get(player.playerId)!;
        stats.sessions.push(session.sessionId);
        stats.totalSessions = stats.sessions.length;
      });
    });

    // 按时间段分组
    const now = Date.now();
    
    const currentMonth = sessions.filter(s => 
      s.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() &&
      s.createdAt <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999).getTime()
    );
    
    const lastMonth = sessions.filter(s => 
      s.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime() &&
      s.createdAt <= new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59, 999).getTime()
    );
    
    const lastLastMonth = sessions.filter(s => 
      s.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).getTime() &&
      s.createdAt <= new Date(new Date().getFullYear(), new Date().getMonth() - 1, 0, 23, 59, 59, 999).getTime()
    );

    // 统计时间段玩家数
    const currentMonthPlayers = new Set<string>();
    const lastMonthPlayers = new Set<string>();
    const lastLastMonthPlayers = new Set<string>();

    currentMonth.forEach(s => {
      const finalSnapshot = s.snapshots[s.snapshots.length - 1];
      finalSnapshot.players.forEach(p => currentMonthPlayers.add(p.playerId));
    });

    lastMonth.forEach(s => {
      const finalSnapshot = s.snapshots[s.snapshots.length - 1];
      finalSnapshot.players.forEach(p => lastMonthPlayers.add(p.playerId));
    });

    lastLastMonth.forEach(s => {
      const finalSnapshot = s.snapshots[s.snapshots.length - 1];
      finalSnapshot.players.forEach(p => lastLastMonthPlayers.add(p.playerId));
    });

    // 按参与次数排序
    const sortedPlayers = Array.from(playerMap.values())
      .sort((a, b) => b.totalSessions - a.totalSessions);

    // 最近的会话
    const recentSessions = sessions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)
      .map(s => ({
        sessionId: s.sessionId,
        name: s.name,
        createdAt: s.createdAt,
        playerCount: s.snapshots[0].players.length,
        snapshotCount: s.snapshots.length,
      }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalSessions: sessions.length,
          totalPlayers: sortedPlayers.length,
          currentMonthSessions: currentMonth.length,
          lastMonthSessions: lastMonth.length,
          lastLastMonthSessions: lastLastMonth.length,
          currentMonthPlayers: currentMonthPlayers.size,
          lastMonthPlayers: lastMonthPlayers.size,
          lastLastMonthPlayers: lastLastMonthPlayers.size,
        },
        topPlayers: sortedPlayers.slice(0, 20),
        recentSessions,
      },
    });
  } catch (error) {
    console.error('查询统计失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '查询失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

