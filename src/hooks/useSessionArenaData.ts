'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { BacktestSession, BacktestSnapshot, PlayerState } from '@/types/arena';

type TimeRange = 'all' | '72h';

type UseSessionArenaDataReturn = {
  players: PlayerState[];
  snapshots: BacktestSnapshot[];
  bestPlayer: PlayerState | null;
  worstPlayer: PlayerState | null;
  isRunning: boolean;
  selectedPlayer: string | null;
  filteredPlayerId: string | null;
  timeRange: TimeRange;
  isStarting: boolean;
  isReadyToStart: boolean;
  sessionStatus: string;
  selectedTimestamp: number | null;
  isLoading: boolean;
  error: string | null;
  session: BacktestSession | null;
  refreshSession: () => Promise<void>;
  onPlayerSelect: (playerId: string | null) => void;
  onFilterPlayerSelect: (playerId: string | null) => void;
  onTimeRangeChange: (newTimeRange: TimeRange) => void;
  onStartTimeSelect: (timestamp: number | null) => void;
  onStartBattle: () => void;
  backtestTimeRange: { start: number; end: number };
};

export function useSessionArenaData(sessionId: string | null): UseSessionArenaDataReturn {
  // State
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [filteredPlayerId, setFilteredPlayerId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [isStarting, setIsStarting] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);
  const [currentSession, setCurrentSession] = useState<BacktestSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  // 获取会话数据
  useEffect(() => {
    if (!sessionId) {
      setCurrentSession(null);
      setIsLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/arena/sessions/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('获取会话数据失败');
        }
        
        const result = await response.json();
        setCurrentSession(result.data.session);
      } catch (err) {
        console.error('获取会话数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // 获取会话状态
  const sessionStatus = currentSession?.status ?? '';

  // 直接从 session 的 playerConfigs 获取玩家配置
  const players = useMemo(() => {
    if (!currentSession) return [];
    
    return currentSession.playerStates || [];
  }, [currentSession]);

  // 计算最佳和最差玩家（从快照数据）
  const { bestPlayer, worstPlayer } = useMemo(() => {
    if (!currentSession || !currentSession.snapshots || currentSession.snapshots.length === 0) {
      return { bestPlayer: null, worstPlayer: null };
    }

    const latestSnapshot = currentSession.snapshots[currentSession.snapshots.length - 1];
    if (!latestSnapshot || !latestSnapshot.players || latestSnapshot.players.length === 0) {
      return { bestPlayer: null, worstPlayer: null };
    }

    // 按收益率排序
    const sortedStates = [...latestSnapshot.players].sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
    const bestState = sortedStates[0];
    const worstState = sortedStates[sortedStates.length - 1];

    return {
      bestPlayer: bestState || null,
      worstPlayer: worstState || null,
    };
  }, [currentSession]);

  const isRunning = sessionStatus === 'running';

  // Handlers
  const handlePlayerSelect = useCallback((playerId: string | null) => {
    setSelectedPlayer(playerId);
  }, []);

  const handleFilterPlayerSelect = useCallback((playerId: string | null) => {
    setFilteredPlayerId(playerId);
  }, []);

  const handleTimeRangeChange = useCallback((newTimeRange: TimeRange) => {
    setTimeRange(newTimeRange);
  }, []);

  const handleStartTimeSelect = useCallback((timestamp: number | null) => {
    setSelectedTimestamp(timestamp);
  }, []);

  // 手动开始比赛
  const handleStartBattle = useCallback(async () => {
    if (!currentSession || isStarting) return;
    try {
      console.log('🚀 手动开始比赛...');
      setIsStarting(true);  

      // 启动比赛
      const response = await fetch(`/api/arena/sessions/${currentSession.sessionId}/start`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '开始比赛失败');
      }

      const result = await response.json();
      console.log('✅ 比赛启动成功:', result);

      // 开始执行tick
      const { startTime, endTime } = result.data;
      const totalTicks = Math.ceil((endTime - startTime) / (24 * 60 * 60 * 1000)); // 每天一个tick

      console.log(`📊 预计执行 ${totalTicks} 个tick...`);

      for (let i = 0; i < totalTicks; i++) {
        const tickTimestamp = startTime + (i * 24 * 60 * 60 * 1000);

        // 调用tick接口
        const tickResponse = await fetch('/api/arena/tick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            granularity: 'day',
            timestamp: tickTimestamp,
            startTime,
            endTime,
            sessionId: currentSession?.sessionId, // 传递sessionId以使用会话模式
          }),
        });

        if (!tickResponse.ok) {
          console.error(`❌ Tick ${i + 1} 失败`);
        } else {
          console.log(`✅ Tick ${i + 1}/${totalTicks} 完成`);
        }

        // 每隔一段时间更新一次session数据并保存进度
        if (i % 5 === 0 || i === totalTicks - 1) {
          // 更新session状态为running（通过API调用）
          try {
            await fetch(`/api/arena/sessions/${currentSession.sessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                status: 'running',
              }),
            });
          } catch (err) {
            console.error('更新session状态失败:', err);
          }
        }

        // 稍微延迟一下，让UI有机会更新
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log('✅ 所有tick完成');

      // 将session状态更新为completed
      try {
        await fetch(`/api/arena/sessions/${currentSession.sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'completed',
          }),
        });
      } catch (err) {
        console.error('更新session状态为completed失败:', err);
      }

      setIsStarting(false);

      // 完成后刷新一次页面以显示最终结果
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (error) {
      console.error('❌ 开始比赛失败:', error);
      setIsStarting(false);
    }
  }, [currentSession, isStarting]);

  // 回测时间范围
  const backtestTimeRange = useMemo(() => ({
    start: currentSession?.startTime ?? 0,
    end: currentSession?.endTime ?? 0,
  }), [currentSession?.startTime, currentSession?.endTime]);

  
  // 实时轮询会话数据更新
  useEffect(() => {
    const sessionId = currentSession?.sessionId;
    const shouldPoll = (sessionStatus === 'running' || isStarting) && sessionId;

    if (!shouldPoll) return;

    console.log('🔄 开始实时轮询会话数据...');

    const pollSession = async () => {
      try {
        const response = await fetch(`/api/arena/sessions/${sessionId}`);
        if (response.ok) {
          const result = await response.json();
          const updatedSession = result.data.session;

          if (updatedSession && updatedSession.snapshots) {
            // 更新当前会话状态（这会触发players重新计算）
            console.log(`📊 获取到会话更新，快照数量: ${updatedSession.snapshots.length}`);
            setCurrentSession(updatedSession);

            // 如果会话完成，停止轮询
            if (updatedSession.status === 'completed') {
              console.log('✅ 会话已完成，停止轮询');
            }
          }
        }
      } catch (error) {
        console.error('❌ 轮询会话数据失败:', error);
      }
    };

    // 立即执行一次
    pollSession();

    // 每2秒轮询一次
    const interval = setInterval(pollSession, 2000);

    return () => {
      clearInterval(interval);
      console.log('🛑 停止实时轮询');
    };
  }, [sessionStatus, isStarting, currentSession?.sessionId]);


  //刷新session以获得最新的数据
  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    console.log('刷新会话:', sessionId);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/arena/sessions/${sessionId}`);
      if (response.ok) {
        const result = await response.json();
        setCurrentSession(result.data.session);
      }
    } catch (error) {
      console.error('刷新会话失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // 检查会话是否已准备好开始（用户需要手动点击开始）
  const isReadyToStart = useMemo(() => {
    const sessionId = currentSession?.sessionId;
    const currentStatus = currentSession?.status;

    if (!currentSession || !sessionId) return false;

    // 检查是否有有效的快照数据
    const hasValidSnapshots = (currentSession?.snapshots?.length ?? 0) > 0 &&
      (currentSession?.snapshots[0]?.players?.length ?? 0) > 0;

    // 检查是否已有交易数据
    const hasTradingData = currentSession?.snapshots?.some(snapshot =>
      snapshot?.trades?.length > 0 ||
      snapshot?.players?.some(p => p?.portfolio?.length > 0 || p?.totalReturnPercent !== 0)
    ) ?? false;

    // 如果已有交易数据，不需要开始按钮
    if (hasTradingData) {
      console.log('✅ 比赛已有数据，直接显示结果');
      return false;
    }

    // 只有状态为 pending 且有有效数据时才显示开始按钮
    return currentStatus === 'pending' && hasValidSnapshots;
  }, [currentSession]);
  
  // 获取快照数据
  const snapshots = useMemo(() => {
    return currentSession?.snapshots || [];
  }, [currentSession]);

  return {
    players,
    snapshots,
    bestPlayer,
    worstPlayer,
    isRunning,
    selectedPlayer,
    filteredPlayerId,
    timeRange,
    isStarting,
    isReadyToStart,
    sessionStatus,
    selectedTimestamp,
    isLoading,
    error,
    session: currentSession,
    refreshSession,
    onPlayerSelect: handlePlayerSelect,
    onFilterPlayerSelect: handleFilterPlayerSelect,
    onTimeRangeChange: handleTimeRangeChange,
    onStartTimeSelect: handleStartTimeSelect,
    onStartBattle: handleStartBattle,
    backtestTimeRange,
  };
}

