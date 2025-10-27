import { NextRequest, NextResponse } from 'next/server';
import { redisBacktestCache as backtestDataCache } from '@/lib/redis-backtest-cache';
import type { TradingJudgment } from '@/types/arena';
import Redis from 'ioredis';

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0,
  maxRetriesPerRequest: 3,
});

const CACHE_PREFIX = 'backtest:';

const DEFAULT_LIMIT = 5; // 每次只加载5个judgments

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerId = searchParams.get('playerId');
    const timestamp = searchParams.get('timestamp');
    const limit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT));
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log(`📋 获取交易判断: playerId=${playerId}, timestamp=${timestamp}, limit=${limit}, offset=${offset}`);

    let judgments: TradingJudgment[] = [];
    let total = 0;

    if (timestamp) {
      // 如果有时间戳，获取该时间点的所有判断
      const timestampNum = parseInt(timestamp);
      judgments = await backtestDataCache.getAllTradingJudgments(timestampNum);
      
      // 如果有playerId，进行过滤
      if (playerId && playerId !== 'all') {
        judgments = judgments.filter(j => j.playerId === playerId);
      }
      
      total = judgments.length;
      
      // 分页处理
      judgments = judgments.slice(offset, offset + limit);
    } else if (playerId && playerId !== 'all') {
      // 获取特定玩家的所有判断（需要从Redis中获取）
      // 注意：这种方法需要遍历所有时间戳的判断
      // 为了性能，我们建议使用时间戳参数
      judgments = await backtestDataCache.getPlayerJudgmentsByTimeRange(playerId);
      total = judgments.length;
      judgments = judgments.slice(offset, offset + limit);
    } else if (playerId === 'all') {
      // 获取所有玩家的所有判断
      console.log('📋 获取所有玩家的所有判断...');
      
      // 获取所有judgments相关的keys
      const pattern = `${CACHE_PREFIX}all_judgments:*`;
      const keys = await redis.keys(pattern);
      
      // 并行获取所有key的数据
      const dataPromises = keys.map(async (key) => {
        const data = await redis.get(key);
        if (data) {
          return JSON.parse(data) as TradingJudgment[];
        }
        return [];
      });
      
      const results = await Promise.all(dataPromises);
      judgments = [];
      results.forEach(judgmentList => {
        judgments.push(...judgmentList);
      });
      
      // 按时间戳排序（最新的在前）
      judgments.sort((a, b) => b.timestamp - a.timestamp);
      
      total = judgments.length;
      judgments = judgments.slice(offset, offset + limit);
      
      console.log(`✅ 获取到 ${total} 个判断`);
    } else {
      // 如果没有参数，返回空结果
      return NextResponse.json({
        success: true,
        data: {
          judgments: [],
          pagination: {
            total: 0,
            limit,
            offset,
            hasMore: false,
          },
        },
      });
    }

    const hasMore = offset + limit < total;

    console.log(`✅ 返回 ${judgments.length} 个判断, 总计 ${total} 个, hasMore=${hasMore}`);

    return NextResponse.json({
      success: true,
      data: {
        judgments,
        pagination: {
          total,
          limit,
          offset,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('获取交易判断失败:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch judgments' },
      { status: 500 }
    );
  }
}

