'use client';

import { useState, useEffect } from 'react';
import { useSessionArenaData } from '@/hooks/useSessionArenaData';
import ArenaBattleTopBar from './ArenaBattleTopBar';
import ArenaLegend from './ArenaLegend';
import ArenaInfoPanel from './ArenaInfoPanel';
import PerformanceChart from './PerformanceChart';
import StrategyConfigDialog from './StrategyConfigDialog';
import type { StrategyConfig } from '@/types/arena';

interface ArenaBattleProps {
  sessionId: string;
}

interface PlayerStrategyConfig extends StrategyConfig {
  playerName: string;
}

// 竞技场对战模式 - 自动播放动画，展示对战结果
// 这是一个纯 UI 组件，所有业务逻辑都在 useSessionArenaData hook 中处理
export default function ArenaBattle({ sessionId }: ArenaBattleProps) {
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const {
    players,
    bestPlayer,
    worstPlayer,
    selectedPlayer,
    filteredPlayerId,
    timeRange,
    isStarting,
    isReadyToStart,
    sessionStatus,
    selectedTimestamp,
    isLoading,
    error,
    session,
    onPlayerSelect,
    onFilterPlayerSelect,
    onTimeRangeChange,
    onStartTimeSelect,
    onStartBattle,
    backtestTimeRange,
    refreshSession,
  } = useSessionArenaData(sessionId);

  // 检查是否有玩家需要配置策略（检查是否有用户玩家但还没有配置）
  useEffect(() => {
    console.log("In battle useeffect session : ", session);
    if (!session) return;
    const needsStrategyConfig = session.status === 'pending' && 
      session.playerStates?.some(p => 
        p.playerConfig.id.startsWith('user_') && !p.playerConfig.strategyConfig
      );
    console.log("needsStrategyConfig : ", needsStrategyConfig);
    console.log("showStrategyDialog : ", showStrategyDialog);
    // 将弹窗状态与依赖条件保持一致，避免出现 true/false 闪烁
    if (showStrategyDialog !== needsStrategyConfig) {
      setShowStrategyDialog(needsStrategyConfig);
    }
  }, [session, showStrategyDialog]);

  // 加载状态
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载会话数据中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !session) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || '会话不存在'}</p>
        </div>
      </div>
    );
  }

  // 处理策略配置
  const handleConfigureStrategy = async (config: PlayerStrategyConfig) => {
    try {
      const response = await fetch(`/api/arena/sessions/${sessionId}/configure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: config.playerName,
          stockPool: config.stockPool,
          buyThreshold: config.buyThreshold,
          sellThreshold: config.sellThreshold,
          positionSize: config.positionSize,
          maxShares: config.maxShares,
          signalSensitivity: config.signalSensitivity,
          rsiBuyThreshold: config.rsiBuyThreshold,
          rsiSellThreshold: config.rsiSellThreshold,
          isRandomTrade: false,
          reasoning: config.reasoning || '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '配置策略失败');
      }

      const result = await response.json();
      console.log('✅ 策略配置成功:', result);

      // 关闭对话框
      setShowStrategyDialog(false);
      
      // 刷新会话数据
      await refreshSession();
    } catch (error) {
      console.error('❌ 配置策略失败:', error);
      alert(error instanceof Error ? error.message : '配置策略失败，请稍后重试');
      throw error;
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Top Bar */}
      <ArenaBattleTopBar
        session={session}
        bestPlayer={bestPlayer}
        worstPlayer={worstPlayer}
        isStarting={isStarting}
        isReadyToStart={isReadyToStart}
        sessionStatus={sessionStatus}
        onStartBattle={onStartBattle}
      />

      {/* 主内容区域 - 使用 Grid 实现 4:1 固定比例 */}
      <div className="flex-1 grid grid-cols-[4fr_1fr] overflow-hidden">
        {/* 左侧图表区域 - 占据 4/5 宽度 */}
        <div className="flex flex-col overflow-hidden border-r border-gray-200 dark:border-gray-700 min-w-0">
          <PerformanceChart
            session={session}
            timeRange={timeRange}
            onTimeRangeChange={onTimeRangeChange}
            filteredPlayerId={filteredPlayerId}
            onPlayerFilter={onFilterPlayerSelect}
            backtestTimeRange={backtestTimeRange}
            selectedTimestamp={selectedTimestamp}
            onStartTimeSelect={onStartTimeSelect}
          />
          <ArenaLegend
            players={players}
            selectedPlayer={selectedPlayer}
            onPlayerSelect={onPlayerSelect}
            filteredPlayerId={filteredPlayerId}
            onFilterPlayerSelect={onFilterPlayerSelect}
          />
        </div>

        {/* 右侧信息面板 - 占据 1/5 宽度 */}
        <div className="overflow-hidden h-full">
          <ArenaInfoPanel

            filteredPlayerId={filteredPlayerId}
            onFilterPlayerSelect={onFilterPlayerSelect}
            selectedTimestamp={selectedTimestamp}
            session={session}
          />
        </div>
      </div>

      {/* 策略配置对话框 */}
      <StrategyConfigDialog
        open={showStrategyDialog}
        onConfigure={handleConfigureStrategy}
      />
    </div>
  );
}

