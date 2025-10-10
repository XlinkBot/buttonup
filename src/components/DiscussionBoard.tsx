'use client';

import { useState } from 'react';

interface Discussion {
  persona: string;
  name: string;
  avatar: string;
  content: string;
  timestamp: string;
}

interface DiscussionBoardProps {
  discussions: Discussion[];
  topic: string;
  stockSymbol: string;
}

const PERSONA_COLORS = {
  bull: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
  bear: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
  technical: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  value: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
  growth: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10'
};

export function DiscussionBoard({ discussions, topic, stockSymbol }: DiscussionBoardProps) {
  const [sortBy, setSortBy] = useState<'time' | 'persona'>('time');

  const sortedDiscussions = [...discussions].sort((a, b) => {
    if (sortBy === 'time') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Discussion Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                    rounded-lg p-4 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">💬</span>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            讨论话题
          </h3>
        </div>
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          关于 <span className="text-blue-600 dark:text-blue-400 font-bold">{stockSymbol}</span>: {topic}
        </p>
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600 dark:text-gray-400">
          <span>{discussions.length} 位投资者参与讨论</span>
          <div className="flex items-center space-x-2">
            <span>排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'time' | 'persona')}
              className="bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 
                       rounded px-2 py-1 text-sm"
            >
              <option value="time">时间</option>
              <option value="persona">角色</option>
            </select>
          </div>
        </div>
      </div>

      {/* Discussion Posts */}
      <div className="space-y-4">
        {sortedDiscussions.map((discussion, index) => (
          <div
            key={`${discussion.persona}-${index}`}
            className={`border-l-4 rounded-lg p-4 ${
              PERSONA_COLORS[discussion.persona as keyof typeof PERSONA_COLORS] || 
              'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10'
            }`}
          >
            {/* User Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{discussion.avatar}</div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {discussion.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(discussion.timestamp)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 
                               px-2 py-1 rounded-full">
                  #{index + 1}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {discussion.content}
              </p>
            </div>

            {/* Interaction Buttons */}
            <div className="flex items-center space-x-4 mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 
                               hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <span>👍</span>
                <span>赞同</span>
              </button>
              <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 
                               hover:text-red-600 dark:hover:text-red-400 transition-colors">
                <span>👎</span>
                <span>反对</span>
              </button>
              <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 
                               hover:text-green-600 dark:hover:text-green-400 transition-colors">
                <span>💬</span>
                <span>回复</span>
              </button>
              <button className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 
                               hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                <span>🔗</span>
                <span>分享</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Discussion Summary */}
      {discussions.length > 1 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 
                      rounded-lg p-4 mt-6">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xl">📊</span>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              讨论总结
            </h4>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            本次讨论共有 {discussions.length} 位不同背景的投资者参与，
            从多个角度分析了 <strong>{stockSymbol}</strong> 的投资价值。
            建议综合考虑各方观点，结合自身风险承受能力做出投资决策。
          </p>
        </div>
      )}
    </div>
  );
}
