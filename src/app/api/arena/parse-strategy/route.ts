import { NextResponse, NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { z } from 'zod';

// 定义策略配置的 Zod Schema
const strategySchema = z.object({
  playerName: z.string().describe('玩家名称，基于策略特点生成'),
  stockPool: z.array(z.string()).describe('股票代码数组，如 ["600519", "000858"]，必须是真实存在的 A 股代码（6位数字）'),
  buyThreshold: z.number().describe('买入阈值（涨跌幅百分比），如 2.0 表示涨幅超过2%时买入'),
  sellThreshold: z.number().describe('卖出阈值（涨跌幅百分比），如 -1.5 表示跌幅超过1.5%时卖出'),
  positionSize: z.number().min(0).max(1).describe('持仓规模（资金比例），0-1之间，如 0.15 表示使用15%的资金'),
  maxShares: z.number().int().positive().describe('最大单次买入数量（股数），建议 100-1000 之间'),
  signalSensitivity: z.number().min(0).max(1).describe('信号灵敏度，0-1之间，越高越敏感，建议 0.2-0.5'),
  rsiBuyThreshold: z.number().min(0).max(100).describe('RSI 买入阈值，0-100，当 RSI 低于此值时考虑买入'),
  rsiSellThreshold: z.number().min(0).max(100).describe('RSI 卖出阈值，0-100，当 RSI 高于此值时考虑卖出'),
  isRandomTrade: z.boolean().describe('是否使用随机交易策略，true=随机买卖，false=基于技术指标分析'),
  randomBuyProbability: z.number().min(0).max(1).optional().describe('随机买入概率（仅当 isRandomTrade 为 true 时有效），0-1之间'),
  randomSellProbability: z.number().min(0).max(1).optional().describe('随机卖出概率（仅当 isRandomTrade 为 true 时有效），0-1之间'),
  reasoning: z.string().describe('策略解释，说明为什么这样配置，包括策略特点、适用场景等'),
});

// POST: 解析用户描述生成策略配置
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { description } = body;
    
    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '缺少策略描述',
        },
        { status: 400 }
      );
    }
    
    console.log('🤖 开始解析策略描述:', description.substring(0, 100) + '...');
    
    // 使用 generateObject 生成策略配置
    const { object: strategyConfig } = await generateObject({
      model: deepseek('deepseek-chat'),
      schema: strategySchema,
      system: '你是一个专业的股票交易策略分析师。根据用户的自然语言描述，生成完整的交易策略配置JSON。确保所有参数符合实际交易逻辑，股票代码必须是真实存在的 A 股代码。注意：玩家名称必须在末尾添加"(玩家)"后缀。',
      prompt: `根据用户描述生成股票交易策略配置JSON。

用户描述: ${description}

返回的JSON必须包含以下字段：
- playerName: 玩家名称（字符串，必须在末尾加上"(玩家)"后缀，例如："激进科技(玩家)"）
- stockPool: 股票代码数组（字符串数组，如 ["600519", "000858"]），必须是真实的 A 股代码
- buyThreshold: 买入阈值（数字，涨跌幅百分比，如 2.0）
- sellThreshold: 卖出阈值（数字，涨跌幅百分比，如 -1.5）
- positionSize: 持仓规模（数字，0-1之间，如 0.15）
- maxShares: 最大买入数量（正整数，如 150）
- signalSensitivity: 信号灵敏度（数字，0-1之间，如 0.3）
- rsiBuyThreshold: RSI买入阈值（数字，0-100，如 40）
- rsiSellThreshold: RSI卖出阈值（数字，0-100，如 65）
- isRandomTrade: 是否随机交易（布尔值，true 或 false）
- randomBuyProbability: 随机买入概率（数字，0-1之间，可选，仅在isRandomTrade=true时需要）
- randomSellProbability: 随机卖出概率（数字，0-1之间，可选，仅在isRandomTrade=true时需要）
- reasoning: 策略解释（字符串）

不满足schema需求的回答都是错误的

参数建议：
- 激进策略：buyThreshold 0.5-1.5%，sellThreshold -0.5%到-1%，positionSize 0.2-0.4，signalSensitivity 0.15-0.3，isRandomTrade=true
- 稳健策略：buyThreshold 2-3%，sellThreshold -1.5%到-2%，positionSize 0.1-0.2，signalSensitivity 0.3-0.5，isRandomTrade=false
- 保守策略：buyThreshold 3-5%，sellThreshold -2%到-3%，positionSize 0.05-0.1，signalSensitivity 0.4-0.6，isRandomTrade=false

请严格按照上述字段结构生成JSON。`,
    });
    
    // 确保 playerName 末尾有 "(玩家)" 后缀
    if (!strategyConfig.playerName.endsWith('(玩家)')) {
      strategyConfig.playerName = `${strategyConfig.playerName}(玩家)`;
    }
    
    console.log('✅ 策略配置生成成功:', strategyConfig.playerName);
    
    return NextResponse.json({
      success: true,
      data: {
        strategyConfig,
      },
    });
  } catch (error) {
    console.error('❌ 解析策略描述失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: '解析策略描述失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

