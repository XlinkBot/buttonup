import yahooFinance from 'yahoo-finance2';
import type {
  BasicInfo,
  RealTimeQuote,
  HistoricalDataResponse,
  HistoricalQuote,
  FinancialReportResponse,
  FinancialReport,
  TechIndicatorsResponse,
  TechIndicators,
  MarketSentiment,
  FundFlow,
  EventsNews,
  CompanyEvent,
  NewsArticle,
  MacroIndex,
  IndexQuote,
  BacktestResult,
  BacktestStrategy,
} from '@/types/stock';

// Cache configuration
const CACHE_DURATIONS = {
  QUOTE: 60 * 1000, // 1 minute
  HISTORICAL: 60 * 60 * 1000, // 1 hour
  FINANCIAL: 24 * 60 * 60 * 1000, // 24 hours
  INDICATORS: 60 * 60 * 1000, // 1 hour
} as const;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class StockAnalysisCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
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
  }
}

const cache = new StockAnalysisCache();

// 1. 基本信息接口 (getBasicInfo)
export async function getBasicInfo(symbol: string): Promise<BasicInfo> {
  try {
    const cacheKey = `basic_${symbol}`;
    const cached = cache.get<BasicInfo>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const quote = await yahooFinance.quote(symbol);
    
    const basicInfo: BasicInfo = {
      symbol,
      longName: quote.longName,
      industry: (quote as Record<string, unknown>).industry as string | undefined,
      sector: (quote as Record<string, unknown>).sector as string | undefined,
      country: (quote as Record<string, unknown>).country as string | undefined,
      marketCap: quote.marketCap,
      trailingPE: quote.trailingPE,
      priceToBook: quote.priceToBook,
      bookValue: quote.bookValue,
      beta: quote.beta,
      forwardPE: quote.forwardPE,
      fiftyTwoWeekChange: (quote as Record<string, unknown>).fiftyTwoWeekChange as number | undefined,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      averageVolume: (quote as Record<string, unknown>).averageVolume as number | undefined,
      website: (quote as Record<string, unknown>).website as string | undefined,
      description: `Stock: ${quote.longName}`,
    };

    cache.set(cacheKey, basicInfo, CACHE_DURATIONS.FINANCIAL);
    return basicInfo;
  } catch (error) {
    console.error(`Error fetching basic info for ${symbol}:`, error);
    throw new Error(`Failed to fetch basic info for ${symbol}`);
  }
}

// 2. 实时行情接口 (getStockQuote)
export async function getStockQuote(symbol: string): Promise<RealTimeQuote> {
  try {
    const cacheKey = `quote_${symbol}`;
    const cached = cache.get<RealTimeQuote>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const quote = await yahooFinance.quote(symbol);
    
    const realTimeQuote: RealTimeQuote = {
      symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      timestamp: Date.now(),
      dayHigh: quote.regularMarketDayHigh || 0,
      dayLow: quote.regularMarketDayLow || 0,
      volume: quote.regularMarketVolume || 0,
      bid: quote.bid,
      ask: quote.ask,
      bidSize: quote.bidSize,
      askSize: quote.askSize,
      previousClose: quote.regularMarketPreviousClose || 0,
      open: quote.regularMarketOpen || 0,
    };

    cache.set(cacheKey, realTimeQuote, CACHE_DURATIONS.QUOTE);
    return realTimeQuote;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw new Error(`Failed to fetch quote for ${symbol}`);
  }
}

// 3. 历史行情接口 (getHistoricalData)
export async function getHistoricalData(
  symbol: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  days: number = 30
): Promise<HistoricalDataResponse> {
  try {
    const cacheKey = `historical_${symbol}_${period}_${days}`;
    const cached = cache.get<HistoricalDataResponse>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: period === 'daily' ? '1d' : period === 'weekly' ? '1wk' : '1mo',
    });

    const data: HistoricalQuote[] = result.map((item) => ({
      date: item.date.toISOString().split('T')[0],
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
      adjClose: item.adjClose,
    }));

    const response: HistoricalDataResponse = {
      symbol,
      period,
      data,
    };

    cache.set(cacheKey, response, CACHE_DURATIONS.HISTORICAL);
    return response;
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    throw new Error(`Failed to fetch historical data for ${symbol}`);
  }
}

