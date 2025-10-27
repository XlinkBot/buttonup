import type { BacktestSession, Player, PlayerConfig, PlayerState, Position, Trade, TradingJudgment } from '@/types/arena';


/**
 * 构建玩家的交易记录（从所有快照中提取）
 * @param session Session 数据
 * @param playerId 玩家ID
 * @param targetSnapshotIndex 目标快照索引（可选，默认使用最新快照）
 */
export function buildPlayerTrades(session: BacktestSession, playerId: string, targetSnapshotIndex?: number): Trade[] {
  if (!session.snapshots || session.snapshots.length === 0) {
    return [];
  }

  const lastIndex = targetSnapshotIndex ?? session.snapshots.length - 1;
  const relevantSnapshots = session.snapshots.slice(0, lastIndex + 1);

  const allTrades: Trade[] = [];

  relevantSnapshots.forEach((snapshot) => {
    // 从快照级别的trades中筛选出属于该玩家的交易
    const playerTrades = snapshot.trades.filter(trade => trade.playerId === playerId);
    allTrades.push(...playerTrades);
  });

  // 按时间戳排序
  allTrades.sort((a, b) => a.timestamp - b.timestamp);

  return allTrades;
}

/**
 * 构建玩家的交易判断记录（从所有快照中提取）
 * @param session Session 数据
 * @param playerId 玩家ID
 * @param targetSnapshotIndex 目标快照索引（可选，默认使用最新快照）
 */
export function buildPlayerJudgments(session: BacktestSession, playerId: string, targetSnapshotIndex?: number): TradingJudgment[] {
  if (!session.snapshots || session.snapshots.length === 0) {
    return [];
  }

  const lastIndex = targetSnapshotIndex ?? session.snapshots.length - 1;
  const relevantSnapshots = session.snapshots.slice(0, lastIndex + 1);

  const allJudgments: TradingJudgment[] = [];

  relevantSnapshots.forEach((snapshot) => {
    // 从快照级别的judgments中筛选出属于该玩家的判断
    const playerJudgments = snapshot.judgments.filter(judgment => judgment.playerId === playerId);
    allJudgments.push(...playerJudgments);
  });

  // 按时间戳排序
  allJudgments.sort((a, b) => a.timestamp - b.timestamp);

  return allJudgments;
}




