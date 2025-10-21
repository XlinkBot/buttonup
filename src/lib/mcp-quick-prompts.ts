/**
 * Quick prompts for MCP demo
 * These are predefined prompts that users can click to quickly test different tools
 */

export const QUICK_PROMPTS = [
  {
    id: 'quote-aapl',
    title: '查询 AAPL 实时报价',
    prompt: '获取苹果公司(AAPL)的实时股票报价信息',
    category: 'quote',
  },
  {
    id: 'tech-indicators-tsla',
    title: '查询 TSLA 技术指标',
    prompt: '分析特斯拉(TSLA)的技术指标，包括RSI、EMA、Bollinger Bands等',
    category: 'indicators',
  },
  {
    id: 'basic-info-msft',
    title: '查询 MSFT 基本信息',
    prompt: '获取微软(MSFT)的基本信息，包括公司简介、行业、市场表现等',
    category: 'basic',
  },
  {
    id: 'financial-nvda',
    title: '查询 NVDA 财务报告',
    prompt: '分析英伟达(NVDA)的财务报告，包括收入、净利润、ROE等关键指标',
    category: 'financial',
  },
  {
    id: 'historical-googl',
    title: '查询 GOOGL 历史数据',
    prompt: '获取谷歌(GOOGL)过去30天的历史股价数据，用于技术分析',
    category: 'historical',
  },
  {
    id: 'compare-stocks',
    title: '对比多只股票',
    prompt: '比较苹果(AAPL)、微软(MSFT)、谷歌(GOOGL)这三只科技股的基本面指标和股价表现',
    category: 'comparison',
  },
  {
    id: 'macro-index',
    title: '查询宏观指数',
    prompt: '获取标普500指数(^GSPC)的实时数据和最近的表现',
    category: 'macro',
  },
  {
    id: 'sentiment-analysis',
    title: '市场情绪分析',
    prompt: '分析特斯拉(TSLA)的市场情绪，包括投资者看法和市场热度',
    category: 'sentiment',
  },
] as const;

export type QuickPromptCategory =
  | 'quote'
  | 'indicators'
  | 'basic'
  | 'financial'
  | 'historical'
  | 'comparison'
  | 'macro'
  | 'sentiment';

export type QuickPrompt = (typeof QUICK_PROMPTS)[number];

/**
 * Get prompts by category
 */
export function getPromptsByCategory(
  category: QuickPromptCategory
): QuickPrompt[] {
  return QUICK_PROMPTS.filter((prompt) => prompt.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): QuickPromptCategory[] {
  const categories = new Set<QuickPromptCategory>();
  QUICK_PROMPTS.forEach((prompt) => {
    categories.add(prompt.category);
  });
  return Array.from(categories);
}

/**
 * Category display names for UI
 */
export const CATEGORY_LABELS: Record<QuickPromptCategory, string> = {
  quote: '实时报价',
  indicators: '技术指标',
  basic: '基本信息',
  financial: '财务数据',
  historical: '历史数据',
  comparison: '对比分析',
  macro: '宏观经济',
  sentiment: '市场情绪',
};
