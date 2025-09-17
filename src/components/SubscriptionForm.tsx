'use client';

import { useState } from 'react';
import { Mail, Check } from 'lucide-react';

export default function SubscriptionForm() {
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
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <Check className="w-6 h-6 text-green-600 mx-auto mb-2" />
        <p className="text-green-800 font-medium">订阅成功！</p>
        <p className="text-green-600 text-sm">您将收到最新创业洞察的邮件通知</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-center mb-2">
        <Mail className="w-5 h-5 text-gray-400 mr-2" />
        <span className="text-sm text-gray-600">订阅邮件，获取最新创业洞察</span>
      </div>
      
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="输入您的邮箱地址"
          required
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none text-sm"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg transition-all duration-200 ease-out hover:bg-black hover:opacity-90 active:translate-y-[1px] shadow-sm hover:shadow text-sm font-medium"
        >
          {isLoading ? '订阅中...' : '订阅'}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        我们只会发送最新创业洞察更新，您可随时取消订阅。
      </p>
    </form>
  );
}