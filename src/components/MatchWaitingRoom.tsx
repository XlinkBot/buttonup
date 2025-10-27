'use client';

import { useEffect, useState } from 'react';
import { Users, Loader2, X, CheckCircle2, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MatchRoom } from '@/types/arena';



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
      <div className="w-full max-w-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isMatched ? '准备开始' : '等待匹配中'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {isMatched ? '即将跳转到竞技场...' : '系统正在自动匹配玩家'}
            </p>
          </div>
          <button
            onClick={handleLeave}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* 进度显示 */}
        {isMatched ? (
          <div className="text-center py-12">
            <Loader2 className="w-16 h-16 text-orange-500 animate-spin mx-auto mb-6" />
            <p className="text-lg text-gray-600 dark:text-gray-400">
              正在生成竞技场...
            </p>
          </div>
        ) : (
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="text-7xl font-bold text-orange-500">
                {currentCount}
              </div>
              <div className="text-5xl text-gray-300">/</div>
              <div className="text-7xl font-bold text-gray-300">
                {MAX_PLAYERS}
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="w-full bg-gray-200/50 dark:bg-gray-700/30 rounded-full h-2 overflow-hidden max-w-md mx-auto">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 玩家列表 */}
        <div className="space-y-2 mb-12">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-6 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            玩家列表
          </h3>
          
          <div className="flex flex-wrap gap-3 justify-center">
            {room.users.map((user, index) => {
              const isSystemPlayer = user.id.startsWith('system_');
              const isCurrentUser = user.id === userId;
              return (
                <div
                  key={user.id}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-full transition-all duration-300 ${
                    isCurrentUser 
                      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' 
                      : 'bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    isSystemPlayer ? 'bg-blue-500' : 'bg-orange-500'
                  }`}>
                    {isSystemPlayer ? '🤖' : index + 1}
                  </div>
                  <span className="font-medium">{user.name}</span>
                  {isSystemPlayer && (
                    <span className="text-xs opacity-60">• AI</span>
                  )}
                </div>
              );
            })}
            
            {/* 空位 */}
            {Array.from({ length: MAX_PLAYERS - currentCount }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-gray-800/30 border border-dashed border-gray-300 dark:border-gray-600"
              >
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-400 text-sm">等待中</span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-8">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isMatched 
                ? '即将跳转到竞技场...' 
                : `等待 ${MAX_PLAYERS - currentCount} 名玩家加入`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

