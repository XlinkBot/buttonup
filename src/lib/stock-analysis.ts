import yahooFinance from 'yahoo-finance2';
import stockData from './symboldata/stock_data_processed.json';
import type {
  RealTimeQuote,
  TechIndicators,
  TechIndicatorsResponse,
} from '@/types/stock';

interface StockData {
  Symbol: number;
  ShortName: string;
  IndustryName: string;
  PROVINCE: string;
  CITY: string;
  MAINBUSSINESS: string;
  Validated_Symbol: string | null;
}

// 简化的缓存配置 - 专注于回测数据
const CACHE_DURATIONS = {
  QUOTE: 10 * 1000, // 10秒 - 实时行情
  HISTORICAL: 4 * 60 * 60 * 1000, // 4小时 - 历史数据
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class StockAnalysisCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private stats = { hits: 0, misses: 0 };

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return entry.data;
  }

  set<T>(key: string, data: T, duration: number): void {
    this.cache.set(key, { data, timestamp: Date.now() + duration });
  }

  isValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return entry.timestamp > Date.now();
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? (this.stats.hits / total * 100).toFixed(1) + '%' : '0%',
      size: this.cache.size,
    };
  }
}

const cache = new StockAnalysisCache();

// 股票数据缓存
let stockDataCache: StockData[] | null = null;
let stockDataCacheTimestamp: number = 0;
const STOCK_DATA_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

async function loadStockData(): Promise<StockData[]> {
  const now = Date.now();
  
  if (stockDataCache && (now - stockDataCacheTimestamp) < STOCK_DATA_CACHE_DURATION) {
    return stockDataCache;
  }

  stockDataCache = stockData as StockData[];
  stockDataCacheTimestamp = now;
  return stockDataCache;
}

// 股票代码验证和转换 - 简化版本
export async function validateAndConvertSymbol(symbol: string): Promise<string> {
  try {
    const stockData = await loadStockData();
      
      // 如果已经有后缀，直接使用
      if (symbol.includes('.')) {
      return symbol;
    }
    
    // 查找匹配的股票
    const result = stockData.find(stock => 
        stock.Symbol.toString() === symbol.toString().replace(/^0+/, '')
      );
    
      if (result) {
      return result.Validated_Symbol || result.Symbol.toString();
    }
    
    // 如果没找到，返回原始symbol
    return symbol;
    } catch {
      console.error('验证股票代码时出错');
      return symbol;
    }
}

