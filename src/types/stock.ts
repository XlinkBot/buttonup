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
