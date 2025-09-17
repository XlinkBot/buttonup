'use client';

import { useState } from 'react';
import { Mail, Check, Sparkles } from 'lucide-react';

interface SubscriptionFormProps {
  compact?: boolean;
  buttonText?: string;
}

export default function SubscriptionForm({ compact = false, buttonText = '订阅' }: SubscriptionFormProps) {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 在实际应用中，这里应发送到后端服务
      // 现在仅模拟成功的订阅流程
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubscribed(true);
      setEmail('');
    } catch (error) {
      console.error('订阅失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-center ${compact ? 'p-2' : 'p-3 sm:p-4'}`}>
        <Check className={`text-green-600 mx-auto mb-2 ${compact ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
        <p className={`text-green-800 dark:text-green-200 font-medium ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>订阅成功！</p>
        {!compact && (
          <p className="text-green-600 dark:text-green-300 text-xs sm:text-sm">您将收到最新创业洞察的邮件通知</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-1' : 'space-y-2 sm:space-y-3'}>
      {!compact && (
        <div className="flex items-center justify-center mb-2">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" />
          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">获取每周精选</span>
        </div>
      )}
      
      <div className={`flex gap-2 ${compact ? 'flex-col sm:flex-row' : ''}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={compact ? "邮箱地址" : "输入您的邮箱地址"}
          required
          className={`flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 ${
            compact ? 'px-3 py-2.5 text-sm' : 'px-3 py-2 sm:py-2.5 text-sm'
          }`}
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-lg transition-all duration-300 ease-out hover:from-orange-500 hover:to-pink-600 hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] active:translate-y-[1px] active:scale-[0.98] shadow-md font-semibold touch-target border-0 text-center flex items-center justify-center ${
            compact ? 'px-8 py-2.5 text-sm whitespace-nowrap min-w-[160px]' : 'px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base min-w-[180px]'
          } ${isLoading ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            '订阅中...'
          ) : (
            <span className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              {buttonText === '免费订阅' ? '免费订阅' : buttonText}
            </span>
          )}
        </button>
      </div>
      
      {!compact && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center leading-relaxed">
          每周创业洞察直达您的邮箱，随时可取消订阅。
        </p>
      )}
    </form>
  );
}