// 4. 财务数据接口 (getFinancialReport)
export async function getFinancialReport(
  symbol: string
): Promise<FinancialReportResponse> {
  try {
    const cacheKey = `financial_${symbol}`;
    const cached = cache.get<FinancialReportResponse>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const quote = await yahooFinance.quote(symbol);
    const quoteRecord = quote as Record<string, unknown>;
    
    const reports: FinancialReport[] = [];
    
    // Create a sample financial report from available data
    const financialReport: FinancialReport = {
      symbol,
      period: 'annual',
      fiscalDate: new Date().toISOString().split('T')[0],
      revenue: quoteRecord.totalRevenue as number | undefined,
      netIncome: quoteRecord.netIncomeToCommon as number | undefined,
      totalAssets: quoteRecord.totalAssets as number | undefined,
      totalLiabilities: quoteRecord.totalLiab as number | undefined,
      stockholdersEquity: quoteRecord.totalStockholderEquity as number | undefined,
      roe: quoteRecord.returnOnEquity as number | undefined,
      eps: quoteRecord.trailingEps as number | undefined,
    };

    reports.push(financialReport);

    const response: FinancialReportResponse = {
      symbol,
      reports,
    };

    cache.set(cacheKey, response, CACHE_DURATIONS.FINANCIAL);
    return response;
  } catch (error) {
    console.error(`Error fetching financial report for ${symbol}:`, error);
    throw new Error(`Failed to fetch financial report for ${symbol}`);
  }
}

// 5. 技术指标接口 (getTechIndicators)
export async function getTechIndicators(
  symbol: string,
  period: string = 'daily'
): Promise<TechIndicatorsResponse> {
  try {
    const cacheKey = `indicators_${symbol}_${period}`;
    const cached = cache.get<TechIndicatorsResponse>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const historical = await getHistoricalData(symbol, 'daily', 200);
    
    // Calculate technical indicators from historical data
    const indicators: TechIndicators[] = [];
    
    if (historical.data.length > 0) {
      const latestData = historical.data[historical.data.length - 1];
      
      // Calculate simple RSI approximation
      const rsi = calculateRSI(historical.data);
      
      // Calculate EMAs
      const emas = calculateEMAs(historical.data);
      
      // Calculate SMAs
      const smas = calculateSMAs(historical.data);
      
      // Calculate Bollinger Bands
      const bb = calculateBollingerBands(historical.data);
      
      const indicator: TechIndicators = {
        symbol,
        date: latestData.date,
        rsi,
        ema: emas,
        sma: smas,
        bb,
      };
      
      indicators.push(indicator);
    }

    const response: TechIndicatorsResponse = {
      symbol,
      period,
      indicators,
    };

    cache.set(cacheKey, response, CACHE_DURATIONS.INDICATORS);
    return response;
  } catch (error) {
    console.error(`Error fetching indicators for ${symbol}:`, error);
    throw new Error(`Failed to fetch indicators for ${symbol}`);
  }
}

// 6. 市场情绪与资金流向接口 (getMarketSentiment)
export async function getMarketSentiment(symbol: string): Promise<MarketSentiment> {
  try {
    const cacheKey = `sentiment_${symbol}`;
    const cached = cache.get<MarketSentiment>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const quote = await yahooFinance.quote(symbol);
    
    // Generate mock fund flow data
    const fundFlows: FundFlow[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      fundFlows.push({
        date: date.toISOString().split('T')[0],
        largeOutflow: Math.random() * 10000000,
        largeBuyAmount: Math.random() * 15000000,
        largeOutflowAmount: Math.random() * 5000000,
        netFlow: (Math.random() - 0.5) * 20000000,
      });
    }

    const sentimentScore = quote.regularMarketChangePercent
      ? Math.min(100, Math.max(-100, quote.regularMarketChangePercent * 10))
      : 0;

    const sentiment: MarketSentiment = {
      symbol,
      sentimentScore,
      fundFlows,
      marginData: [],
      institutionalBuying: Math.random() * 100,
      retailSentiment:
        sentimentScore > 10 ? 'bullish' : sentimentScore < -10 ? 'bearish' : 'neutral',
    };

    cache.set(cacheKey, sentiment, CACHE_DURATIONS.INDICATORS);
    return sentiment;
  } catch (error) {
    console.error(`Error fetching sentiment for ${symbol}:`, error);
    throw new Error(`Failed to fetch sentiment for ${symbol}`);
  }
}

