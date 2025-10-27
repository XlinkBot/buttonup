'use client';

import { memo, useMemo, useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import type { Player } from '@/types/arena';
import AddPlayerDialog from './AddPlayerDialog';

interface ArenaTopBarProps {
  players: Player[];
  isDemoMode?: boolean; // 是否为演示模式
  onTick?: (timestamp?: number) => void;
  onReset?: () => void;
  currentTimestamp?: number;
  onTimestampChange?: (timestamp: number) => void;
  onTimeRangeChange?: (startTime: number, endTime: number) => void;
  onPreloadData?: (startTime: number, endTime: number) => Promise<boolean>;
  backtestTimeRange?: { start: number; end: number };
  onAddPlayer?: () => void; // 添加玩家回调
}


const ArenaTopBarComponent = memo(function ArenaTopBar({ 
  players, 
  isDemoMode = false,
  onTick, 
  onReset, 
  currentTimestamp, 
  onTimestampChange,
  onTimeRangeChange,
  onPreloadData,
  backtestTimeRange,
  onAddPlayer
}: ArenaTopBarProps) {
  const [isTicking, setIsTicking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isAutoTicking, setIsAutoTicking] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    // 默认开始时间：14天前
    const date = new Date();
    date.setDate(date.getDate() - 14);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // 默认结束时间：今天
    return new Date().toISOString().split('T')[0];
  });
  const [currentTime, setCurrentTime] = useState(() => {
    // 默认从 startDate 开始
    if (currentTimestamp) return currentTimestamp;
    const start = new Date(startDate);
    // 设置为当天的交易开始时间 9:30
    start.setHours(9, 30, 0, 0);
    return start.getTime();
  });

  // 当 startDate 或 currentTimestamp 变化时，重置 currentTime
  useEffect(() => {
    if (currentTimestamp) {
      setCurrentTime(currentTimestamp);
    } else {
      // 重置为开始时间的9:30
      const start = new Date(startDate);
      start.setHours(9, 30, 0, 0);
      setCurrentTime(start.getTime());
    }
  }, [currentTimestamp, startDate]);

  // 计算最高和最低表现 - 使用 useMemo 优化
  const { best, worst } = useMemo(() => {
    if (players.length === 0) return { best: null, worst: null };
    
    const sortedPlayers = [...players].sort((a, b) => b.totalReturn - a.totalReturn);
    return {
      best: sortedPlayers[0],
      worst: sortedPlayers[sortedPlayers.length - 1],
    };
  }, [players]);

  // 获取最后一个完整的交易日
  const getLastTradingDay = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // 如果是周末（周六或周日），最后一个交易日是周五
    if (dayOfWeek === 0) {
      // 周日，最后一个交易日是周五（3天前）
      const lastFriday = new Date(now);
      lastFriday.setDate(lastFriday.getDate() - 2);
      lastFriday.setHours(15, 0, 0, 0); // 设置为收盘时间
      return lastFriday.getTime();
    } else if (dayOfWeek === 6) {
      // 周六，最后一个交易日是周五（1天前）
      const lastFriday = new Date(now);
      lastFriday.setDate(lastFriday.getDate() - 1);
      lastFriday.setHours(15, 0, 0, 0); // 设置为收盘时间
      return lastFriday.getTime();
    } else {
      // 工作日
      // 如果当前时间在15:00之后，最后一个交易日是今天
      if (hour > 15 || (hour === 15 && minute > 0)) {
        const today = new Date(now);
        today.setHours(15, 0, 0, 0); // 设置为收盘时间
        return today.getTime();
      } else {
        // 如果当前时间在15:00之前，最后一个交易日是昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(15, 0, 0, 0); // 设置为收盘时间
        return yesterday.getTime();
      }
    }
  }, []);

  // 检查回测是否已完成
  const isBacktestCompleted = useMemo(() => {
    // 如果还没有选择时间范围，回测未完成
    if (!startDate || !endDate) return false;
    
    const endTimestamp = new Date(endDate).getTime();
    const lastTradingDay = getLastTradingDay;
    
    // 取最小的结束时间（用户选择的结束时间 或 最后一个交易日）
    const effectiveEndTime = Math.min(endTimestamp, lastTradingDay);
    
    // 如果当前时间超过有效结束时间，则回测已完成
    return currentTime >= effectiveEndTime;
  }, [currentTime, startDate, endDate, getLastTradingDay]);

  // 检查是否为交易时间（中国股市：周一-周五，9:30-11:30，13:00-15:00）
  const isTradingTime = (timestamp: number): boolean => {
    const date = new Date(timestamp);
    const dayOfWeek = date.getDay(); // 0=周日, 1=周一, ..., 6=周六
    const hour = date.getHours();
    const minute = date.getMinutes();
    
    // 非工作日（周六日）
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // 上午时段：9:30-11:30
    if (hour === 9 && minute >= 30) return true;
    if (hour === 10) return true;
    if (hour === 11 && minute <= 30) return true;
    
    // 下午时段：13:00-15:00
    if (hour === 13) return true;
    if (hour === 14) return true;
    if (hour === 15 && minute === 0) return true;
    
    return false;
  };

  // 跳过非交易时间，找到下一个交易时间
  const findNextTradingTime = (startTime: number): number => {
    let currentTime = startTime;
    const maxIterations = 168; // 最多查找168小时（一周）
    let iterations = 0;
    
    while (iterations < maxIterations) {
      const currentDate = new Date(currentTime);
      const dayOfWeek = currentDate.getDay();
      const hour = currentDate.getHours();
      const minute = currentDate.getMinutes();
      
      // 检查是否为交易时间
      if (isTradingTime(currentTime)) {
        return currentTime;
      }
      
      // 如果是周末（周六或周日），跳到下周一的9:30
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        const daysToAdd = dayOfWeek === 0 ? 1 : 2; // 周日跳到周一，周六跳到周一
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        currentDate.setHours(9, 30, 0, 0);
        currentTime = currentDate.getTime();
      }
      // 如果当前是12:00-12:59之间，直接跳到13:00
      else if (hour === 12) {
        currentDate.setHours(13, 0, 0, 0);
        currentTime = currentDate.getTime();
      } 
      // 如果当前是15:01之后，跳到次日9:30
      else if ((hour === 15 && minute > 0) || hour >= 16) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 30, 0, 0);
        currentTime = currentDate.getTime();
      } 
      // 如果当前是0:00-9:29之间，跳到当天9:30
      else if (hour < 9 || (hour === 9 && minute < 30)) {
        currentDate.setHours(9, 30, 0, 0);
        currentTime = currentDate.getTime();
      }
      // 如果当前是11:31-12:59之间，跳到13:00
      else if (hour === 11 && minute > 30) {
        currentDate.setHours(13, 0, 0, 0);
        currentTime = currentDate.getTime();
      }
      // 否则加1小时
      else {
        currentTime += 60 * 60 * 1000;
      }
      
      iterations++;
    }
    
    return startTime;
  };

  // 处理单个tick
  const handleSingleTick = async (timestamp: number): Promise<boolean> => {
    if (!onTick) return false;
    
    try {
      // 检查是否已经到达今天的日期
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentDate = new Date(timestamp);
      currentDate.setHours(0, 0, 0, 0);
      
      // 如果当前日期大于等于今天，停止回测
      if (currentDate >= today) {
        console.log('回测已完成：已到达今天的日期');
        return false;
      }
      
      // 检查是否超过结束时间
      const endTime = new Date(endDate).getTime();
      if (timestamp > endTime) {
        console.log('回测已完成：已超过结束时间');
        return false;
      }
      
      setCurrentTime(timestamp);
      if (onTimestampChange) {
        onTimestampChange(timestamp);
      }
      
      await onTick(timestamp);
      return true;
    } catch (error) {
      console.error('Tick failed:', error);
      return false;
    }
  };

  // 自动执行多个tick
  const handleAutoTick = async () => {
    if (isAutoTicking || !onTick || isBacktestCompleted) return;
    
    // 1. 先预加载数据
    if (onPreloadData && backtestTimeRange) {
      setIsPreloading(true);
      try {
        console.log('🔄 开始预加载回测数据...');
        const preloadSuccess = await onPreloadData(backtestTimeRange.start, backtestTimeRange.end);
        
        if (!preloadSuccess) {
          console.error('❌ 数据预加载失败');
          alert('数据预加载失败，请重试');
          return;
        }
        console.log('✅ 数据预加载完成');
      } catch (error) {
        console.error('❌ 数据预加载出错:', error);
        alert('数据预加载出错，请重试');
        return;
      } finally {
        setIsPreloading(false);
      }
    }
    
    // 2. 开始自动回测
    setIsAutoTicking(true);
    let currentTickTime = currentTime;
    let tickCount = 0;
    const maxTicks = 1000; // 防止无限循环
    
    try {
      // 计算有效结束时间（取用户选择的结束时间和最后一个交易日的较小者）
      const endTimestamp = new Date(endDate).getTime();
      const effectiveEndTime = Math.min(endTimestamp, getLastTradingDay);
      
      while (tickCount < maxTicks) {
        // 计算下一个时间点
        let nextTime = currentTickTime + 60 * 60 * 1000; // 加1小时
        
        // 如果超过有效结束时间，结束自动回测
        if (nextTime > effectiveEndTime) {
          console.log('自动回测完成：已到达有效结束时间');
          break;
        }
        
        // 跳过非交易时间
        nextTime = findNextTradingTime(nextTime);
        
        // 如果跳转后的时间超过有效结束时间，结束自动回测
        if (nextTime > effectiveEndTime) {
          console.log('自动回测完成：跳过非交易时间后已超过有效结束时间');
          break;
        }
        
        // 执行tick
        const success = await handleSingleTick(nextTime);
        if (!success) {
          console.log('自动回测完成：tick失败或回测已完成');
          break;
        }
        
        currentTickTime = nextTime;
        tickCount++;
        
        // 添加小延迟，避免过快
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`✅ 自动回测完成，共执行 ${tickCount} 个tick，有效结束时间：${new Date(effectiveEndTime).toLocaleString()}`);
    } catch (error) {
      console.error('自动回测失败:', error);
    } finally {
      setIsAutoTicking(false);
    }
  };

  // 处理tick按钮点击（单次tick）
  const handleTick = async () => {
    if (isTicking || isAutoTicking || !onTick || isBacktestCompleted) return;
    
    setIsTicking(true);
    try {
      // 计算下一个时间点（当前时间+1小时）
      let nextTime = currentTime + 60 * 60 * 1000; // 加1小时
      const endTime = new Date(endDate).getTime();
      
      // 如果超过结束时间，停止回测（不再循环）
      if (nextTime > endTime) {
        console.log('回测已完成：已超过结束时间');
        setIsTicking(false);
        return;
      }
      
      // 跳过非交易时间，找到下一个交易时间
      nextTime = findNextTradingTime(nextTime);
      
      // 如果跳过交易时间后超过结束时间，也停止
      if (nextTime > endTime) {
        console.log('回测已完成：跳过非交易时间后已超过结束时间');
        setIsTicking(false);
        return;
      }
      
      // 执行单个tick
      await handleSingleTick(nextTime);
    } catch (error) {
      console.error('Tick failed:', error);
    } finally {
      setIsTicking(false);
    }
  };

  // 处理reset按钮点击
  const handleReset = async () => {
    if (isResetting || !onReset) return;
    
    // 确认对话框
    if (!confirm('确定要重置所有玩家数据吗？这将清空所有交易记录和资产历史。')) {
      return;
    }
    
    setIsResetting(true);
    try {
      await onReset();
    } catch (error) {
      console.error('Reset failed:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // 处理添加玩家
  const handleAddPlayer = async (config: {
    playerName: string;
    stockPool: string[];
    buyThreshold: number;
    sellThreshold: number;
    positionSize: number;
    maxShares: number;
    signalSensitivity: number;
    rsiBuyThreshold: number;
    rsiSellThreshold: number;
    isRandomTrade: boolean;
    randomBuyProbability?: number;
    randomSellProbability?: number;
    reasoning: string;
  }) => {
    try {
      console.log('🎯 添加玩家:', config.playerName);
      
      const response = await fetch('/api/arena/create-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyConfig: {
            stockPool: config.stockPool,
            buyThreshold: config.buyThreshold,
            sellThreshold: config.sellThreshold,
            positionSize: config.positionSize,
            maxShares: config.maxShares,
            signalSensitivity: config.signalSensitivity,
            rsiBuyThreshold: config.rsiBuyThreshold,
            rsiSellThreshold: config.rsiSellThreshold,
            isRandomTrade: config.isRandomTrade,
            randomBuyProbability: config.randomBuyProbability,
            randomSellProbability: config.randomSellProbability,
          },
          playerName: config.playerName,
          strategyType: config.isRandomTrade ? 'aggressive' : 'balanced',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ 玩家添加成功:', result);
        
        // 触发刷新回调
        if (onAddPlayer) {
          await onAddPlayer();
        }
      } else {
        const errorData = await response.json();
        console.error('❌ 添加玩家失败:', errorData);
        alert(`添加玩家失败: ${errorData.error || '未知错误'}`);
      }
    } catch (error) {
      console.error('❌ 添加玩家出错:', error);
      alert('添加玩家出错，请稍后重试');
    }
  };

  // 获取玩家头像（使用API传入的avatar数据）
  const getPlayerAvatar = (player: Player) => {
    return player.avatar || { 
      icon: '👤', 
      bgColor: 'bg-gray-100 dark:bg-gray-700', 
      textColor: 'text-gray-600 dark:text-gray-400' 
    };
  };

  // 格式化当前时间显示
  const formatCurrentTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* 回测时间范围选择器 */}
      <div className="px-6 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">回测时间范围:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              // 设置当前时间为新开始时间的9:30
              const newStart = new Date(e.target.value);
              newStart.setHours(9, 30, 0, 0);
              setCurrentTime(newStart.getTime());
              // 通知时间范围变化
              if (onTimeRangeChange) {
                onTimeRangeChange(newStart.getTime(), new Date(endDate).getTime());
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <span className="text-xs text-gray-500">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              // 通知时间范围变化
              if (onTimeRangeChange) {
                onTimeRangeChange(new Date(startDate).getTime(), new Date(e.target.value).getTime());
              }
            }}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">当前时间:</span>
          <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
            {formatCurrentTime(currentTime)}
                </span>
              </div>
      </div>

      <div className="flex items-center justify-between w-full px-6 py-3">
        {/* 左侧：回测模式（已移除市场指数显示） */}
        <div className="flex items-center space-x-4">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            回测模式
          </span>
        </div>

        {/* 中间：Tick、自动回测、添加玩家和Reset按钮 */}
        <div className="flex items-center space-x-3">
          {!isDemoMode && (
            <button
              onClick={() => setIsAddPlayerDialogOpen(true)}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 bg-green-500 hover:bg-green-600 text-white hover:shadow-lg hover:scale-105 active:scale-95"
              title="添加玩家"
            >
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>添加玩家</span>
              </div>
            </button>
          )}
          
          <button
            onClick={handleTick}
            disabled={isTicking || isAutoTicking || !onTick || isBacktestCompleted}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isTicking || isAutoTicking || !onTick || isBacktestCompleted
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {isTicking ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>执行中...</span>
              </div>
            ) : isBacktestCompleted ? (
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>回测完成</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Tick</span>
              </div>
            )}
          </button>
          
          <button
            onClick={handleAutoTick}
            disabled={isAutoTicking || isPreloading || !onTick || isBacktestCompleted}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isAutoTicking || isPreloading || !onTick || isBacktestCompleted
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {isPreloading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>预加载中...</span>
              </div>
            ) : isAutoTicking ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>自动回测中...</span>
              </div>
            ) : isBacktestCompleted ? (
              <div className="flex items-center space-x-2">
                <span>✓</span>
                <span>回测完成</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🚀</span>
                <span>自动回测</span>
              </div>
            )}
          </button>
          
          <button
            onClick={handleReset}
            disabled={isResetting || isAutoTicking}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isResetting || isAutoTicking
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {isResetting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>重置中...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>🔄</span>
                <span>Reset</span>
              </div>
            )}
          </button>
        </div>

        {/* 右侧：最高/最低表现 */}
        <div className="flex items-center space-x-6">
          {/* 最高表现 */}
          {best && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                最佳:
              </span>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full ${getPlayerAvatar(best).bgColor}`}>
                <span className="text-xs">{getPlayerAvatar(best).icon}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {best.name}
              </span>
              <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                ¥{best.totalAssets.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                +{best.totalReturnPercent.toFixed(2)}%
              </span>
            </div>
          )}

          {/* 最低表现 */}
          {worst && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                最差:
              </span>
              <div className={`flex items-center justify-center w-6 h-6 rounded-full ${getPlayerAvatar(worst).bgColor}`}>
                <span className="text-xs">{getPlayerAvatar(worst).icon}</span>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {worst.name}
              </span>
              <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">
                ¥{worst.totalAssets.toLocaleString()}
              </span>
              <span className={`text-sm font-bold ${
                worst.totalReturnPercent >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {worst.totalReturnPercent >= 0 ? '+' : ''}{worst.totalReturnPercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 添加玩家对话框 */}
      {!isDemoMode && (
        <AddPlayerDialog
          open={isAddPlayerDialogOpen}
          onOpenChange={setIsAddPlayerDialogOpen}
          onAddPlayer={handleAddPlayer}
        />
      )}
    </div>
  );
});

export default ArenaTopBarComponent;
