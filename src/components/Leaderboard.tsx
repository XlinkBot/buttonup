'use client';

import { useEffect, useState } from 'react';
import { Trophy, TrendingUp, TrendingDown, Medal, Award, Play, Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  strategyType: 'aggressive' | 'balanced' | 'conservative';
  totalSessions: number;
  totalReturn: number;
  totalReturnPercent: number;
  bestSession?: {
    sessionId: string;
    returnPercent: number;
  };
  latestSession?: {
    sessionId: string;
    returnPercent: number;
  };
  rank: number;
}

interface PeriodLeaderboard {
  name: string;
  start: number;
  end: number;
  leaderboard: LeaderboardEntry[];
  totalSessions: number;
}

interface LeaderboardData {
  periods: PeriodLeaderboard[];
  currentSession?: {
    sessionId: string;
    name: string;
    description?: string;
    createdAt: number;
  } | null;
}


// 获取策略类型的中文名称
function getStrategyName(type: string): string {
  switch (type) {
    case 'aggressive':
      return '激进型';
    case 'balanced':
      return '稳健型';
    case 'conservative':
      return '保守型';
    default:
      return type;
  }
}

// 获取策略类型的颜色
function getStrategyColor(type: string): string {
  switch (type) {
    case 'aggressive':
      return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
    case 'balanced':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    case 'conservative':
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
    default:
      return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }
}

export default function Leaderboard() {
  const router = useRouter();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(0); // 默认选择第一个赛程（当月）
  const [isStartingMatch, setIsStartingMatch] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  // 开始匹配
  const handleStartMatch = async () => {
    setIsStartingMatch(true);
    try {
      const response = await fetch('/api/arena/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: `user_${Date.now()}`,
        }),
      });

      const result = await response.json();

      if (result.success && result.data.room.roomId) {
        router.push(`/arena/match?roomId=${result.data.room.roomId}`);
      } else {
        alert('开始匹配失败，请重试');
        setIsStartingMatch(false);
      }
    } catch (error) {
      console.error('开始匹配失败:', error);
      alert('开始匹配失败，请重试');
      setIsStartingMatch(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/arena/leaderboard');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '加载排行榜失败');
      }
      
      setData(result.data);
    } catch (err) {
      console.error('加载排行榜失败:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">正在加载排行榜...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
        <TrendingDown className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={loadLeaderboard}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          重试
        </button>
      </div>
    );
  }

  if (!data || data.periods.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
        <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          暂无排行榜数据
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          还没有完成任何竞技场回测
        </p>
      </div>
    );
  }

  // 获取当前选中的赛程
  const currentPeriod = data.periods[selectedPeriod];
  
  // 获取前三名的icon
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Medal className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-orange-600" />;
      default:
        return <span className="w-6 h-6 text-center text-gray-600 dark:text-gray-400 font-semibold">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 当前比赛入口 */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                准备开始新的一轮竞技场
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                匹配其他玩家，每场最多8人参与
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                <Calendar className="w-3 h-3 inline mr-1" />
                系统会自动补齐玩家以加速匹配
              </p>
            </div>
          </div>
          <button
            onClick={handleStartMatch}
            disabled={isStartingMatch}
            className="flex items-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStartingMatch ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>匹配中...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>开始匹配</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 赛程切换 */}
      {data.periods.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                🏆 排行榜
              </h2>
              {currentPeriod && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  共 {currentPeriod.totalSessions} 个回测会话
                </p>
              )}
            </div>
          </div>
          
          {/* 赛程标签页 */}
          <div className="flex flex-wrap gap-2">
            {data.periods.map((period, index) => (
              <button
                key={index}
                onClick={() => setSelectedPeriod(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === index
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period.name} ({period.totalSessions})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 排行榜表格 */}
      {currentPeriod && currentPeriod.leaderboard.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    排名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    玩家
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    策略类型
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    平均收益率
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    最佳表现
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    回测场次
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {currentPeriod.leaderboard.map((entry) => {
                  const isTopThree = entry.rank <= 3;
                  const isPositive = entry.totalReturnPercent > 0;
                  
                  return (
                    <tr
                      key={entry.playerId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isTopThree ? 'bg-gradient-to-r from-orange-50/50 to-orange-50/30 dark:from-orange-900/10 dark:to-transparent' : ''
                      }`}
                    >
                      {/* 排名 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-start">
                          {entry.rank <= 3 ? (
                            <div className="flex items-center">
                              {getRankIcon(entry.rank)}
                            </div>
                          ) : (
                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* 玩家名称 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {entry.playerName}
                        </div>
                      </td>
                      
                      {/* 策略类型 */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStrategyColor(entry.strategyType)}`}>
                          {getStrategyName(entry.strategyType)}
                        </span>
                      </td>
                      
                      {/* 平均收益率 */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`flex items-center justify-end space-x-1 text-sm font-bold ${
                          isPositive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span>
                            {entry.totalReturnPercent > 0 ? '+' : ''}{entry.totalReturnPercent.toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      
                      {/* 最佳表现 */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {entry.bestSession ? (
                          <div className={`text-sm font-medium ${
                            entry.bestSession.returnPercent > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {entry.bestSession.returnPercent > 0 ? '+' : ''}
                            {entry.bestSession.returnPercent.toFixed(2)}%
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      
                      {/* 回测场次 */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                        {entry.totalSessions} 场
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : currentPeriod ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
          <Trophy className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {currentPeriod.name}暂无排行榜数据
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            该赛程还没有完成任何竞技场回测
          </p>
        </div>
      ) : null}
      
      {/* 底部提示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <div className="flex items-start space-x-2">
          <Award className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-1">📊 排行榜说明</p>
            <p>排行榜根据玩家在本月所有回测会话中的平均收益率进行排名。排名越靠前，投资策略表现越优秀。</p>
          </div>
        </div>
      </div>
    </div>
  );
}

