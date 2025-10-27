'use client';

import { useMemo, useCallback } from 'react';
import type { BacktestSession, Position, Trade, TradingJudgment } from '@/types/arena';

/**
 * Hook to extract snapshot-based data from a BacktestSession
 * Provides direct access to historical data from snapshots
 */

interface AssetHistoryPoint {
  id: string;
  playerId: string;
  timestamp: number;
  totalAssets: number;
  cash: number;
  stockValue: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export function useSessionSnapshots(session: BacktestSession | null) {

  // Get all timestamps from snapshots for charting
  const timestamps = useMemo(() => {
    if (!session?.snapshots) return [];
    return session.snapshots.map(snapshot => snapshot.timestamp);
  }, [session?.snapshots]);

  // Get player asset history from snapshots
  const getPlayerAssetHistory = useCallback((playerId: string): AssetHistoryPoint[] => {
    if (!session?.snapshots) return [];

    return session.snapshots
      .filter(snapshot => {
        const playerState = snapshot.players.find(p => p.playerId === playerId);
        return playerState !== undefined;
      })
      .map(snapshot => {
        const playerState = snapshot.players.find(p => p.playerId === playerId)!;
        return {
          id: `history_${playerId}_${snapshot.timestamp}`,
          playerId,
          timestamp: snapshot.timestamp,
          totalAssets: playerState.totalAssets,
          cash: playerState.cash,
          stockValue: playerState.totalAssets - playerState.cash,
          totalReturn: playerState.totalReturn,
          totalReturnPercent: playerState.totalReturnPercent,
        };
      });
  }, [session?.snapshots]);

  // Get player trades from snapshots
  const getPlayerTrades = useCallback((playerId: string): Trade[] => {
    if (!session?.snapshots) return [];

    const allTrades: Trade[] = [];

    session.snapshots.forEach(snapshot => {
      const playerTrades = snapshot.trades.filter(trade => trade.playerId === playerId);
      allTrades.push(...playerTrades);
    });

    return allTrades.sort((a, b) => a.timestamp - b.timestamp);
  }, [session?.snapshots]);

  // Get player judgments from snapshots
  const getPlayerJudgments = useCallback((playerId: string): TradingJudgment[] => {
    if (!session?.snapshots) return [];

    const allJudgments: TradingJudgment[] = [];

    session.snapshots.forEach(snapshot => {
      const playerJudgments = snapshot.judgments.filter(judgment => judgment.playerId === playerId);
      allJudgments.push(...playerJudgments);
    });

    return allJudgments.sort((a, b) => a.timestamp - b.timestamp);
  }, [session?.snapshots]);

  // Get player state at specific timestamp
  const getPlayerStateAtTime = useCallback((playerId: string, timestamp: number) => {
    if (!session?.snapshots) return null;

    // Find the snapshot at or before the specified timestamp
    const targetSnapshot = session.snapshots
      .filter(snapshot => snapshot.timestamp <= timestamp)
      .reduce((latest, current) =>
        current.timestamp > latest.timestamp ? current : latest
      , session.snapshots[0]);

    if (!targetSnapshot) return null;

    return targetSnapshot.players.find(p => p.playerId === playerId) || null;
  }, [session?.snapshots]);

  // Get latest player state
  const getLatestPlayerState = useCallback((playerId: string) => {
    if (!session?.snapshots || session.snapshots.length === 0) return null;

    const latestSnapshot = session.snapshots[session.snapshots.length - 1];
    return latestSnapshot.players.find(p => p.playerId === playerId) || null;
  }, [session?.snapshots]);

  return {
    timestamps,
    getPlayerAssetHistory,
    getPlayerTrades,
    getPlayerJudgments,
    getPlayerStateAtTime,
    getLatestPlayerState,
  };
}