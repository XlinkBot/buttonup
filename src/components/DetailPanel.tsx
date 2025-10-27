'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import type { Player, MarketData } from '@/types/arena';

interface DetailPanelProps {
  players: Player[];
  selectedPlayer: string | null;
  onPlayerChange: (playerId: string | null) => void;
  activeTab: 'positions' | 'trades' | 'rules' | 'readme';
  onTabChange: (tab: 'positions' | 'trades' | 'rules' | 'readme') => void;
  marketData?: MarketData[];
}

export default function DetailPanel({
  players,
  selectedPlayer,
  onPlayerChange,
  activeTab,
  onTabChange,
}: DetailPanelProps) {
  const [localSelectedPlayer, setLocalSelectedPlayer] = useState<string | null>(selectedPlayer);

  // 同步外部selectedPlayer变化
  useEffect(() => {
    setLocalSelectedPlayer(selectedPlayer);
  }, [selectedPlayer]);

  const handlePlayerSelect = (playerId: string) => {
    const newSelection = playerId === 'all' ? null : playerId;
    setLocalSelectedPlayer(newSelection);
    onPlayerChange(newSelection);
  };

  // 获取要显示的玩家
  const getDisplayPlayers = () => {
    if (localSelectedPlayer === null) {
      return players;
    }
    return players.filter(p => p.id === localSelectedPlayer);
  };

  const displayPlayers = getDisplayPlayers();

  // 获取策略配置
  const getStrategyConfig = (strategyType: string) => {
    switch (strategyType) {
      case 'aggressive':
        return {
          name: '激进型',
          description: '追求高收益，容忍高风险',
          stockPool: ['300750', '002594', '002475', '300059', '000725', '002415', '300142', '002230'],
          buySignals: 'RSI < 40 且价格突破SMA20',
          sellSignals: '止盈15% 或止损8%',
          positionSize: '30-50%资金单次交易',
        };
      case 'balanced':
        return {
          name: '稳健型',
          description: '平衡收益与风险',
          stockPool: ['600519', '000858', '600036', '000001', '600000', '600887', '000002', '600276'],
          buySignals: 'RSI < 50 且EMA12上穿EMA26',
          sellSignals: '止盈10% 或止损5%',
          positionSize: '20-30%资金单次交易',
        };
      case 'conservative':
        return {
          name: '保守型',
          description: '稳健增值，控制风险',
          stockPool: ['601398', '601318', '600900', '600028', '601288', '600104'],
          buySignals: 'RSI < 60 且价格接近布林带下轨',
          sellSignals: '止盈5% 或止损3%',
          positionSize: '10-20%资金单次交易',
        };
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* 玩家筛选器 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            选择玩家
          </label>
          <Select value={localSelectedPlayer || 'all'} onValueChange={handlePlayerSelect}>
            <SelectTrigger>
              <SelectValue placeholder="选择要查看的玩家" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部玩家</SelectItem>
              {players.map((player) => {
                const config = getStrategyConfig(player.strategyType);
                return (
                  <SelectItem key={player.id} value={player.id}>
                    <div className="flex items-center space-x-2">
                      <span>{config?.name}</span>
                      <span className="text-gray-500">- {player.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab导航 */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as 'positions' | 'trades' | 'rules' | 'readme')} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="positions">持仓</TabsTrigger>
            <TabsTrigger value="trades">交易</TabsTrigger>
            <TabsTrigger value="rules">规则</TabsTrigger>
            <TabsTrigger value="readme">说明</TabsTrigger>
          </TabsList>

        {/* 持仓内容 */}
        <TabsContent value="positions" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {displayPlayers.map((player) => (
              <div key={player.id} className="space-y-3">
                {players.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {player.name}
                    </h3>
                    <Badge variant="outline">
                      {getStrategyConfig(player.strategyType)?.name}
                    </Badge>
                  </div>
                )}
                
                {player.portfolio.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>股票</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>成本价</TableHead>
                        <TableHead>当前价</TableHead>
                        <TableHead>盈亏</TableHead>
                        <TableHead>盈亏率</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {player.portfolio.map((position) => (
                        <TableRow key={position.symbol}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{position.symbol}</div>
                              <div className="text-sm text-gray-500">{position.stockName}</div>
                            </div>
                          </TableCell>
                          <TableCell>{position.quantity}</TableCell>
                          <TableCell>¥{position.costPrice.toFixed(2)}</TableCell>
                          <TableCell>¥{position.currentPrice.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={position.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {position.profitLoss >= 0 ? '+' : ''}¥{position.profitLoss.toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={position.profitLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {position.profitLossPercent >= 0 ? '+' : ''}{position.profitLossPercent.toFixed(2)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    暂无持仓
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 交易记录内容 */}
        <TabsContent value="trades" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {displayPlayers.map((player) => (
              <div key={player.id} className="space-y-3">
                {players.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {player.name}
                    </h3>
                    <Badge variant="outline">
                      {getStrategyConfig(player.strategyType)?.name}
                    </Badge>
                  </div>
                )}
                
                {player.trades.length > 0 ? (
                  <div className="space-y-2">
                    {player.trades
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .map((trade) => (
                        <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge 
                              variant={trade.type === 'buy' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {trade.type === 'buy' ? '买入' : '卖出'}
                            </Badge>
                            <div>
                              <div className="font-medium">{trade.symbol} {trade.stockName}</div>
                              <div className="text-sm text-gray-500">{trade.type === 'buy' ? '买入' : '卖出'} {trade.quantity}股</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm">
                              ¥{trade.price.toFixed(2)} × {trade.quantity}
                            </div>
                            <div className="text-sm text-gray-500">
                              ¥{trade.amount.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(trade.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    暂无交易记录
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* 策略规则内容 */}
        <TabsContent value="rules" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {['aggressive', 'balanced', 'conservative'].map((strategyType) => {
              const config = getStrategyConfig(strategyType);
              if (!config) return null;
              
              const isHighlighted = localSelectedPlayer && 
                players.find(p => p.id === localSelectedPlayer)?.strategyType === strategyType;
              
              return (
                <div 
                  key={strategyType}
                  className={`p-4 rounded-lg border ${
                    isHighlighted 
                      ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {config.name}
                    </h3>
                    {isHighlighted && (
                      <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
                        当前选中
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>策略描述:</strong> {config.description}</p>
                    <p><strong>股票池:</strong> {config.stockPool.join(', ')}</p>
                    <p><strong>买入信号:</strong> {config.buySignals}</p>
                    <p><strong>卖出信号:</strong> {config.sellSignals}</p>
                    <p><strong>仓位控制:</strong> {config.positionSize}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* 竞技场说明内容 */}
        <TabsContent value="readme" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">竞技场介绍</h3>
              <p>
                A股投资竞技场是一个AI投资策略对战平台，三个不同风格的AI玩家在A股市场进行实时交易竞技，
                展示激进型、稳健型、保守型策略的表现差异。
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">游戏规则</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>每个玩家初始资金：¥10,000</li>
                <li>交易市场：中国A股市场</li>
                <li>交易频率：每10秒执行一次策略决策</li>
                <li>策略类型：激进型、稳健型、保守型</li>
                <li>数据来源：基于真实股票代码的模拟数据</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">技术指标</h3>
              <p>
                系统使用RSI、EMA、SMA、布林带等技术指标进行交易决策，
                每个策略都有不同的参数设置和风险偏好。
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">免责声明</h3>
              <p className="text-xs">
                本竞技场仅用于教育和演示目的，不构成投资建议。
                实际投资存在风险，请谨慎决策。
              </p>
            </div>
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
