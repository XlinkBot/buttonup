'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddPlayer: (config: {
    playerName: string;
    stockPool: string[];
    buyThreshold: number;
    sellThreshold: number;
    positionSize: number;
    maxShares: number;
    signalSensitivity: number;
    rsiBuyThreshold: number;
    rsiSellThreshold: number;
    isRandomTrade: boolean;
    randomBuyProbability?: number;
    randomSellProbability?: number;
    reasoning: string;
  }) => Promise<void>;
}

const EXAMPLE_PROMPTS = [
  '我想要一个激进的策略，重点关注科技股，喜欢高频交易',
  '给我一个稳健的蓝筹股投资策略，主要关注银行、保险、能源等传统行业',
  '创建一个保守的防御型策略，优先考虑高分红、低波动的股票',
  '我喜欢短线交易，希望看到快速进出，设置较小的止盈止损',
];

export default function AddPlayerDialog({ open, onOpenChange, onAddPlayer }: AddPlayerDialogProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<{
    playerName: string;
    stockPool: string[];
    buyThreshold: number;
    sellThreshold: number;
    positionSize: number;
    maxShares: number;
    signalSensitivity: number;
    rsiBuyThreshold: number;
    rsiSellThreshold: number;
    isRandomTrade: boolean;
    randomBuyProbability?: number;
    randomSellProbability?: number;
    reasoning: string;
  } | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateStrategy = async () => {
    if (!description.trim()) {
      alert('请输入策略描述');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/arena/parse-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '生成策略失败');
      }

      const { data } = await response.json();
      setGeneratedConfig(data.strategyConfig);
      setPlayerName(data.strategyConfig.playerName);
    } catch (error) {
      console.error('生成策略失败:', error);
      alert(error instanceof Error ? error.message : '生成策略失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!generatedConfig) return;
    if (!playerName.trim()) {
      alert('请输入玩家名称');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddPlayer({
        ...generatedConfig,
        playerName,
      });
      
      // 重置状态
      setDescription('');
      setGeneratedConfig(null);
      setPlayerName('');
      onOpenChange(false);
    } catch (error) {
      console.error('添加玩家失败:', error);
      alert('添加玩家失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setDescription(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>添加新玩家</DialogTitle>
          <DialogDescription>
            用自然语言描述你想要的交易策略，AI 会自动为你生成配置
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* 策略描述输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              策略描述 <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：我想要一个激进的策略，重点关注科技股，喜欢高频交易..."
              rows={4}
              className="w-full"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              尽量详细地描述你的策略偏好，比如：激进/稳健/保守、目标行业、交易频率等
            </p>
          </div>

          {/* 示例提示 */}
          {!generatedConfig && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                快速示例：
              </p>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(prompt)}
                    className="block w-full text-left text-xs p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
                  >
                    &quot;{prompt}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 生成按钮 */}
          {!generatedConfig && (
            <Button
              onClick={handleGenerateStrategy}
              disabled={isGenerating || !description.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  正在生成策略...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成策略
                </>
              )}
            </Button>
          )}

          {/* 生成的策略预览 */}
          {generatedConfig && (
            <div className="space-y-4">
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-medium mb-2">策略预览</h3>
                
                {/* 玩家名称 */}
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    玩家名称 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="输入玩家名称"
                  />
                </div>

                {/* 策略解释 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <span className="font-medium">策略说明：</span>
                    {generatedConfig.reasoning}
                  </p>
                </div>

                {/* 策略参数 */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">股票池：</span>
                    <span className="ml-2 font-mono">{generatedConfig.stockPool.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">买入阈值：</span>
                    <span className="ml-2 font-mono">{generatedConfig.buyThreshold}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">卖出阈值：</span>
                    <span className="ml-2 font-mono">{generatedConfig.sellThreshold}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">持仓规模：</span>
                    <span className="ml-2 font-mono">{(generatedConfig.positionSize * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">最大买入：</span>
                    <span className="ml-2 font-mono">{generatedConfig.maxShares} 股</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">策略类型：</span>
                    <span className="ml-2 font-mono">
                      {generatedConfig.isRandomTrade ? '随机交易' : '技术指标'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedConfig(null);
                    setPlayerName('');
                  }}
                  disabled={isSubmitting}
                >
                  重新生成
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !playerName.trim()}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      添加中...
                    </>
                  ) : (
                    '确认添加'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