// 7. 重大事件与新闻接口 (getEventsNews)
export async function getEventsNews(symbol: string): Promise<EventsNews> {
  try {
    const cacheKey = `news_${symbol}`;
    const cached = cache.get<EventsNews>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const quote = await yahooFinance.quote(symbol);
    const quoteRecord = quote as Record<string, unknown>;
    
    const events: CompanyEvent[] = [];
    
    // Add sample events
    const dividendDate = quoteRecord.dividendDate as number | undefined;
    if (dividendDate) {
      events.push({
        date: new Date(dividendDate * 1000).toISOString().split('T')[0],
        eventType: 'dividend',
        description: `Dividend announced`,
      });
    }

    const earningsDate = quoteRecord.earningsDate as number | number[] | undefined;
    if (earningsDate) {
      const earningsDateValue = Array.isArray(earningsDate) ? earningsDate[0] : earningsDate;
      events.push({
        date: new Date(earningsDateValue * 1000).toISOString().split('T')[0],
        eventType: 'earnings',
        description: 'Earnings announcement',
      });
    }

    const news: NewsArticle[] = [];
    
    // Mock news articles
    const newsHeadlines = [
      'Company reports strong quarterly earnings',
      'Industry analyst upgrades rating to buy',
      'New product launch announced',
      'Strategic partnership announced',
      'Market expansion into new regions',
    ];

    for (let i = 0; i < 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      news.push({
        title: newsHeadlines[i % newsHeadlines.length],
        source: 'Financial News',
        url: '#',
        publishedAt: date.toISOString(),
        sentiment: Math.random() > 0.3 ? 'positive' : 'neutral',
      });
    }

    const result: EventsNews = {
      symbol,
      events,
      news,
    };

    cache.set(cacheKey, result, CACHE_DURATIONS.FINANCIAL);
    return result;
  } catch (error) {
    console.error(`Error fetching events/news for ${symbol}:`, error);
    throw new Error(`Failed to fetch events/news for ${symbol}`);
  }
}

// 8. 宏观经济与板块指数接口 (getMacroIndex)
export async function getMacroIndex(indexSymbol: string): Promise<MacroIndex> {
  try {
    const cacheKey = `macro_${indexSymbol}`;
    const cached = cache.get<MacroIndex>(cacheKey);
    if (cached && cache.isValid(cacheKey)) return cached;

    const quote = await yahooFinance.quote(indexSymbol);
    
    const currentQuote: IndexQuote = {
      symbol: indexSymbol,
      name: quote.longName || indexSymbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      timestamp: Date.now(),
    };

    const macroIndex: MacroIndex = {
      indexSymbol,
      currentQuote,
      sectorPerformance: [
        { sector: 'Technology', performance: Math.random() * 10 - 5, companies: 45 },
        { sector: 'Healthcare', performance: Math.random() * 10 - 5, companies: 32 },
        { sector: 'Finance', performance: Math.random() * 10 - 5, companies: 25 },
      ],
    };

    cache.set(cacheKey, macroIndex, CACHE_DURATIONS.QUOTE);
    return macroIndex;
  } catch (error) {
    console.error(`Error fetching macro index for ${indexSymbol}:`, error);
    throw new Error(`Failed to fetch macro index for ${indexSymbol}`);
  }
}