// 核心回测功能：获取历史数据用于Redis缓存
export async function getHistoricalDataForBacktest(
  symbol: string,
  startTime: number,
  endTime: number
): Promise<RealTimeQuote[]> {
  try {
    const validatedSymbol = await validateAndConvertSymbol(symbol);
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    console.log(`📈 加载 ${symbol} 历史数据: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // 优先使用小时数据（最多2年），如果失败则使用日线数据
    let result;
    try {
      result = await yahooFinance.chart(validatedSymbol, {
        period1: startDate,
        period2: endDate,
        interval: '1h', // 使用小时数据
      });
      
      if (result && result.quotes && result.quotes.length > 0) {
        result = result.quotes;
      } else {
        throw new Error('No hourly data available');
          }
        } catch {
      console.warn(`小时数据获取失败，回退到日线数据: ${symbol}`);
      result = await yahooFinance.historical(validatedSymbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d', // 回退到日线数据
      });
    }

    if (!result || result.length === 0) {
      console.warn(`未找到 ${symbol} 的历史数据`);
      return [];
    }

    // 转换为RealTimeQuote格式
    const quotes: RealTimeQuote[] = result.map((item: Record<string, unknown>) => ({
      symbol: validatedSymbol,
      price: item.close as number,
      change: (item.close as number) - (item.open as number),
      changePercent: ((item.close as number) - (item.open as number)) / (item.open as number) * 100,
      volume: (item.volume as number) || 0,
      dayHigh: item.high as number,
      dayLow: item.low as number,
      open: item.open as number,
      previousClose: item.open as number,
      timestamp: item.date instanceof Date ? item.date.getTime() : new Date(item.date as string).getTime(),
    }));

    console.log(`📈 成功获取 ${symbol} 的 ${quotes.length} 条历史数据`);
    return quotes;
    } catch {
      console.error(`获取 ${symbol} 历史数据失败`);
      return [];
    }
}

// 获取技术指标 - 通用版本
export async function getTechIndicators(symbol: string, period: string = 'daily'): Promise<TechIndicatorsResponse> {
  try {
    const validatedSymbol = await validateAndConvertSymbol(symbol);
    
    // 获取当前时间
    const now = new Date();
    const endTime = now.getTime();
    const startTime = endTime - (30 * 24 * 60 * 60 * 1000); // 30天前
    
    console.log(`📊 获取 ${symbol} 技术指标 (${period})`);
    
    // 获取历史数据
    let result;
    try {
      result = await yahooFinance.chart(validatedSymbol, {
        period1: new Date(startTime),
        period2: new Date(endTime),
        interval: period === 'daily' ? '1d' : '1h',
      });
      
      if (result && result.quotes && result.quotes.length > 0) {
        result = result.quotes;
      } else {
        throw new Error('No data available');
          }
    } catch {
      console.warn(`获取 ${symbol} 数据失败，回退到日线数据`);
      result = await yahooFinance.historical(validatedSymbol, {
        period1: new Date(startTime),
        period2: new Date(endTime),
        interval: '1d',
      });
    }

    if (!result || result.length < 50) {
      console.warn(`数据不足，无法计算技术指标: ${symbol}`);
      return {
      symbol: validatedSymbol,
        period,
        indicators: [],
      };
    }

    // 转换数据格式
    const historicalData = result.map((item: Record<string, unknown>) => ({
      date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date as string,
      open: (item.open as number) ?? (item.close as number),
      high: (item.high as number) ?? (item.close as number),
      low: (item.low as number) ?? (item.close as number),
      close: item.close as number,
      volume: (item.volume as number) ?? 0,
      adjClose: (item.adjClose as number) ?? (item.close as number),
    }));

    // 获取Yahoo Finance API提供的移动平均线数据
    let yahooMA: { sma50?: number; sma200?: number } = {};
    try {
      const quote = await yahooFinance.quote(validatedSymbol);
      yahooMA = {
        sma50: quote.fiftyDayAverage,
        sma200: quote.twoHundredDayAverage,
      };
    } catch {
      console.warn(`获取Yahoo Finance移动平均线失败，使用计算值: ${symbol}`);
    }
    
    // 计算技术指标
    const indicators: TechIndicators[] = [];
    
    // 计算RSI (14期)
    const rsi = calculateRSI(historicalData, 14);
    
    // 计算EMA
    const emas = calculateEMAs(historicalData);
    
    // 使用Yahoo Finance API提供的SMA，如果没有则计算
    const smas = {
      sma20: calculateSMA(historicalData, 20),
      sma50: yahooMA.sma50 || calculateSMA(historicalData, 50),
      sma200: yahooMA.sma200 || calculateSMA(historicalData, 200),
    };
    
    // 计算布林带
    const bb = calculateBollingerBands(historicalData, 20);
    
    const latestData = historicalData[historicalData.length - 1];
    
    const indicator: TechIndicators = {
      symbol: validatedSymbol,
      date: latestData.date,
      rsi: rsi || undefined,
      ema: {
        ema12: emas.ema12 || undefined,
        ema26: emas.ema26 || undefined,
      },
      sma: {
        sma20: smas.sma20 || undefined,
        sma50: smas.sma50 || undefined,
      },
      bb: bb.upper && bb.middle && bb.lower ? {
        upper: bb.upper,
        middle: bb.middle,
        lower: bb.lower,
      } : undefined,
    };
    
    indicators.push(indicator);

    console.log(`📊 成功计算 ${symbol} 的技术指标`);
    return {
      symbol: validatedSymbol,
      period,
      indicators,
    };
  } catch {
    console.error(`计算 ${symbol} 技术指标失败`);
    return {
      symbol,
      period,
      indicators: [],
    };
  }
}

// 获取技术指标用于回测 - 优化版本，使用Yahoo Finance API提供的移动平均线
export async function getTechIndicatorsForBacktest(
  symbol: string,
  startTime: number,
  endTime: number
): Promise<TechIndicators[]> {
  try {
    const validatedSymbol = await validateAndConvertSymbol(symbol);
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    console.log(`📊 加载 ${symbol} 技术指标: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // 获取历史数据
    let result;
    try {
      result = await yahooFinance.chart(validatedSymbol, {
      period1: startDate,
      period2: endDate,
        interval: '1h', // 使用小时数据
      });
      
      if (result && result.quotes && result.quotes.length > 0) {
        result = result.quotes;
      } else {
        throw new Error('No hourly data available');
      }
  } catch {
      console.warn(`小时数据获取失败，回退到日线数据: ${symbol}`);
      result = await yahooFinance.historical(validatedSymbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d', // 回退到日线数据
      });
    }

    if (!result || result.length < 50) {
      console.warn(`数据不足，无法计算技术指标: ${symbol}`);
      return [];
    }

    // 转换数据格式
    const historicalData = result.map((item: Record<string, unknown>) => ({
      date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date as string,
      open: (item.open as number) ?? (item.close as number),
      high: (item.high as number) ?? (item.close as number),
      low: (item.low as number) ?? (item.close as number),
      close: item.close as number,
      volume: (item.volume as number) ?? 0,
      adjClose: (item.adjClose as number) ?? (item.close as number),
    }));

    // 获取Yahoo Finance API提供的移动平均线数据
    let yahooMA: { sma50?: number; sma200?: number } = {};
    try {
      const quote = await yahooFinance.quote(validatedSymbol);
      yahooMA = {
        sma50: quote.fiftyDayAverage,
        sma200: quote.twoHundredDayAverage,
      };
      console.log(`📊 使用Yahoo Finance API提供的移动平均线: SMA50=${yahooMA.sma50}, SMA200=${yahooMA.sma200}`);
  } catch {
      console.warn(`获取Yahoo Finance移动平均线失败，使用计算值: ${symbol}`);
    }
    
    // 计算技术指标
    const indicators: TechIndicators[] = [];
    
    // 计算RSI (14期) - 仍需自行计算
    const rsi = calculateRSI(historicalData, 14);
    
    // 计算EMA - 仍需自行计算
    const emas = calculateEMAs(historicalData);
    
    // 使用Yahoo Finance API提供的SMA，如果没有则计算
    const smas = {
      sma20: calculateSMA(historicalData, 20), // 仍需计算20日SMA
      sma50: yahooMA.sma50 || calculateSMA(historicalData, 50), // 优先使用API数据
      sma200: yahooMA.sma200 || calculateSMA(historicalData, 200), // 优先使用API数据
    };
    
    // 计算布林带 - 仍需自行计算
    const bb = calculateBollingerBands(historicalData, 20);
    
    const latestData = historicalData[historicalData.length - 1];
    
    const indicator: TechIndicators = {
      symbol: validatedSymbol,
      date: latestData.date,
      rsi: rsi || undefined,
      ema: {
        ema12: emas.ema12 || undefined,
        ema26: emas.ema26 || undefined,
      },
      sma: {
        sma20: smas.sma20 || undefined,
        sma50: smas.sma50 || undefined,
      },
      bb: bb.upper && bb.middle && bb.lower ? {
        upper: bb.upper,
        middle: bb.middle,
        lower: bb.lower,
      } : undefined,
    };
    
    indicators.push(indicator);

    console.log(`📊 成功计算 ${symbol} 的技术指标 (使用Yahoo Finance API移动平均线)`);
    return indicators;
    } catch {
      console.error(`计算 ${symbol} 技术指标失败`);
      return [];
    }
}

