'use client';

import {  memo } from 'react';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Player, BacktestSession } from '@/types/arena';

interface ArenaBattleTopBarProps {
  session: BacktestSession;
  players: Player[];
  bestPlayer?: Player | null;
  worstPlayer?: Player | null;
  isStarting: boolean;
  isReadyToStart: boolean;
  sessionStatus: string;
  onStartBattle: () => void;
}

const ArenaBattleTopBarComponent = memo(function ArenaBattleTopBar({
  session,
  players,
  bestPlayer,
  worstPlayer,
  isStarting,
  isReadyToStart,
  sessionStatus,
  onStartBattle,
}: ArenaBattleTopBarProps) {

  return (
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* 左侧：标题 */}
        <div className="flex items-center space-x-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {session.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(session.startTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })} - {new Date(session.endTime).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
            </p>
          </div>
        </div>

        {/* 中间：排行信息 */}
        <div className="flex items-center space-x-6">
          {bestPlayer && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">🏆 最佳:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{bestPlayer.name}</span>
              <span className="text-sm font-mono text-green-600 dark:text-green-400">
                +{bestPlayer.totalReturnPercent.toFixed(2)}%
              </span>
            </div>
          )}
          {worstPlayer && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">📉 最差:</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{worstPlayer.name}</span>
              <span className="text-sm font-mono text-red-600 dark:text-red-400">
                {worstPlayer.totalReturnPercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* 右侧：控制按钮 */}
        <div className="flex items-center space-x-2">
          {/* 开始按钮 - 只在准备就绪状态显示 */}
          {isReadyToStart && (
            <Button
              onClick={onStartBattle}
              disabled={isStarting}
              variant="default"
              size="sm"
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <PlayCircle className="w-4 h-4" />
              <span>{isStarting ? '开始中...' : '开始对战'}</span>
            </Button>
          )}

          {/* 状态提示 - 显示当前会话状态 */}
          {!isReadyToStart && sessionStatus === 'pending' && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-yellow-700 dark:text-yellow-300">准备中</span>
            </div>
          )}

          {/* 状态提示 - 显示其他状态 */}
          {!isReadyToStart && sessionStatus !== 'pending' && sessionStatus && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {sessionStatus === 'running' ? '进行中' :
                 sessionStatus === 'completed' ? '已完成' : sessionStatus}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ArenaBattleTopBarComponent;
