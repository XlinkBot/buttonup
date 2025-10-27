'use client';

import { useEffect, useState } from 'react';
import { Users, Loader2, X, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MatchRoom {
  roomId: string;
  users: Array<{
    userId: string;
    userName: string;
    joinTime: number;
  }>;
  status: 'waiting' | 'matched';
  createdAt: number;
  sessionId?: string;
}

const MAX_PLAYERS = 4;

export default function MatchWaitingRoom({
  roomId,
  userId
}: {
  roomId: string;
  userId: string;
}) {
  const router = useRouter();
  const [room, setRoom] = useState<MatchRoom | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [previousPlayerCount, setPreviousPlayerCount] = useState(0);

  useEffect(() => {
    if (!isPolling || !roomId) return;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/arena/match?roomId=${roomId}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error);
          setIsPolling(false);
          return;
        }

        setRoom(result.data.room);
        
        // 检测新玩家加入
        const currentPlayerCount = result.data.room.users.length;
        if (currentPlayerCount > previousPlayerCount) {
          console.log(`✨ 新玩家加入！当前 ${currentPlayerCount}/${MAX_PLAYERS}`);
          setPreviousPlayerCount(currentPlayerCount);
        }

        // 检查匹配状态
        const roomStatus = result.data.room.status;
        const sessionId = result.data.room.sessionId;
        
        // 如果状态是 matched 且有 sessionId，跳转到竞技场
        if (roomStatus === 'matched' && sessionId) {
          console.log('🎮 匹配完成，跳转到竞技场:', sessionId);
          setIsPolling(false);
          router.push(`/arena/${sessionId}`);
        }
      } catch (err) {
        console.error('查询匹配状态失败:', err);
        setError('查询失败，请刷新页面重试');
      }
    };

    // 立即查询一次
    pollStatus();

    // 每2秒轮询一次
    const interval = setInterval(pollStatus, 2000);

    return () => clearInterval(interval);
  }, [roomId, isPolling, router, previousPlayerCount]);

  
  const handleLeave = async () => {
    try {
      await fetch(`/api/arena/match?roomId=${roomId}&userId=${userId}`, {
        method: 'DELETE',
      });
      router.push('/arena');
    } catch (err) {
      console.error('离开失败:', err);
    }
  };

  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              匹配失败
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={() => router.push('/arena')}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
              >
                返回排行榜
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  const currentCount = room.users.length;
  const progress = (currentCount / MAX_PLAYERS) * 100;
  const isMatched = room.status === 'matched';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              等待匹配中...
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              房间号: {roomId.substring(0, 20)}...
            </p>
          </div>
          <button
            onClick={handleLeave}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* 进度显示 */}
        <div className="p-6">
          <div className="text-center mb-6">
            {isMatched ? (
              <>
                <div className="mb-4">
                  <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {room.status === 'matched' ? '正在生成竞技场...' : '准备开始！'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {room.status === 'matched' 
                      ? '系统正在自动补齐玩家并创建对战房间' 
                      : '即将跳转到竞技场'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="text-6xl font-bold text-orange-500">
                    {currentCount}
                  </div>
                  <div className="text-gray-400">/</div>
                  <div className="text-6xl font-bold text-gray-400">
                    {MAX_PLAYERS}
                  </div>
                </div>
                
                {/* 进度条 */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                  系统正在自动匹配玩家... (还需 {MAX_PLAYERS - currentCount} 名)
                </p>
              </>
            )}
          </div>

          {/* 玩家列表 */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
              <Users className="w-4 h-4 mr-2" />
              当前玩家 ({currentCount})
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {room.users.map((user, index) => {
                const isSystemPlayer = user.userId.startsWith('system_');
                return (
                  <div
                    key={user.userId}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg transition-all duration-300 animate-in fade-in slide-in-from-left"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${
                      isSystemPlayer ? 'bg-blue-500' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                        {user.userName}
                        {isSystemPlayer && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded">
                            🤖
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isSystemPlayer ? '系统玩家' : new Date(user.joinTime).toLocaleTimeString('zh-CN')}
                      </div>
                    </div>
                    {user.userId === userId && (
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
                        你
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 空位显示 */}
            {Array.from({ length: MAX_PLAYERS - currentCount }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center space-x-3 p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-300 dark:border-gray-600"
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 text-gray-400 italic">
                  等待玩家加入...
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示和操作 */}
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-semibold mb-1">💡 匹配提示</p>
                <p>当房间达到 {MAX_PLAYERS} 人时，将自动开始比赛。系统会自动补齐玩家以加速匹配。</p>
              </div>
            </div>

            {/* Info for real users */}
            {userId.startsWith('user_') && room && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium">准备开始对战</p>
                  <p className="text-xs">策略配置将在对战页面进行</p>
                </div>
                <div className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-3 py-2 rounded-full">
                  等待配置策略
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