// 获取高级技术分析数据 - 使用Insights模块
export async function getAdvancedTechnicalAnalysis(symbol: string): Promise<{
  support: number | null;
  resistance: number | null;
  stopLoss: number | null;
  shortTermOutlook: string | null;
  intermediateTermOutlook: string | null;
  longTermOutlook: string | null;
  valuation: string | null;
} | null> {
  try {
    const validatedSymbol = await validateAndConvertSymbol(symbol);
    const cacheKey = `insights_${validatedSymbol}`;
    
    // 检查缓存
    const cached = cache.get<{
      support: number | null;
      resistance: number | null;
      stopLoss: number | null;
      shortTermOutlook: string | null;
      intermediateTermOutlook: string | null;
      longTermOutlook: string | null;
      valuation: string | null;
    }>(cacheKey);
    
      if (cached && cache.isValid(cacheKey)) {
      console.log(`📊 使用缓存的Insights数据: ${symbol}`);
      return cached;
    }

    console.log(`🔍 获取 ${symbol} 高级技术分析数据...`);
    
    const insights = await yahooFinance.insights(validatedSymbol);
    
    if (!insights || !insights.instrumentInfo) {
      console.warn(`未找到 ${symbol} 的Insights数据`);
      return null;
    }

    const result = {
      support: insights.instrumentInfo.keyTechnicals?.support || null,
      resistance: insights.instrumentInfo.keyTechnicals?.resistance || null,
      stopLoss: insights.instrumentInfo.keyTechnicals?.stopLoss || null,
      shortTermOutlook: insights.instrumentInfo.technicalEvents?.shortTermOutlook?.direction || null,
      intermediateTermOutlook: insights.instrumentInfo.technicalEvents?.intermediateTermOutlook?.direction || null,
      longTermOutlook: insights.instrumentInfo.technicalEvents?.longTermOutlook?.direction || null,
      valuation: insights.instrumentInfo.valuation?.description || null,
    };

    // 缓存结果 (1小时)
    cache.set(cacheKey, result, CACHE_DURATIONS.QUOTE);
    
    console.log(`✅ 成功获取 ${symbol} 高级技术分析数据`);
    return result;
    } catch {
      console.error(`获取 ${symbol} 高级技术分析失败`);
      return null;
    }
}

