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

/**
 * 将 BacktestSession 转换为 Player 数组
 * 结合 playerConfigs (静态配置) 和 snapshots (动态状态)
 */
export function convertSessionToPlayers(session: BacktestSession, targetSnapshotIndex?: number): Player[] {
  // 如果没有数据，返回空数组
  if (!session.playerConfigs || session.snapshots.length === 0) {
    console.log(`🔄 convertSessionToPlayers: No data for session ${session?.sessionId}`);
    return [];
  }

  // 获取目标快照（默认使用最新快照）
  const targetIndex = targetSnapshotIndex ?? session.snapshots.length - 1;
  const targetSnapshot = session.snapshots[targetIndex];

  if (!targetSnapshot) {
    console.log(`🔄 convertSessionToPlayers: No target snapshot at index ${targetIndex}`);
    return [];
  }

  console.log(`🔄 convertSessionToPlayers: Converting ${session.playerConfigs.length} players using snapshot ${targetIndex} of ${session.snapshots.length}`);

  // 组合配置和状态
  const players: Player[] = session.playerConfigs.map(config => {
    const state = targetSnapshot.players.find(s => s.playerId === config.id);

    // 如果没有找到对应的状态，创建一个默认状态
    if (!state) {
      return {
        ...config,
        cash: 100000,
        portfolio: [],
        trades: [],
        tradingJudgments: [],
        totalAssets: 100000,
        totalReturn: 0,
        totalReturnPercent: 0,
        isActive: true,
        lastUpdateTime: Date.now(),
      };
    }

    // 构建完整的历史数据
    const allTrades = buildPlayerTrades(session, config.id, targetIndex);
    const allJudgments = buildPlayerJudgments(session, config.id, targetIndex);

    // 安全地处理 portfolio 字段（确保是数组）
    const safePortfolio = Array.isArray(state.portfolio) ? state.portfolio : [];

    // 组合配置和状态
    return {
      ...config,
      cash: state.cash ?? 100000,
      portfolio: safePortfolio,
      trades: allTrades, // 使用从所有快照构建的交易历史
      totalAssets: state.totalAssets ?? 100000,
      totalReturn: state.totalReturn ?? 0,
      totalReturnPercent: state.totalReturnPercent ?? 0,
      isActive: state.isActive ?? true,
      lastUpdateTime: state.lastUpdateTime ?? targetSnapshot.timestamp,
      tradingJudgments: allJudgments, // 使用从所有快照构建的判断历史
    };
  });

  return players;
}

/**
 * 获取当前时间点的玩家状态
 * @param session Session 数据
 * @param targetTime 目标时间戳（可选，默认返回最新状态）
 */
export function getPlayersAtTime(session: BacktestSession, targetTime?: number): Player[] {
  if (!session.playerConfigs || session.snapshots.length === 0) {
    return [];
  }

  // 如果没有指定时间，返回最新快照
  if (!targetTime) {
    return convertSessionToPlayers(session);
  }

  // 找到最接近目标时间的快照索引
  const targetSnapshotIndex = session.snapshots.findIndex((s, index) => {
    const nextSnapshot = session.snapshots[index + 1];
    if (nextSnapshot) {
      return targetTime >= s.timestamp && targetTime < nextSnapshot.timestamp;
    }
    return targetTime >= s.timestamp;
  });

  const finalIndex = targetSnapshotIndex >= 0 ? targetSnapshotIndex : session.snapshots.length - 1;

  // 使用指定快照索引转换玩家
  return convertSessionToPlayers(session, finalIndex);
}

