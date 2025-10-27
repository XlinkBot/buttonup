'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Server, Trash2, Play, Clock } from 'lucide-react';
import { useArenaGameData } from '@/hooks/useArenaGameData';

export default function BacktestManager() {
  const {
    cacheStatus,
    isPreloadingCache,
    isClearingCache,
    preloadCache,
    clearCache,
    checkCacheStatus,
    executeBacktestTick,
    executeRealtimeTick,
  } = useArenaGameData();

  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [isRunningRealtime, setIsRunningRealtime] = useState(false);

  // 预加载数据到后端Redis
  const handlePreload = useCallback(async () => {
    const now = new Date();
    const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7天前
    await preloadCache(startTime, now);
  }, [preloadCache]);

  // 执行回测tick（使用Redis缓存）
  const handleRunBacktest = useCallback(async () => {
    setIsRunningBacktest(true);
    try {
      const testTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1天前
      await executeBacktestTick(testTime);
    } finally {
      setIsRunningBacktest(false);
    }
  }, [executeBacktestTick]);

  // 执行实时tick（不使用缓存）
  const handleRunRealtime = useCallback(async () => {
    setIsRunningRealtime(true);
    try {
      await executeRealtimeTick();
    } finally {
      setIsRunningRealtime(false);
    }
  }, [executeRealtimeTick]);

  return (
    <div className="w-full max-w-2xl mx-auto border rounded-lg p-6 bg-white dark:bg-gray-800">
      <div className="mb-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>后端Redis缓存管理</span>
        </h3>
      </div>
      <div className="space-y-4">
        {/* 缓存状态 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">后端Redis缓存状态</span>
            <Button
              onClick={checkCacheStatus}
              size="sm"
              variant="outline"
            >
              检查状态
            </Button>
          </div>
          
          {cacheStatus ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <Badge variant={cacheStatus.isLoaded ? 'default' : 'secondary'}>
                  {cacheStatus.isLoaded ? '已加载' : '未加载'}
                </Badge>
              </div>
              <div>股票数量: {cacheStatus.symbolsCount}</div>
              <div>价格数据: {cacheStatus.totalQuotes} 条</div>
              <div>技术指标: {cacheStatus.totalIndicators} 条</div>
              <div>加载耗时: {cacheStatus.loadTimeMs}ms</div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">点击&ldquo;检查状态&rdquo;查看后端Redis缓存信息</p>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handlePreload}
            disabled={isPreloadingCache}
            className="flex items-center space-x-2"
          >
            {isPreloadingCache ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Server className="h-4 w-4" />
            )}
            <span>预加载到Redis</span>
          </Button>

          <Button
            onClick={clearCache}
            disabled={isClearingCache || !cacheStatus?.isLoaded}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            {isClearingCache ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>清理Redis</span>
          </Button>

          <Button
            onClick={handleRunBacktest}
            disabled={isRunningBacktest || !cacheStatus?.isLoaded}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {isRunningBacktest ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>回测模式</span>
          </Button>

          <Button
            onClick={handleRunRealtime}
            disabled={isRunningRealtime}
            variant="outline"
            className="flex items-center space-x-2"
          >
            {isRunningRealtime ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span>实时模式</span>
          </Button>
        </div>

        {/* 说明 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 预加载到Redis：将7天的历史数据加载到后端Redis缓存</p>
          <p>• 清理Redis：清空后端Redis中的所有回测数据</p>
          <p>• 回测模式：使用Redis缓存数据执行历史回测</p>
          <p>• 实时模式：使用实时API数据执行当前tick</p>
        </div>
      </div>
    </div>
  );
}