// 获取基本面数据 - 使用QuoteSummary模块
export async function getFundamentalData(symbol: string): Promise<{
  financialData: Record<string, unknown> | null;
  defaultKeyStatistics: Record<string, unknown> | null;
  balanceSheetHistory: Record<string, unknown> | null;
  incomeStatementHistory: Record<string, unknown> | null;
} | null> {
  try {
    const validatedSymbol = await validateAndConvertSymbol(symbol);
    const cacheKey = `fundamental_${validatedSymbol}`;
    
    // 检查缓存
    const cached = cache.get<{
      financialData: Record<string, unknown> | null;
      defaultKeyStatistics: Record<string, unknown> | null;
      balanceSheetHistory: Record<string, unknown> | null;
      incomeStatementHistory: Record<string, unknown> | null;
    }>(cacheKey);
    
    if (cached && cache.isValid(cacheKey)) {
      console.log(`📊 使用缓存的基本面数据: ${symbol}`);
      return cached;
    }

    console.log(`💰 获取 ${symbol} 基本面数据...`);
    
    const result = await yahooFinance.quoteSummary(validatedSymbol, {
      modules: [
        'financialData',           // 核心财务指标
        'defaultKeyStatistics',   // 关键统计数据
        'balanceSheetHistory',     // 资产负债表
        'incomeStatementHistory'  // 损益表
      ]
    });

    if (!result) {
      console.warn(`未找到 ${symbol} 的基本面数据`);
      return null;
    }

    const fundamentalData = {
      financialData: result.financialData || null,
      defaultKeyStatistics: result.defaultKeyStatistics || null,
      balanceSheetHistory: result.balanceSheetHistory || null,
      incomeStatementHistory: result.incomeStatementHistory || null,
    };

    // 缓存结果 (4小时)
    cache.set(cacheKey, fundamentalData, CACHE_DURATIONS.HISTORICAL);
    
    console.log(`✅ 成功获取 ${symbol} 基本面数据`);
    return fundamentalData;
    } catch {
      console.error(`获取 ${symbol} 基本面数据失败`);
      return null;
    }
}

