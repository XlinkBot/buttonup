'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Target } from 'lucide-react';
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

import type { StrategyConfig } from '@/types/arena';

interface PlayerStrategyConfig extends StrategyConfig {
  playerName: string;
}

interface StrategyConfigDialogProps {
  open: boolean;
  onConfigure: (config: PlayerStrategyConfig) => Promise<void>;
}

const EXAMPLE_PROMPTS = [
  '我想要一个激进的策略，重点关注科技股，喜欢高频交易',
  '给我一个稳健的蓝筹股投资策略，主要关注银行、保险、能源等传统行业',
  '创建一个保守的防御型策略，优先考虑高分红、低波动的股票',
  '设计一个价值投资策略，注重长期持有，关注基本面',
];

export default function StrategyConfigDialog({ open, onConfigure }: StrategyConfigDialogProps) {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<PlayerStrategyConfig | null>(null);
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
      await onConfigure({
        ...generatedConfig,
        playerName,
      });
      
      // 重置状态
      setDescription('');
      setGeneratedConfig(null);
      setPlayerName('');
    } catch (error) {
      console.error('配置策略失败:', error);
      alert('配置策略失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExampleClick = (prompt: string) => {
    setDescription(prompt);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            配置你的投资策略
          </DialogTitle>
          <DialogDescription>
            在开始竞技场对战之前，请配置你的AI投资策略
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 策略描述输入 */}
          <div>
            <label className="block text-sm font-medium mb-2">策略描述</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述你想要的AI投资策略，例如：'我想要一个激进的策略，重点关注科技股'"
              rows={4}
              disabled={isGenerating}
            />
            <div className="mt-2 text-xs text-gray-500">
              点击下面的示例快速开始
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {EXAMPLE_PROMPTS.map((prompt, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={() => handleExampleClick(prompt)}
                  disabled={isGenerating}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          {/* 生成按钮 */}
          <Button
            onClick={handleGenerateStrategy}
            disabled={!description.trim() || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在生成策略...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                生成策略
              </>
            )}
          </Button>

          {/* 生成结果 */}
          {generatedConfig && (
            <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">玩家名称</label>
                <Input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="输入你的玩家名称"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">股票池:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {generatedConfig.stockPool.join(', ')}
                  </p>
                </div>
                <div>
                  <span className="font-medium">持仓规模:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {generatedConfig.positionSize * 100}%
                  </p>
                </div>
                <div>
                  <span className="font-medium">买入阈值:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {generatedConfig.buyThreshold * 100}%
                  </p>
                </div>
                <div>
                  <span className="font-medium">卖出阈值:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {generatedConfig.sellThreshold * 100}%
                  </p>
                </div>
              </div>

              <div>
                <span className="font-medium text-sm">AI 推理:</span>
                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">
                  {generatedConfig.reasoning}
                </p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!playerName.trim() || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    正在配置...
                  </>
                ) : (
                  '确认配置并开始比赛'
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