// 9. 策略回测与模拟接口 (runStrategyBacktest)
export async function runStrategyBacktest(
  symbol: string,
  strategy: BacktestStrategy,
  startDate: Date,
  endDate: Date,
  initialCapital: number = 10000
): Promise<BacktestResult> {
  try {
    const historical = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    // Simple moving average crossover strategy
    const params = strategy.parameters as Record<string, unknown>;
    const fastPeriod = (params.fastMA as number) || 20;
    const slowPeriod = (params.slowMA as number) || 50;

    let balance = initialCapital;
    let shares = 0;
    const trades: BacktestResult['trades'] = [];
    const equityCurve: BacktestResult['equityCurve'] = [];

    let entryPrice = 0;
    let entryDate = '';
    let inPosition = false;

    for (let i = Math.max(fastPeriod, slowPeriod); i < historical.length; i++) {
      const fastMA = calculateMA(historical, i, fastPeriod);
      const slowMA = calculateMA(historical, i, slowPeriod);
      const currentPrice = historical[i].close;
      const currentDate = historical[i].date.toISOString().split('T')[0];

      // Buy signal
      if (fastMA > slowMA && !inPosition && balance >= currentPrice) {
        shares = Math.floor(balance / currentPrice);
        balance -= shares * currentPrice;
        entryPrice = currentPrice;
        entryDate = currentDate;
        inPosition = true;
      }

      // Sell signal
      if (fastMA < slowMA && inPosition) {
        const exitPrice = currentPrice;
        const profit = (exitPrice - entryPrice) * shares;
        balance += shares * exitPrice;
        
        trades.push({
          entryDate,
          exitDate: currentDate,
          entryPrice,
          exitPrice,
          profit,
          profitPercent: ((exitPrice - entryPrice) / entryPrice) * 100,
        });

        shares = 0;
        inPosition = false;
      }

      const portfolioValue = balance + shares * currentPrice;
      equityCurve.push({
        date: currentDate,
        value: portfolioValue,
      });
    }

    const finalValue = balance + shares * historical[historical.length - 1].close;
    const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
    const maxDrawdown = calculateMaxDrawdown(equityCurve);
    const sharpeRatio = calculateSharpeRatio(equityCurve);

    const result: BacktestResult = {
      symbol,
      strategy,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      initialCapital,
      finalValue: Math.round(finalValue * 100) / 100,
      totalReturn: Math.round(totalReturn * 100) / 100,
      annualizedReturn: Math.round((totalReturn / 365) * 100) / 100,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      sharpeRatio: Math.round(sharpeRatio * 100) / 100,
      winRate:
        trades.length > 0
          ? Math.round(
              ((trades.filter((t) => t.profit > 0).length / trades.length) * 100 * 100) /
                100
            )
          : 0,
      trades,
      equityCurve,
    };

    return result;
  } catch (error) {
    console.error(`Error running backtest for ${symbol}:`, error);
    throw new Error(`Failed to run backtest for ${symbol}`);
  }
}

// Helper functions for technical analysis
function calculateRSI(data: HistoricalQuote[], period: number = 14): number {
  if (data.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = data.length - period; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  const rs = avgGain / (avgLoss || 1);
  const rsi = 100 - 100 / (1 + rs);

  return Math.round(rsi * 100) / 100;
}

function calculateEMAs(data: HistoricalQuote[]) {
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

function calculateSMAs(data: HistoricalQuote[]) {
  const calculate = (period: number): number => {
    if (data.length < period) return data[data.length - 1].close;
    
    const sum = data.slice(-period).reduce((acc, d) => acc + d.close, 0);
    return Math.round((sum / period) * 100) / 100;
  };

  return {
    sma20: calculate(20),
    sma50: calculate(50),
    sma200: calculate(200),
  };
}

function calculateBollingerBands(data: HistoricalQuote[], period: number = 20) {
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

function calculateMA(
  data: Array<{ close: number }>,
  index: number,
  period: number
): number {
  if (index < period) return data[index].close;
  
  const sum = data.slice(index - period, index).reduce((acc, d) => acc + d.close, 0);
  return sum / period;
}

function calculateMaxDrawdown(equityCurve: Array<{ value: number }>): number {
  let maxValue = equityCurve[0].value;
  let maxDrawdown = 0;

  for (const point of equityCurve) {
    if (point.value > maxValue) {
      maxValue = point.value;
    }
    const drawdown = (maxValue - point.value) / maxValue;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown * 100;
}

function calculateSharpeRatio(equityCurve: Array<{ value: number }>): number {
  if (equityCurve.length < 2) return 0;

  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push(
      (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value
    );
  }

  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const sharpeRatio = (meanReturn / (stdDev || 1)) * Math.sqrt(252);

  return sharpeRatio;
}

export function clearCache(): void {
  cache.clear();
}
