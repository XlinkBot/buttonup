'use client';

import { useState, memo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine, MouseHandlerDataParam } from 'recharts';
import { Button } from '@/components/ui/button';
import type { BacktestSession, BacktestSnapshot, PlayerState } from '@/types/arena';

interface PerformanceChartProps {
  session: BacktestSession | null;
  timeRange: 'all' | '72h';
  onTimeRangeChange: (range: 'all' | '72h') => void;
  filteredPlayerId?: string | null;
  onPlayerFilter?: (playerId: string | null) => void;
  backtestTimeRange?: { start: number; end: number };
  selectedTimestamp?: number | null;
  onStartTimeSelect?: (timestamp: number | null) => void;
}

const PerformanceChartComponent = memo(function PerformanceChart({
  session,
  timeRange,
  onTimeRangeChange,
  filteredPlayerId,
  onPlayerFilter,
  backtestTimeRange,
  selectedTimestamp,
  onStartTimeSelect
}: PerformanceChartProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  // Handle chart click to select time
  const handleChartClick = useCallback((e: { activeLabel: number }) => {
    if (!e || !e.activeLabel || !onStartTimeSelect) return;

    const clickedTimestamp = e.activeLabel;
    console.log('🎯 Chart clicked at timestamp:', clickedTimestamp);

    // Toggle selection: if clicking the same timestamp, deselect; otherwise select
    if (selectedTimestamp === clickedTimestamp) {
      onStartTimeSelect(null);
    } else {
      onStartTimeSelect(clickedTimestamp);
    }
  }, [selectedTimestamp, onStartTimeSelect]);

  // 获取策略颜色 - 优先使用 avatar 的颜色，否则使用默认值
  const getStrategyColor = (player: PlayerState) => {
    return player.playerConfig.avatar?.bgColor || '#6b7280';
  };

  // 获取策略图标 - 优先使用 avatar 的图标，否则使用默认值
  const getStrategyIcon = (player: PlayerState) => {
    return player.playerConfig.avatar?.icon || '📊';
  };

  // 自定义标签组件 - 支持点击过滤
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomLabel = ({ x, y, value, player }: any) => {
    if (!value) return null;
    
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onPlayerFilter) {
        // 如果当前已经过滤了这个玩家，点击后显示所有玩家
        // 否则过滤到当前玩家
        const newFilterId = filteredPlayerId === player.playerConfig.id ? null : player.playerConfig.id;
        onPlayerFilter(newFilterId);
      }
    };
    
    const isFiltered = filteredPlayerId === player.playerConfig.id;
    const isActive = !filteredPlayerId || isFiltered;
    
    return (
      <g transform={`translate(${x + 8}, ${y - 12})`}>
        <rect 
          width={120} 
          height={24} 
          rx={4} 
          fill={getStrategyColor(player)} 
          opacity={isActive ? 0.95 : 0.6}
          stroke="#fff"
          strokeWidth={isFiltered ? 2 : 1}
          style={{ 
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={handleClick}
        />
        <text 
          x={60} 
          y={16} 
          fontSize={11} 
          fill="#fff" 
          fontWeight="600"
          textAnchor="middle"
          style={{ 
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={handleClick}
        >
          {getStrategyIcon(player)} ${value.toLocaleString()}
        </text>
      </g>
    );
  };


  // 根据过滤条件选择要显示的玩家
  const displayPlayers = filteredPlayerId
    ? session?.playerStates?.filter(p => p.playerId === filteredPlayerId)
    : session?.playerStates;

  // 准备图表数据（直接从 snapshots 获取，不使用 assetHistory）
  const prepareChartData = () => {
    if (!displayPlayers || displayPlayers.length === 0 || !session?.snapshots || session.snapshots.length === 0) {
      console.log('❌ No players or snapshots data');
      return [];
    }

    console.log('👥 Display players:', displayPlayers.map(p => ({ playerId: p.playerId, name: p.playerConfig.name })));

    // 直接从 snapshots 获取所有时间戳
    const allTimestamps = session.snapshots.map(s => s.timestamp);
    console.log('⏰ All timestamps count:', allTimestamps.length);
    
    if (allTimestamps.length === 0) {
      console.log('❌ No timestamps found');
      return [];
    }
    
    // 使用数据中的最新时间戳作为"当前时间"
    const latestTimestamp = Math.max(...allTimestamps);
    const now = latestTimestamp;

    // 根据时间范围决定显示多少数据
    let filteredSnapshots: BacktestSnapshot[];
    switch (timeRange) {
      case '72h': // 显示最近72小时的数据
        filteredSnapshots = session.snapshots.filter(snapshot => snapshot.timestamp >= now - 72 * 60 * 60 * 1000);
        break;
      case 'all': // 显示所有数据
      default:
        filteredSnapshots = session.snapshots;
        break;
    }

    // 限制数据点数量以提高性能（特别是显示"all"时）
    const maxDataPoints = timeRange === 'all' ? 1000 : filteredSnapshots.length;
    const limitedSnapshots = filteredSnapshots.slice(-maxDataPoints);
    
    console.log('📊 Chart Data Debug:', {
      filteredPlayerId,
      displayPlayersCount: displayPlayers.length,
      allSnapshotsCount: session.snapshots.length,
      filteredSnapshotsCount: filteredSnapshots.length,
      limitedSnapshotsCount: limitedSnapshots.length,
      timeRange,
      maxDataPoints
    });

    // 生成图表数据点 - 直接从 snapshots 创建
    const chartData: Record<string, unknown>[] = [];
    
    limitedSnapshots.forEach(snapshot => {
      const dataPoint: Record<string, unknown> = { timestamp: snapshot.timestamp };

      displayPlayers.forEach((player) => {
        const playerState = snapshot.players.find(p => p.playerId === player.playerId);
        if (playerState) {
          dataPoint[`${player.playerConfig.id}_value`] = playerState.totalAssets;
          dataPoint[`${player.playerConfig.id}_name`] = player.playerConfig.name;
        }
      });

      dataPoint['benchmark'] = 10000;
      chartData.push(dataPoint);
    });

    return chartData;
  };

  const chartData = prepareChartData();

  // 详细的调试日志
  console.log('📊 PerformanceChart Debug:', {
    filteredPlayerId,
    displayPlayersCount: displayPlayers?.length || 0,
    chartDataLength: chartData.length,
    timeRange,
    playerAssets: displayPlayers?.map(p => `${p.playerConfig.name}: ${p.totalAssets}`),
    chartDataPreview: chartData.slice(0, 3) // 显示前3个数据点
  });

  // 自定义Tooltip - 只显示悬停的线条数据
  const CustomTooltip = ({ active, payload, label }: { 
    active?: boolean; 
    payload?: Array<{ dataKey: string; value: number; color: string }>; 
    label?: number 
  }) => {
    if (!active || !payload || payload.length === 0) return null;

    // 只显示当前悬停的线条数据
    const hoveredData = payload.find(p => hoveredPlayer && p.dataKey === hoveredPlayer);
    if (!hoveredData) return null;

    const date = new Date(label || 0);
    const formattedDate = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // 找到对应的玩家
    const player = displayPlayers?.find(p => hoveredData.dataKey === `${p.playerConfig.id}_value`);
    if (!player) return null;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {formattedDate}
        </p>
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getStrategyColor(player) }}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {player.playerConfig.name}:
          </span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            ${hoveredData.value?.toLocaleString()}
          </span>
        </div>
      </div>
    );
  };


  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 min-w-0">
      {/* 时间范围选择（ALL / 72H）*/}
      <div className="flex-shrink-0 flex items-center justify-end p-3 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: 'all' as const, label: 'ALL' },
          { key: '72h' as const, label: '72H' },
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={timeRange === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimeRangeChange(key)}
            className="text-xs ml-2"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 图表区域 */}
      <div className="flex-1 p-4 min-w-0" style={{ minHeight: '500px' }}>
             <ResponsiveContainer width="100%" height="100%">
               <LineChart
                 data={chartData}
                 margin={{ top: 60, right: 200, left: 20, bottom: 20 }}
                 onMouseLeave={() => setHoveredPlayer(null)}
                 onClick ={(e: MouseHandlerDataParam) => handleChartClick(e as unknown as { activeLabel: number })}
               >
                 {/* 图表标题 */}
                 <text 
                   x="50%" 
                   y={20} 
                   textAnchor="middle" 
                   fontSize={18} 
                   fontWeight="bold" 
                   fill="#374151"
                   className="dark:fill-gray-100"
                 >
                   TOTAL ACCOUNT VALUE
                 </text>
            <CartesianGrid 
              strokeDasharray="2 4" 
              stroke="#d1d5db" 
              strokeOpacity={0.6}
              vertical={true}
              horizontal={true}
              className="dark:stroke-gray-500"
            />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => {
                const d = new Date(value);
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = monthNames[d.getMonth()];
                const day = d.getDate();
                const hours = d.getHours().toString().padStart(2, '0');
                const minutes = d.getMinutes().toString().padStart(2, '0');
                return `${month} ${day} ${hours}:${minutes}`;
              }}
              axisLine={false}
              tickLine={false}
              type="number"
              allowDataOverflow
              domain={
                backtestTimeRange 
                  ? [backtestTimeRange.start, backtestTimeRange.end]
                  : ['dataMin', 'dataMax']
              }
            />
            <YAxis 
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              axisLine={false}
              tickLine={false}
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              animationDuration={0}
              isAnimationActive={false}
            />
            
                 {/* 基准线 */}
                 <Line
                   type="monotone"
                   dataKey="benchmark"
                   stroke="#9ca3af"
                   strokeWidth={1}
                   strokeDasharray="5 5"
                   dot={false}
                   isAnimationActive={false}
                   name="基准 ($10,000)"
                 />

                 {/* 选定时间指示线 */}
                 {selectedTimestamp && (
                   <ReferenceLine
                     x={selectedTimestamp}
                     stroke="#ef4444"
                     strokeWidth={2}
                     strokeDasharray="3 3"
                     label={{
                       value: "选定时间",
                       position: "top" as const,
                       style: { fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }
                     }}
                   />
                 )}

                 {/* 玩家资产线 - 按顺序渲染，确保标签在最上层 */}
                 {displayPlayers?.map((player) => (
                   <Line
                     key={player.playerConfig.id}
                     type="monotone"
                     dataKey={`${player.playerConfig.id}_value`}
                     stroke={getStrategyColor(player)}
                     strokeWidth={2}
                     dot={false}
                     isAnimationActive={false}
                     name={player.playerConfig.name}
                     onMouseEnter={() => setHoveredPlayer(`${player.playerConfig.id}_value`)}
                     onMouseLeave={() => setHoveredPlayer(null)}
                     style={{
                       opacity: hoveredPlayer && hoveredPlayer !== `${player.playerConfig.id}_value` ? 0.3 : 1,
                     }}
                   >
                     <LabelList 
                       content={(props) => {
                         const { x, y, value, index } = props;
                         // 只在最后一个点显示标签
                         if (index === chartData.length - 1) {
                           return <CustomLabel x={x} y={y} value={value} player={player} />;
                         }
                         return null;
                       }}
                     />
                   </Line>
                 ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
});

export default PerformanceChartComponent;