'use client';

import { useState } from 'react';
import { Mail, Check } from 'lucide-react';

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
      <div className={`bg-green-50 border border-green-200 rounded-lg text-center ${compact ? 'p-2' : 'p-3 sm:p-4'}`}>
        <Check className={`text-green-600 mx-auto mb-2 ${compact ? 'w-4 h-4' : 'w-5 h-5 sm:w-6 sm:h-6'}`} />
        <p className={`text-green-800 font-medium ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>订阅成功！</p>
        {!compact && (
          <p className="text-green-600 text-xs sm:text-sm">您将收到最新创业洞察的邮件通知</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-1' : 'space-y-2 sm:space-y-3'}>
      {!compact && (
        <div className="flex items-center justify-center mb-2">
          <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2" />
          <span className="text-xs sm:text-sm text-gray-600">订阅邮件，获取最新创业洞察</span>
        </div>
      )}
      
      <div className={`flex gap-2 ${compact ? 'flex-col sm:flex-row' : ''}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={compact ? "邮箱地址" : "输入您的邮箱地址"}
          required
          className={`flex-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none ${
            compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 sm:py-2.5 text-sm'
          }`}
          style={{ fontSize: '16px' }} // Prevent zoom on iOS
        />
        <button
          type="submit"
          disabled={isLoading}
          className={`bg-gray-900 text-white rounded-lg transition-all duration-200 ease-out hover:bg-black hover:opacity-90 active:translate-y-[1px] active:bg-black shadow-sm hover:shadow font-medium touch-target ${
            compact ? 'px-3 py-1.5 text-xs whitespace-nowrap' : 'px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm'
          }`}
        >
          {isLoading ? '订阅中...' : buttonText}
        </button>
      </div>
      
      {!compact && (
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          我们只会发送最新创业洞察更新，您可随时取消订阅。
        </p>
      )}
    </form>
  );
}