'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Player } from '@/types/arena';

interface ArenaLegendProps {
  players: Player[];
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
  const getStrategyIcon = (player: Player) => {
    // 如果是玩家（user_ 开头或包含"玩家"），显示玩家图标
    if (player.id.startsWith('user_') || player.name.includes('(玩家)')) {
      return '🎮';
    }
    return player.avatar?.icon || '🤖';
  };

  // 获取策略背景色
  const getStrategyBgColor = (player: Player) => {
    // 如果玩家有自定义 avatar，使用它
    if (player.avatar?.bgColor) {
      return player.avatar.bgColor;
    }
    
    // 否则根据 playerId 分配固定的颜色
    const colorIndex = getColorIndex(player.id);
    return COLOR_PALETTES[colorIndex].bg;
  };

  // 获取文本颜色
  const getTextColor = (player: Player) => {
    if (player.avatar?.textColor) {
      return player.avatar.textColor;
    }
    
    const colorIndex = getColorIndex(player.id);
    return COLOR_PALETTES[colorIndex].text;
  };

  return (
    <div className="px-4 py-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
      <div className="flex gap-3 items-stretch justify-center">
        {players.map((player) => {
          const isSelected = selectedPlayer === player.id;
          const isFiltered = filteredPlayerId === player.id;
          const icon = getStrategyIcon(player);
          const bgColor = getStrategyBgColor(player);
          const textColor = getTextColor(player);
          
          return (
            <div
              key={player.id}
              className={cn(
                'flex flex-col items-center justify-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 min-w-[120px]',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                isSelected && 'bg-gray-100 dark:bg-gray-700 ring-2 ring-orange-500',
                isFiltered && 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500'
              )}
              onClick={() => {
                onPlayerSelect?.(isSelected ? null : player.id);
                onFilterPlayerSelect?.(isFiltered ? null : player.id);
              }}
            >
              {/* 第一行：图标和名称 */}
              <div className="flex items-center space-x-2 mb-3">
                <div 
                  className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', bgColor)}
                >
                  <span className={textColor}>{icon}</span>
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white text-center truncate max-w-[80px]">
                  {player.name}
                </div>
              </div>
              
              {/* 第二行：资产 */}
              <div className="text-sm font-mono font-bold text-gray-900 dark:text-white mb-2">
                ${player.totalAssets.toLocaleString()}
              </div>
              
              {/* 第三行：盈亏比例 */}
              <div className={cn(
                'text-sm font-mono font-bold',
                player.totalReturnPercent >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              )}>
                {player.totalReturnPercent >= 0 ? '+' : ''}{player.totalReturnPercent.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default ArenaLegendComponent;
