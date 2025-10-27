import { NextResponse } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import { BacktestSession } from '@/types/arena';

export async function POST() {
  try {
    console.log('🗑️  开始清理旧session数据...');
    
    // 获取所有sessions
    const allSessions = await redisBacktestCache.listSessions();
    console.log(`📋 找到 ${allSessions.length} 个sessions`);
    
    if (allSessions.length === 0) {
      return NextResponse.json({
        success: true,
        message: '没有需要清理的sessions',
      });
    }
    
    // 删除所有sessions
    let deletedCount = 0;
    for (const session of allSessions) {
      const deleted = await redisBacktestCache.deleteSession(session.sessionId);
      if (deleted) {
        deletedCount++;
      }
    }
    
    console.log(`✅ 清理了 ${deletedCount} 个sessions`);
    
    return NextResponse.json({
      success: true,
      message: `成功清理 ${deletedCount} 个旧sessions`,
      data: {
        deletedCount,
      },
    });
  } catch (error) {
    console.error('❌ 清理失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '清理失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

