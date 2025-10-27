'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { PlayerState  } from '@/types/arena';

interface ArenaLegendProps {
  players: PlayerState[];
  selectedPlayer?: string | null;
  onPlayerSelect?: (playerId: string | null) => void;
  filteredPlayerId?: string | null;
  onFilterPlayerSelect?: (playerId: string | null) => void;
}

const ArenaLegendComponent = memo(function ArenaLegend({ 
  players, 
  selectedPlayer, 
  onPlayerSelect,
  filteredPlayerId,
  onFilterPlayerSelect
}: ArenaLegendProps) {
  // 预定义的颜色方案
  const COLOR_PALETTES = [
    { bg: 'bg-blue-500', text: 'text-white' },
    { bg: 'bg-green-500', text: 'text-white' },
    { bg: 'bg-purple-500', text: 'text-white' },
    { bg: 'bg-orange-500', text: 'text-white' },
    { bg: 'bg-pink-500', text: 'text-white' },
    { bg: 'bg-cyan-500', text: 'text-white' },
    { bg: 'bg-yellow-500', text: 'text-black' },
    { bg: 'bg-indigo-500', text: 'text-white' },
    { bg: 'bg-emerald-500', text: 'text-white' },
    { bg: 'bg-red-500', text: 'text-white' },
  ];

  // 根据玩家ID获取颜色索引（稳定的颜色分配）
  const getColorIndex = (playerId: string) => {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++) {
      hash = ((hash << 5) - hash) + playerId.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % COLOR_PALETTES.length;
  };

  // 获取策略图标（使用API返回的头像数据）
  const getStrategyIcon = (playerst: PlayerState) => {
    // 如果是玩家（user_ 开头或包含"玩家"），显示玩家图标
    if (playerst.playerConfig.id.startsWith('user_') || playerst.playerConfig.name.includes('(玩家)')) {
      return '🎮';
    }
    return playerst.playerConfig.avatar?.icon || '🤖';
  };

  // 获取策略背景色
  const getStrategyBgColor = (playerst: PlayerState) => {
    // 如果玩家有自定义 avatar，使用它
    if (playerst.playerConfig.avatar?.bgColor) {
      return playerst.playerConfig.avatar.bgColor;
    }
    
    // 否则根据 playerId 分配固定的颜色
    const colorIndex = getColorIndex(playerst.playerConfig.id);
    return COLOR_PALETTES[colorIndex].bg;
  };

  // 获取文本颜色
  const getTextColor = (playerst: PlayerState) => {
    if (playerst.playerConfig.avatar?.textColor) {
      return playerst.playerConfig.avatar.textColor;
    }
    
    const colorIndex = getColorIndex(playerst.playerConfig.id);
    return COLOR_PALETTES[colorIndex].text;
  };

  return (
    <div className="px-4 py-3 bg-white/90 dark:bg-black/40 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50">
      <div className="flex gap-3 items-center justify-center overflow-x-auto">
        {players.map((player) => {
          const isSelected = selectedPlayer === player.playerId;
          const isFiltered = filteredPlayerId === player.playerId;
          const icon = getStrategyIcon(player);
          const bgColor = getStrategyBgColor(player);
          const textColor = getTextColor(player);

          return (
            <div
              key={player.playerId}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 min-w-0 flex-shrink-0',
                'hover:bg-gray-100/70 dark:hover:bg-gray-800/70',
                'border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50',
                isSelected && 'bg-orange-50/80 dark:bg-orange-900/20 border-orange-200/60 dark:border-orange-700/40',
                isFiltered && 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/40'
              )}
              onClick={() => {
                onPlayerSelect?.(isSelected ? null : player.playerId);
                onFilterPlayerSelect?.(isFiltered ? null : player.playerId);
              }}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                  bgColor
                )}
                style={{
                  background: player.playerConfig.avatar?.bgColor
                    ? player.playerConfig.avatar.bgColor
                    : undefined
                }}
              >
                <span className={textColor}>{icon}</span>
              </div>

              {/* Player info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {player.playerConfig.name}
                  </span>
                  {/* Status indicator */}
                  <div className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    isSelected ? 'bg-orange-500' : isFiltered ? 'bg-blue-500' : 'bg-gray-400'
                  )}></div>
                </div>

                <div className="flex items-center gap-4 mt-1">
                  {/* Strategy name */}
                  <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {player.playerConfig.strategyConfig?.name || '策略'}
                  </span>

                  {/* Separator */}
                  <span className="text-gray-300 dark:text-gray-600">•</span>

                  {/* Return percentage */}
                  <span className={cn(
                    'text-xs font-medium',
                    player.totalReturn >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  )}>
                    {player.totalReturn >= 0 ? '+' : ''}{player.totalReturn.toFixed(2)}%
                  </span>

                  {/* Separator */}
                  <span className="text-gray-300 dark:text-gray-600">•</span>

                  {/* Total assets */}
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    ${player.totalAssets.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ArenaLegendComponent;