// 获取市场情绪数据 - 使用QuoteSummary模块
export async function getMarketSentiment(symbol: string): Promise<{
  analystRating: string | null;
  recommendationMean: number | null;
  numberOfAnalystOpinions: number | null;
  institutionOwnership: Record<string, unknown> | null;
  insiderTransactions: Record<string, unknown> | null;
} | null> {
  try {
    const validatedSymbol = await validateAndConvertSymbol(symbol);
    const cacheKey = `sentiment_${validatedSymbol}`;
    
    // 检查缓存
    const cached = cache.get<{
      analystRating: string | null;
      recommendationMean: number | null;
      numberOfAnalystOpinions: number | null;
      institutionOwnership: Record<string, unknown> | null;
      insiderTransactions: Record<string, unknown> | null;
    }>(cacheKey);
    
    if (cached && cache.isValid(cacheKey)) {
      console.log(`📊 使用缓存的市场情绪数据: ${symbol}`);
      return cached;
    }

    console.log(`📈 获取 ${symbol} 市场情绪数据...`);
    
    const result = await yahooFinance.quoteSummary(validatedSymbol, {
      modules: [
        'financialData',           // 分析师评级
        'institutionOwnership',    // 机构持股
        'insiderTransactions',     // 内部交易
        'recommendationTrend'      // 推荐趋势
      ]
    });

    if (!result) {
      console.warn(`未找到 ${symbol} 的市场情绪数据`);
      return null;
    }

    const sentimentData = {
      analystRating: result.financialData?.recommendationKey || null,
      recommendationMean: result.financialData?.recommendationMean || null,
      numberOfAnalystOpinions: result.financialData?.numberOfAnalystOpinions || null,
      institutionOwnership: result.institutionOwnership || null,
      insiderTransactions: ((result as Record<string, unknown>).insiderTransactions as Record<string, unknown>) || null,
    };

    // 缓存结果 (4小时)
    cache.set(cacheKey, sentimentData, CACHE_DURATIONS.HISTORICAL);
    
    console.log(`✅ 成功获取 ${symbol} 市场情绪数据`);
    return sentimentData;
    } catch {
      console.error(`获取 ${symbol} 市场情绪数据失败`);
      return null;
    }
}

// 综合股票分析数据 - 整合所有分析维度
export async function getComprehensiveAnalysis(symbol: string): Promise<{
  price: Record<string, unknown>;
  technical: Record<string, unknown>;
  advanced: Record<string, unknown> | null;
  fundamental: Record<string, unknown> | null;
  sentiment: Record<string, unknown> | null;
} | null> {
  try {
    console.log(`🔍 开始综合分析 ${symbol}...`);
    
    // 并行获取所有数据
    const [quote, advanced, fundamental, sentiment] = await Promise.all([
      yahooFinance.quote(await validateAndConvertSymbol(symbol)),
      getAdvancedTechnicalAnalysis(symbol),
      getFundamentalData(symbol),
      getMarketSentiment(symbol)
    ]);

    if (!quote) {
      console.warn(`未找到 ${symbol} 的实时数据`);
      return null;
    }

    const analysis = {
      price: {
        currentPrice: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        dayHigh: quote.regularMarketDayHigh,
        dayLow: quote.regularMarketDayLow,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        marketCap: quote.marketCap,
      },
      technical: {
        sma50: quote.fiftyDayAverage,
        sma200: quote.twoHundredDayAverage,
        pe: quote.trailingPE,
        forwardPE: quote.forwardPE,
        pb: quote.priceToBook,
        dividendYield: (quote as Record<string, unknown>).dividendYield as number | undefined,
      },
      advanced: advanced,
      fundamental: fundamental,
      sentiment: sentiment,
    };

    console.log(`✅ 完成 ${symbol} 综合分析`);
    return analysis;
    } catch {
      console.error(`综合分析 ${symbol} 失败`);
      return null;
    }
}

