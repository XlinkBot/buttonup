'use client';

import { useState, memo, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Player, BacktestSession } from '@/types/arena';
import { useSessionSnapshots } from '@/hooks/useSessionSnapshots';

interface ArenaInfoPanelProps {
  players: Player[];
  filteredPlayerId?: string | null;
  onFilterPlayerSelect?: (playerId: string | null) => void;
  selectedTimestamp?: number | null;
  session?: BacktestSession | null;
}

type TabType = 'trades' | 'positions' | 'strategy' | 'selected_time';

const ArenaInfoPanelComponent = memo(function ArenaInfoPanel({
  players,
  filteredPlayerId,
  onFilterPlayerSelect,
  selectedTimestamp,
  session
}: ArenaInfoPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('trades');
  const [showAllPlayersInTimeView, setShowAllPlayersInTimeView] = useState(false);

  // Use session snapshots to get historical data
  const { getPlayerTrades, getPlayerStateAtTime } = useSessionSnapshots(session);

  // 当 filteredPlayerId 或 selectedTimestamp 变化时，重置到第一个 tab
  useEffect(() => {
    if (selectedTimestamp) {
      setActiveTab('selected_time');
    } else if (filteredPlayerId) {
      setActiveTab('positions');
    } else {
      setActiveTab('trades');
    }
  }, [filteredPlayerId, selectedTimestamp]);


  // 获取当前选中的玩家
  const selectedPlayer = filteredPlayerId
    ? players.find(p => p.id === filteredPlayerId)
    : null;

  // Get trades for selected timestamp if available
  const selectedTimeTrades = useMemo(() => {
    if (!selectedTimestamp) return [];

    // Get players to show based on filter setting
    const playersToShow = showAllPlayersInTimeView ? players : (filteredPlayerId ? players.filter(p => p.id === filteredPlayerId) : players);

    // Get trades for relevant players around the selected timestamp
    const allTrades = playersToShow.flatMap(player =>
      getPlayerTrades(player.id)
        .filter(trade => {
          // Include trades within 24 hours of the selected timestamp
          const timeDiff = Math.abs(trade.timestamp - selectedTimestamp);
          return timeDiff <= 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        })
        .map(trade => ({ ...trade, player }))
    ).sort((a, b) => Math.abs(a.timestamp - selectedTimestamp) - Math.abs(b.timestamp - selectedTimestamp));

    return allTrades.slice(0, 20); // Limit to 20 most relevant trades
  }, [selectedTimestamp, players, getPlayerTrades, filteredPlayerId, showAllPlayersInTimeView]);

  // Get player states at selected timestamp
  const selectedTimePlayerStates = useMemo(() => {
    if (!selectedTimestamp) return {};

    const states: Record<string, any> = {};
    const playersToShow = showAllPlayersInTimeView ? players : (filteredPlayerId ? players.filter(p => p.id === filteredPlayerId) : players);

    playersToShow.forEach(player => {
      const state = getPlayerStateAtTime(player.id, selectedTimestamp);
      if (state) {
        states[player.id] = { ...state, player };
      }
    });

    return states;
  }, [selectedTimestamp, players, getPlayerStateAtTime, filteredPlayerId, showAllPlayersInTimeView]);

  // Update showAllPlayersInTimeView when filteredPlayerId changes
  useEffect(() => {
    if (filteredPlayerId) {
      setShowAllPlayersInTimeView(false);
    }
  }, [filteredPlayerId]);

  const tabs = selectedTimestamp
    ? [
        { key: 'selected_time' as const, label: '选定时间' },
        { key: 'trades' as const, label: '交易记录' },
      ]
    : selectedPlayer
      ? [
          { key: 'positions' as const, label: '持仓详情' },
          { key: 'strategy' as const, label: '策略参数' },
          { key: 'trades' as const, label: '交易记录' },
        ]
      : [
          { key: 'trades' as const, label: '交易记录' },
        ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'trades':
        return (
          <div className="space-y-3">
            {/* 交易记录列表 */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1 p-2">
              {(() => {
                // 根据过滤条件获取要显示的玩家
                const displayPlayers = filteredPlayerId 
                  ? players.filter(p => p.id === filteredPlayerId)
                  : players;

                // 获取所有交易记录并排序
                const allTrades = displayPlayers.flatMap(player => 
                  player.trades.map(trade => ({ ...trade, player }))
                ).sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);

                return allTrades.map((trade) => {
                  const isPositive = trade.type === 'buy';
                  
                  // 确保所有字段都有默认值
                  const safeTrade = {
                    ...trade,
                    price: trade.price || 0,
                    quantity: trade.quantity || 0,
                    amount: trade.amount || 0,
                    timestamp: trade.timestamp || Date.now(),
                    stockName: trade.stockName || 'Unknown',
                    player: trade.player || { name: 'Unknown' }
                  };
                  
                  return (
                    <div key={`${safeTrade.player.id}-${safeTrade.id}`} className="p-4 mb-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
                      {/* 交易标题 */}
                      <div className="mb-3">
                        {/* 第一行：时间 */}
                        <div className="flex items-center justify-start mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {new Date(safeTrade.timestamp).toLocaleDateString('zh-CN', { 
                              month: '2-digit', 
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false
                            })}
                          </span>
                        </div>
                        
                        {/* 第二行：玩家 -> 买入/卖出 -> 股票 */}
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {safeTrade.player.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-white max-w-28 truncate">
                            {safeTrade.player.name}
                          </span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            isPositive 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {isPositive ? '买入' : '卖出'}
                          </span>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {safeTrade.stockName}
                          </span>
                        </div>
                      </div>

                      {/* 交易详情 */}
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="flex justify-between items-center py-1.5 px-2 bg-white dark:bg-gray-800 rounded">
                          <span className="text-gray-600 dark:text-gray-400">价格:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{safeTrade.price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 px-2 bg-white dark:bg-gray-800 rounded">
                          <span className="text-gray-600 dark:text-gray-400">数量:</span>
                          <span className={`font-medium ${safeTrade.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {safeTrade.quantity > 0 ? '+' : ''}{safeTrade.quantity}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 px-2 bg-white dark:bg-gray-800 rounded">
                          <span className="text-gray-600 dark:text-gray-400">金额:</span>
                          <span className="font-medium text-gray-900 dark:text-white">{safeTrade.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
              </div>
            </div>
          </div>
        );


      case 'positions':
        if (selectedPlayer) {
          // 显示单个玩家的详细信息
          return (
            <div className="space-y-4">
              {/* 玩家头像和信息 */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: selectedPlayer.avatar?.bgColor || '#6366f1' }}
                >
                  <span style={{ color: selectedPlayer.avatar?.textColor || '#ffffff' }}>
                    {selectedPlayer.avatar?.icon || '🤖'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedPlayer.name}
                  </h3>
                  <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span>
                      {selectedPlayer.strategyType === 'aggressive' ? '激进型' : 
                       selectedPlayer.strategyType === 'balanced' ? '稳健型' : '保守型'}
                    </span>
                    <span>•</span>
                    <span>${selectedPlayer.totalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 盈亏信息 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">总收益</div>
                  <div className={cn(
                    'text-lg font-bold',
                    selectedPlayer.totalReturn >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {selectedPlayer.totalReturn >= 0 ? '+' : ''}${selectedPlayer.totalReturn.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">收益率</div>
                  <div className={cn(
                    'text-lg font-bold',
                    selectedPlayer.totalReturnPercent >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {selectedPlayer.totalReturnPercent >= 0 ? '+' : ''}{selectedPlayer.totalReturnPercent.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">现金</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    ${selectedPlayer.cash.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 持仓列表 */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  当前持仓 ({selectedPlayer.portfolio.length})
                </h4>
                <div className="space-y-2">
                  {selectedPlayer.portfolio.length > 0 ? (
                    selectedPlayer.portfolio.map((position) => {
                      const totalValue = position.quantity * (position.currentPrice || position.costPrice || 0);
                      const costPrice = position.costPrice || 0;
                      return (
                        <div key={position.symbol} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                              {position.stockName || position.symbol}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {position.symbol}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <div className="text-gray-600 dark:text-gray-400 mb-1">数量</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                {position.quantity}股
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400 mb-1">成本价</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                ${costPrice.toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600 dark:text-gray-400 mb-1">市值</div>
                              <div className="font-bold text-gray-900 dark:text-white">
                                ${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                      暂无持仓
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        } else {
          // 显示所有玩家的持仓
          return (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                当前持仓
              </h3>
              {players.map((player) => (
                <div key={player.id} className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {player.name}
                  </h4>
                  <div className="space-y-1">
                    {player.portfolio.length > 0 ? (
                      player.portfolio.map((position) => (
                        <div key={position.symbol} className="text-xs text-gray-500 dark:text-gray-500">
                          {position.stockName}: {position.quantity}股 
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-400">暂无持仓</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        }

      case 'strategy':
        if (!selectedPlayer) return null;
        
        const config = selectedPlayer.strategyConfig;
        return (
          <div className="space-y-4">
            {/* 策略基本信息 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                策略配置
              </h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">策略名称：</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white ml-2">
                      {config.name}
                    </span>
                  </div>
                  {config.description && (
                    <div>
                      <span className="text-xs text-gray-600 dark:text-gray-400">策略描述：</span>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                        {config.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">策略类型：</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white ml-2">
                      {config.strategyType === 'aggressive' ? '激进型' : 
                       config.strategyType === 'balanced' ? '稳健型' : '保守型'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 交易参数 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                交易参数
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">买入阈值</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {(config.buyThreshold * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">卖出阈值</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {(config.sellThreshold * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">持仓比例</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {(config.positionSize * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">最大持仓数</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {config.maxShares}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">信号敏感度</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {(config.signalSensitivity * 100).toFixed(0)}%
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">随机交易</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {config.isRandomTrade ? '是' : '否'}
                  </div>
                </div>
              </div>
            </div>

            {/* RSI 参数 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                RSI 参数
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">RSI 买入阈值</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {config.rsiBuyThreshold}
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">RSI 卖出阈值</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {config.rsiSellThreshold}
                  </div>
                </div>
              </div>
            </div>

            {/* 股票池 */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                股票池 ({config.stockPool.length} 只股票)
              </h3>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {config.stockPool.map((symbol) => (
                    <span 
                      key={symbol} 
                      className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 策略推理 */}
            {config.reasoning && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  策略推理
                </h3>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {config.reasoning}
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 'selected_time':
        return (
          <div className="space-y-4">
            {/* 选定时间信息 */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  📅 选定时间: {selectedTimestamp ? new Date(selectedTimestamp).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '未选择'}
                </h3>

                {/* Player filter toggle - only show if there's a filtered player */}
                {filteredPlayerId && (
                  <button
                    onClick={() => setShowAllPlayersInTimeView(!showAllPlayersInTimeView)}
                    className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {showAllPlayersInTimeView ? '显示当前玩家' : '显示全部玩家'}
                  </button>
                )}
              </div>

              {/* Current player indicator */}
              {filteredPlayerId && !showAllPlayersInTimeView && (
                <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: selectedPlayer?.avatar?.bgColor || '#6366f1' }}
                  >
                    <span style={{ color: selectedPlayer?.avatar?.textColor || '#ffffff' }}>
                      {selectedPlayer?.avatar?.icon || '🤖'}
                    </span>
                  </div>
                  <span>仅显示 {selectedPlayer?.name} 的数据</span>
                </div>
              )}
            </div>

            {/* 该时间点的玩家状态 */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                👥 {filteredPlayerId && !showAllPlayersInTimeView ? `${selectedPlayer?.name} 的状态` : '玩家状态'}
              </h4>
              <div className="space-y-2">
                {Object.values(selectedTimePlayerStates).length > 0 ? (
                  Object.values(selectedTimePlayerStates).map((state: any) => (
                    <div key={state.player.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                            {state.player.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {state.player.name}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          ${state.totalAssets.toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">现金</div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            ${state.cash.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">股票价值</div>
                          <div className="font-bold text-gray-900 dark:text-white">
                            ${(state.totalAssets - state.cash).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600 dark:text-gray-400">收益率</div>
                          <div className={cn(
                            'font-bold',
                            state.totalReturnPercent >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          )}>
                            {state.totalReturnPercent >= 0 ? '+' : ''}{state.totalReturnPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    该时间点暂无数据
                  </div>
                )}
              </div>
            </div>

            {/* 该时间附近的交易 */}
            {selectedTimeTrades.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                  📊 {filteredPlayerId && !showAllPlayersInTimeView ? `${selectedPlayer?.name} 的` : ''}附近交易 (±24小时)
                </h4>
                <div className="space-y-2">
                  {selectedTimeTrades.map((trade) => {
                    const isPositive = trade.type === 'buy';
                    const timeDiff = Math.abs(trade.timestamp - selectedTimestamp!);
                    const timeFromSelected = trade.timestamp < selectedTimestamp! ? '前' : '后';
                    const hoursDiff = Math.floor(timeDiff / (60 * 60 * 1000));

                    return (
                      <div key={`${trade.player.id}-${trade.id}`} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                              {trade.player.name.charAt(0)}
                            </div>
                            <span className="text-xs font-medium text-gray-900 dark:text-white">
                              {trade.player.name}
                            </span>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              isPositive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {isPositive ? '买入' : '卖出'}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {trade.stockName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {hoursDiff}小时{timeFromSelected}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">价格</div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              ${trade.price.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">数量</div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              {trade.quantity}股
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">金额</div>
                            <div className="font-bold text-gray-900 dark:text-white">
                              ${trade.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* No trades message for filtered player */}
            {selectedTimeTrades.length === 0 && filteredPlayerId && !showAllPlayersInTimeView && (
              <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                {selectedPlayer?.name} 在该时间附近暂无交易记录
                <br />
                <button
                  onClick={() => setShowAllPlayersInTimeView(true)}
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  查看全部玩家的交易
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg p-2 min-w-0 overflow-hidden">
      {/* 选中玩家时显示关闭按钮 */}
      {selectedPlayer && (
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: selectedPlayer.avatar?.bgColor || '#6366f1' }}
            >
              <span style={{ color: selectedPlayer.avatar?.textColor || '#ffffff' }}>
                {selectedPlayer.avatar?.icon || '🤖'}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {selectedPlayer.name}
            </span>
          </div>
          <button
            onClick={() => onFilterPlayerSelect?.(null)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            关闭
          </button>
        </div>
      )}

      {/* Tab导航 */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-3 text-xs font-medium transition-colors',
                'border-b-2 border-transparent',
                activeTab === tab.key
                  ? 'text-gray-900 dark:text-white border-gray-900 dark:border-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab内容 */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderTabContent()}
      </div>
    </div>
  );
});

export default ArenaInfoPanelComponent;
