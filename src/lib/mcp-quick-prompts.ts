/**
 * Quick prompts for MCP demo
 * These are predefined prompts that users can click to quickly test different tools
 */

export const QUICK_PROMPTS = [
  {
    id: 'quote-pingan',
    title: '查询平安银行实时报价',
    prompt: '获取平安银行(000001)的实时股票报价信息',
    category: 'quote',
  },
  {
    id: 'tech-indicators-wanke',
    title: '查询万科A技术指标',
    prompt: '分析万科A(000002)的技术指标，包括RSI、EMA、Bollinger Bands等',
    category: 'indicators',
  },
  {
    id: 'basic-info-baoan',
    title: '查询中国宝安基本信息',
    prompt: '获取中国宝安(000009)的基本信息，包括公司简介、行业、市场表现等',
    category: 'basic',
  },
  {
    id: 'financial-shenzhen',
    title: '查询深振业A财务报告',
    prompt: '分析深振业A(000006)的财务报告，包括收入、净利润、ROE等关键指标',
    category: 'financial',
  },
  {
    id: 'historical-guohua',
    title: '查询ST国华历史数据',
    prompt: '获取ST国华(000004)过去30天的历史股价数据，用于技术分析',
    category: 'historical',
  },
  {
    id: 'compare-stocks',
    title: '对比多只股票',
    prompt: '比较平安银行(000001)、万科A(000002)、中国宝安(000009)这三只股票的基本面指标和股价表现',
    category: 'comparison',
  },
  {
    id: 'macro-shanghai',
    title: '查询上证指数',
    prompt: '获取上证指数(000001.SS)的实时报价信息',
    category: 'macro',
  },
  {
    id: 'macro-shenzhen',
    title: '查询深证成指',
    prompt: '获取深证成指(399001.SZ)的实时报价信息',
    category: 'macro',
  },
  {
    id: 'macro-shanghai50',
    title: '查询上证50指数',
    prompt: '获取上证50指数(000016.SS)的实时报价信息',
    category: 'macro',
  },
  {
    id: 'macro-hushen300',
    title: '查询沪深300指数',
    prompt: '获取沪深300指数(000300.SS)的实时报价信息',
    category: 'macro',
  },
  {
    id: 'macro-chuangyeban',
    title: '查询创业板指数',
    prompt: '获取创业板指数(399006.SZ)的实时报价信息',
    category: 'macro',
  },
  {
    id: 'macro-zhongzheng500',
    title: '查询中证500指数',
    prompt: '获取中证500指数(000905.SS)的实时报价信息',
    category: 'macro',
  },
  {
    id: 'macro-zhongzheng1000',
    title: '查询中证1000指数',
    prompt: '获取中证1000指数(000852.SS)的实时报价信息',
    category: 'macro',
  },
  {
    id: 'sentiment-analysis',
    title: '市场情绪分析',
    prompt: '分析万科A(000002)的市场情绪，包括投资者看法和市场热度',
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
