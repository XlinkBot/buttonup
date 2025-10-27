'use client';

import type { BacktestSession } from '@/types/arena';
import { useSessionArenaData } from '@/hooks/useSessionArenaData';
import ArenaBattleTopBar from './ArenaBattleTopBar';
import ArenaLegend from './ArenaLegend';
import ArenaInfoPanel from './ArenaInfoPanel';
import PerformanceChart from './PerformanceChart';

interface ArenaBattleProps {
  session: BacktestSession;
}

// 竞技场对战模式 - 自动播放动画，展示对战结果
// 这是一个纯 UI 组件，所有业务逻辑都在 useSessionArenaData hook 中处理
export default function ArenaBattle({ session }: ArenaBattleProps) {
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
    onPlayerSelect,
    onFilterPlayerSelect,
    onTimeRangeChange,
    onStartTimeSelect,
    onStartBattle,
    backtestTimeRange,
  } = useSessionArenaData(session);
  console.log("luffy debug] session", session);
  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Top Bar */}
      <ArenaBattleTopBar
        session={session}
        players={players}
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
            players={players}
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
            players={players}
            filteredPlayerId={filteredPlayerId}
            onFilterPlayerSelect={onFilterPlayerSelect}
            selectedTimestamp={selectedTimestamp}
            session={session}
          />
        </div>
      </div>
    </div>
  );
}

