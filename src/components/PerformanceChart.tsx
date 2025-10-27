'use client';

import { useState, memo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine, MouseHandlerDataParam } from 'recharts';
import { Button } from '@/components/ui/button';
import type { Player, BacktestSession } from '@/types/arena';
import { useSessionSnapshots } from '@/hooks/useSessionSnapshots';

interface PerformanceChartProps {
  players: Player[];
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
  players,
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

  // Use session snapshots to get asset history data
  const { getPlayerAssetHistory } = useSessionSnapshots(session);

  // 获取策略颜色
  const getStrategyColor = (strategyType: string) => {
    switch (strategyType) {
      case 'aggressive':
        return '#3b82f6'; // 蓝色
      case 'balanced':
        return '#f97316'; // 橙色
      case 'conservative':
        return '#22c55e'; // 绿色
      default:
        return '#6b7280'; // 灰色
    }
  };

  // 获取策略图标
  const getStrategyIcon = (strategyType: string) => {
    switch (strategyType) {
      case 'aggressive':
        return '🤖';
      case 'balanced':
        return '🧠';
      case 'conservative':
        return '💎';
      default:
        return '📊';
    }
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
        const newFilterId = filteredPlayerId === player.id ? null : player.id;
        onPlayerFilter(newFilterId);
      }
    };
    
    const isFiltered = filteredPlayerId === player.id;
    const isActive = !filteredPlayerId || isFiltered;
    
    return (
      <g transform={`translate(${x + 8}, ${y - 12})`}>
        <rect 
          width={120} 
          height={24} 
          rx={4} 
          fill={getStrategyColor(player.strategyType)} 
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
          {getStrategyIcon(player.strategyType)} ${value.toLocaleString()}
        </text>
      </g>
    );
  };


  // 根据过滤条件选择要显示的玩家
  const displayPlayers = filteredPlayerId
    ? players.filter(p => p.id === filteredPlayerId)
    : players;

  // Get asset history for each player using the new hook
  const playersWithHistory = displayPlayers.map(player => ({
    ...player,
    assetHistory: getPlayerAssetHistory(player.id)
  }));

  // 准备图表数据（基于时间戳，根据时间范围过滤数据）
  const prepareChartData = () => {
    if (players.length === 0) {
      console.log('❌ No players data');
      return [];
    }

    // Use the playersWithHistory from component scope
    console.log('👥 Display players:', playersWithHistory.map(p => ({ id: p.id, name: p.name, historyLength: p.assetHistory.length })));

    // 获取所有玩家的时间戳范围
    const allTimestamps = playersWithHistory.flatMap(p => p.assetHistory.map(h => h.timestamp));
    console.log('⏰ All timestamps count:', allTimestamps.length);
    
    if (allTimestamps.length === 0) {
      console.log('❌ No timestamps found');
      return [];
    }
    
    // 使用数据中的最新时间戳作为"当前时间"，而不是真实的当前时间
    // 这样可以确保 mock 数据的时间范围过滤正常工作
    const latestTimestamp = Math.max(...allTimestamps);
    const now = latestTimestamp;

    // 根据时间范围决定显示多少数据
    let filteredTimestamps: number[];
    switch (timeRange) {
      case '72h': // 显示最近72小时的数据
        filteredTimestamps = allTimestamps.filter(ts => ts >= now - 72 * 60 * 60 * 1000);
        break;
      case 'all': // 显示所有数据
      default:
        filteredTimestamps = allTimestamps;
        break;
    }

    // 去重并排序
    const uniqueTimestamps = [...new Set(filteredTimestamps)].sort((a, b) => a - b);

    // 限制数据点数量以提高性能（特别是显示"all"时）
    const maxDataPoints = timeRange === 'all' ? 1000 : uniqueTimestamps.length;
    const limitedTimestamps = uniqueTimestamps.slice(-maxDataPoints);
    
    // 调试信息
    console.log('📊 Chart Data Debug:', {
      filteredPlayerId,
      displayPlayersCount: displayPlayers.length,
      allTimestampsCount: allTimestamps.length,
      uniqueTimestampsCount: uniqueTimestamps.length,
      limitedTimestampsCount: limitedTimestamps.length,
      timeRange,
      maxDataPoints
    });

    // 检查数据完整性
    const dataIntegrityCheck = playersWithHistory.map((player) => {
      const playerDataPoints = limitedTimestamps.map(ts => {
        const historyPoint = player.assetHistory.find(h => h.timestamp === ts);
        return historyPoint ? 1 : 0;
      });
      const validPoints = playerDataPoints.reduce((sum: number, val: number) => sum + val, 0);
      return {
        playerId: player.id,
        playerName: player.name,
        totalPoints: limitedTimestamps.length,
        validPoints,
        missingPoints: limitedTimestamps.length - validPoints
      };
    });
    
    console.log('🔍 Data Integrity Check:', dataIntegrityCheck);

    // 生成图表数据点
    const chartData: Record<string, unknown>[] = [];
    limitedTimestamps.forEach(timestamp => {
      const dataPoint: Record<string, unknown> = { timestamp };

      playersWithHistory.forEach((player) => {
        const historyPoint = player.assetHistory.find(h => h.timestamp === timestamp);
        if (historyPoint) {
          dataPoint[`${player.id}_value`] = historyPoint.totalAssets;
          dataPoint[`${player.id}_name`] = player.name;
        } else {
          // 如果找不到精确匹配的时间戳，使用最近的数据点
          const sortedHistory = player.assetHistory.sort((a, b) => Math.abs(a.timestamp - timestamp) - Math.abs(b.timestamp - timestamp));
          if (sortedHistory.length > 0) {
            dataPoint[`${player.id}_value`] = sortedHistory[0].totalAssets;
            dataPoint[`${player.id}_name`] = player.name;
          }
        }
      });

      dataPoint['benchmark'] = 10000;
      chartData.push(dataPoint);
    });

    // 使用历史数据的最新时间戳而不是当前时间，确保连续性
    const latestHistoryTimestamp = Math.max(...playersWithHistory.flatMap(p => p.assetHistory.map(h => h.timestamp)));
    const currentDataPoint: Record<string, unknown> = { timestamp: latestHistoryTimestamp };

    playersWithHistory.forEach((player) => {
      currentDataPoint[`${player.id}_value`] = player.totalAssets; // 使用动态的 totalAssets
      currentDataPoint[`${player.id}_name`] = player.name;
    });
    
    currentDataPoint['benchmark'] = 10000;
    chartData.push(currentDataPoint);

    return chartData;
  };

  const chartData = prepareChartData();

  // 详细的调试日志
  console.log('📊 PerformanceChart Debug:', {
    filteredPlayerId,
    displayPlayersCount: displayPlayers.length,
    chartDataLength: chartData.length,
    timeRange,
    playerAssets: displayPlayers.map(p => `${p.name}: ${p.totalAssets}`),
    playerHistories: playersWithHistory.map(p => ({
      name: p.name,
      totalAssets: p.totalAssets,
      historyLength: p.assetHistory.length,
      lastHistory: p.assetHistory[p.assetHistory.length - 1]
    })),
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
    const player = displayPlayers.find(p => hoveredData.dataKey === `${p.id}_value`);
    if (!player) return null;

    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {formattedDate}
        </p>
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getStrategyColor(player.strategyType) }}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {player.name}:
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
                 {displayPlayers.map((player) => (
                   <Line
                     key={player.id}
                     type="monotone"
                     dataKey={`${player.id}_value`}
                     stroke={getStrategyColor(player.strategyType)}
                     strokeWidth={2}
                     dot={false}
                     isAnimationActive={false}
                     name={player.name}
                     onMouseEnter={() => setHoveredPlayer(`${player.id}_value`)}
                     onMouseLeave={() => setHoveredPlayer(null)}
                     style={{
                       opacity: hoveredPlayer && hoveredPlayer !== `${player.id}_value` ? 0.3 : 1,
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