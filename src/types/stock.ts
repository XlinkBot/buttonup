export interface StockQuote {
  symbol: string;
  longName?: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketOpen?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  trailingPE?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  fullExchangeName?: string;
  exchange?: string;
  marketState?: string;
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockData {
  symbol: string;
  quote: StockQuote;
  historical: HistoricalData[];
}

export interface SearchStock {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
  market?: string;
}

// 1. 基本信息接口 (getBasicInfo)
export interface BasicInfo {
  symbol: string;
  longName?: string;
  industry?: string;
  sector?: string;
  country?: string;
  marketCap?: number;
  trailingPE?: number;
  priceToBook?: number;
  bookValue?: number;
  beta?: number;
  forwardPE?: number;
  fiftyTwoWeekChange?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  website?: string;
  description?: string;
}

// 2. 实时行情接口 (getStockQuote)
export interface RealTimeQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  previousClose: number;
  open: number;
}

// 3. 历史行情接口 (getHistoricalData)
export interface HistoricalQuote {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface HistoricalDataResponse {
  symbol: string;
  period: 'daily' | 'weekly' | 'monthly';
  data: HistoricalQuote[];
}

// 4. 财务数据接口 (getFinancialReport)
export interface FinancialReport {
  symbol: string;
  period: 'annual' | 'quarterly';
  fiscalDate: string;
  revenue?: number;
  netIncome?: number;
  operatingCashFlow?: number;
  freeCashFlow?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  stockholdersEquity?: number;
  roe?: number; // Return on Equity
  roa?: number; // Return on Assets
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  currentRatio?: number;
  debtToEquity?: number;
  eps?: number; // Earnings Per Share
  revenueGrowth?: number;
  earningsGrowth?: number;
  fcfGrowth?: number;
}

export interface FinancialReportResponse {
  symbol: string;
  reports: FinancialReport[];
}

// 5. 技术指标接口 (getTechIndicators)
export interface TechIndicators {
  symbol: string;
  date: string;
  macd?: {
    value: number;
    signal: number;
    histogram: number;
  };
  rsi?: number; // Relative Strength Index
  ema?: {
    ema12?: number;
    ema26?: number;
    ema50?: number;
    ema200?: number;
  };
  sma?: {
    sma20?: number;
    sma50?: number;
    sma200?: number;
  };
  bb?: {
    upper: number;
    middle: number;
    lower: number;
  }; // Bollinger Bands
  stoch?: {
    k: number;
    d: number;
  }; // Stochastic
  adx?: number; // Average Directional Index
  cci?: number; // Commodity Channel Index
  atr?: number; // Average True Range
}

export interface TechIndicatorsResponse {
  symbol: string;
  period: string;
  indicators: TechIndicators[];
}

// 6. 市场情绪与资金流向接口 (getMarketSentiment)
export interface FundFlow {
  date: string;
  largeOutflow: number;
  largeBuyAmount: number;
  largeOutflowAmount: number;
  netFlow: number; // positive: inflow, negative: outflow
}

export interface MarginData {
  date: string;
  marginBuy: number; // 融资买入金额
  marginSell: number; // 融券卖出金额
  marginBalance: number; // 融资融券余额
}

export interface MarketSentiment {
  symbol: string;
  sentimentScore: number; // -100 to 100
  fundFlows: FundFlow[];
  marginData: MarginData[];
  northboundFlow?: number; // 北向资金流向 (for CN stocks)
  institutionalBuying?: number; // 机构买入占比
  retailSentiment?: string; // 'bullish' | 'neutral' | 'bearish'
}

// 7. 重大事件与新闻接口 (getEventsNews)
export interface CompanyEvent {
  date: string;
  eventType: 'dividend' | 'split' | 'buyback' | 'earnings' | 'other';
  description: string;
  details?: Record<string, unknown>;
}

export interface NewsArticle {
  title: string;
  summary?: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface EventsNews {
  symbol: string;
  events: CompanyEvent[];
  news: NewsArticle[];
}

// 8. 宏观经济与板块指数接口 (getMacroIndex)
export interface MacroData {
  indicator: string;
  value: number;
  date: string;
  previousValue?: number;
  unit?: string;
}

export interface IndexQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export interface MacroIndex {
  indexSymbol: string;
  currentQuote: IndexQuote;
  sectorPerformance?: Array<{
    sector: string;
    performance: number;
    companies: number;
  }>;
  macroData?: MacroData[];
  correlations?: Array<{
    symbol: string;
    correlation: number;
  }>;
}

// 9. 策略回测与模拟接口 (runStrategyBacktest)
export interface BacktestStrategy {
  name: string;
  parameters: Record<string, unknown>;
  // Example: { movingAveragePeriod: 50, threshold: 2.0 }
}

export interface BacktestResult {
  symbol: string;
  strategy: BacktestStrategy;
  startDate: string;
  endDate: string;
  initialCapital: number;
  finalValue: number;
  totalReturn: number; // percentage
  annualizedReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  trades: Array<{
    entryDate: string;
    exitDate: string;
    entryPrice: number;
    exitPrice: number;
    profit: number;
    profitPercent: number;
  }>;
  equityCurve: Array<{
    date: string;
    value: number;
  }>;
}

// 10. 用户与身份认证接口 (OAuth2.0)
export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

export interface UserProfile {
  userId: string;
  email: string;
  username: string;
  createdAt: string;
  preferences?: {
    watchlist?: string[];
    alerts?: Array<{
      symbol: string;
      priceTarget?: number;
      percentChange?: number;
    }>;
    portfolios?: Array<{
      name: string;
      stocks: Array<{ symbol: string; quantity: number }>;
    }>;
  };
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: number;
}

// Comparison interface
export interface StockComparison {
  symbols: string[];
  quote: Record<string, RealTimeQuote>;
  financial: Record<string, FinancialReport>;
  metrics?: Record<string, Record<string, number>>;
}