// 技术指标计算函数
function calculateRSI(data: Array<{ close: number }>, period: number = 14): number {
  if (data.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  // 计算初始平均收益和损失
  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100; // 如果只有收益，RSI为100
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return Math.round(rsi * 100) / 100;
}

function calculateEMAs(data: Array<{ close: number }>) {
  const calculate = (period: number): number => {
    if (data.length < period) return data[data.length - 1].close;
    
    const k = 2 / (period + 1);
    let ema = data[0].close;
    
    for (let i = 1; i < data.length; i++) {
      ema = data[i].close * k + ema * (1 - k);
    }
    
    return Math.round(ema * 100) / 100;
  };

  return {
    ema12: calculate(12),
    ema26: calculate(26),
    ema50: calculate(50),
    ema200: calculate(200),
  };
}

// 单独的SMA计算函数
function calculateSMA(data: Array<{ close: number }>, period: number): number {
    if (data.length < period) return data[data.length - 1].close;
    
    const sum = data.slice(-period).reduce((acc, d) => acc + d.close, 0);
    return Math.round((sum / period) * 100) / 100;
}

function calculateBollingerBands(data: Array<{ close: number }>, period: number = 20) {
  if (data.length < period) {
    const lastClose = data[data.length - 1].close;
    return { upper: lastClose, middle: lastClose, lower: lastClose };
  }

  const lastData = data.slice(-period);
  const sum = lastData.reduce((acc, d) => acc + d.close, 0);
  const sma = sum / period;

  const variance =
    lastData.reduce((acc, d) => acc + Math.pow(d.close - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: Math.round((sma + stdDev * 2) * 100) / 100,
    middle: Math.round(sma * 100) / 100,
    lower: Math.round((sma - stdDev * 2) * 100) / 100,
  };
}

// 简单的宏观经济指数接口 - 用于Arena游戏
export async function getMacroIndex(indexSymbol: string, useCache: boolean = true): Promise<{
  indexSymbol: string;
  currentQuote: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    timestamp: number;
  };
}> {
  try {
    const cacheKey = `macro_${indexSymbol}`;
    const cached = cache.get<{
      indexSymbol: string;
      currentQuote: {
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
        timestamp: number;
      };
    }>(cacheKey);
    if (useCache && cached && cache.isValid(cacheKey)) return cached;

    const quote = await yahooFinance.quote(indexSymbol);
    
    const currentQuote = {
      symbol: indexSymbol,
      name: quote.longName || indexSymbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      timestamp: Date.now(),
    };

    const macroIndex = {
      indexSymbol,
      currentQuote,
    };

    cache.set(cacheKey, macroIndex, CACHE_DURATIONS.QUOTE);
    return macroIndex;
  } catch (error) {
    console.error(`Error fetching macro index for ${indexSymbol}:`, error);
    throw new Error(`Failed to fetch macro index for ${indexSymbol}`);
  }
}

// 批量获取股票实时行情接口 - 用于Arena游戏
export async function getBatchStockQuotes(symbols: string[]): Promise<Array<{
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  open: number;
  previousClose: number;
}>> {
  if (symbols.length === 0) return [];
  
  try {
    // 验证和转换股票代码
    const validatedSymbols: string[] = [];
    const symbolMap = new Map<string, string>();
    
    for (const symbol of symbols) {
      let validatedSymbol = symbol;
      
      if (!symbol.includes('.')) {
        try {
          validatedSymbol = await validateAndConvertSymbol(symbol);
        } catch (error) {
          console.warn(`Failed to validate symbol ${symbol}:`, error);
        }
      }
      
      validatedSymbols.push(validatedSymbol);
      symbolMap.set(symbol, validatedSymbol);
    }
    
    // 去重
    const uniqueSymbols = [...new Set(validatedSymbols)];
    
    console.log(`📈 Fetching batch quotes for ${uniqueSymbols.length} stocks:`, uniqueSymbols);
    
    // 批量获取股票行情
    const quotes = await yahooFinance.quote(uniqueSymbols);
    
    // 处理结果
    const results: Array<{
      symbol: string;
      price: number;
      change: number;
      changePercent: number;
      timestamp: number;
      dayHigh: number;
      dayLow: number;
      volume: number;
      open: number;
      previousClose: number;
    }> = [];
    
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
    
    for (let i = 0; i < quotesArray.length; i++) {
      const quote = quotesArray[i];
      const originalSymbol = Array.from(symbolMap.keys()).find(key => symbolMap.get(key) === uniqueSymbols[i]);
      
      if (quote && quote.regularMarketPrice !== undefined) {
        results.push({
          symbol: originalSymbol || uniqueSymbols[i],
          price: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          timestamp: Date.now(),
          dayHigh: quote.regularMarketDayHigh || 0,
          dayLow: quote.regularMarketDayLow || 0,
          volume: quote.regularMarketVolume || 0,
          open: quote.regularMarketOpen || 0,
          previousClose: quote.regularMarketPreviousClose || 0,
        });
      } else {
        // 如果获取失败，返回默认值
        results.push({
          symbol: originalSymbol || uniqueSymbols[i],
          price: 0,
          change: 0,
          changePercent: 0,
          timestamp: Date.now(),
          dayHigh: 0,
          dayLow: 0,
          volume: 0,
          open: 0,
          previousClose: 0,
        });
      }
    }
    
    console.log(`📈 Successfully fetched quotes for ${results.length} stocks`);
    return results;
  } catch (error) {
    console.error('Error fetching batch stock quotes:', error);
    
    // 返回默认值
    return symbols.map(symbol => ({
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      timestamp: Date.now(),
      dayHigh: 0,
      dayLow: 0,
      volume: 0,
      open: 0,
      previousClose: 0,
    }));
  }
}

// 缓存管理函数
export function clearCache(): void {
  cache.clear();
}

export function getCacheStats() {
  return cache.getStats();
}