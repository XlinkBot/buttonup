'use client';

import { useState } from 'react';

interface TopicInputProps {
  onStartDiscussion: (topic: string) => void;
  disabled: boolean;
  stockSymbol: string;
}

const SUGGESTED_TOPICS = [
  '这只股票现在是买入的好时机吗？',
  '未来一年的价格走势预测',
  '这家公司的财务状况如何？',
  '相比同行业其他公司有什么优势？',
  '最近的新闻对股价有什么影响？',
  '长期投资价值分析',
  '技术面分析和支撑阻力位',
  '风险因素和注意事项'
];

export function TopicInput({ onStartDiscussion, disabled, stockSymbol }: TopicInputProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !disabled) {
      onStartDiscussion(topic.trim());
      setTopic('');
    }
  };

  const handleSuggestedTopic = (suggestedTopic: string) => {
    setTopic(suggestedTopic);
  };

  return (
    <div className="space-y-4 mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            讨论话题
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={`关于 ${stockSymbol} 你想讨论什么？`}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-500 dark:placeholder-gray-400"
              disabled={disabled}
            />
            <button
              type="submit"
              disabled={disabled || !topic.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                       text-white font-medium rounded-lg transition-colors
                       disabled:cursor-not-allowed"
            >
              开始讨论
            </button>
          </div>
        </div>
      </form>

      {/* Suggested Topics */}
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          💡 建议话题（点击快速选择）：
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TOPICS.map((suggestedTopic, index) => (
            <button
              key={index}
              onClick={() => handleSuggestedTopic(suggestedTopic)}
              disabled={disabled}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 
                       dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 
                       rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestedTopic}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
