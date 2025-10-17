import {
  getBasicInfo,
  getStockQuote,
  getHistoricalData,
  getFinancialReport,
  getTechIndicators,
  getMarketSentiment,
  getEventsNews,
  getMacroIndex,
  runStrategyBacktest,
} from './stock-analysis';
import type {
  BasicInfo,
  RealTimeQuote,
  HistoricalDataResponse,
  FinancialReportResponse,
  TechIndicatorsResponse,
  MarketSentiment,
  EventsNews,
  MacroIndex,
  BacktestResult,
  BacktestStrategy,
} from '@/types/stock';

// MCP Message Types
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse<T = unknown> {
  jsonrpc: '2.0';
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
  };
}

// Stock Analysis Tool Definitions
export const STOCK_TOOLS: MCPTool[] = [
  {
    name: 'getBasicInfo',
    description: 'Get basic company information including industry, sector, market cap, PE, PB ratios',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getStockQuote',
    description: 'Get real-time stock quote including price, change, volume, bid/ask',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getHistoricalData',
    description: 'Get historical price data for a stock',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
        period: {
          type: 'string',
          enum: ['daily', 'weekly', 'monthly'],
          description: 'Time period for data',
        },
        days: { type: 'number', description: 'Number of days of historical data' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getFinancialReport',
    description: 'Get financial data including revenue, earnings, assets, liabilities, ROE, margins',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getTechIndicators',
    description: 'Get technical indicators including RSI, MACD, EMA, SMA, Bollinger Bands',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
        period: { type: 'string', description: 'Period for indicators (default: daily)' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getMarketSentiment',
    description: 'Get market sentiment data including fund flows, margin data, retail sentiment',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getEventsNews',
    description: 'Get company events (dividends, earnings, buybacks) and news articles',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'getMacroIndex',
    description: 'Get macro index data including sector performance and economic indicators',
    inputSchema: {
      type: 'object',
      properties: {
        indexSymbol: { type: 'string', description: 'Index ticker symbol (e.g., ^GSPC)' },
      },
      required: ['indexSymbol'],
    },
  },
  {
    name: 'runStrategyBacktest',
    description:
      'Run strategy backtest to evaluate trading strategy performance with historical data',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Stock ticker symbol' },
        strategy: {
          type: 'object',
          description: 'Strategy configuration with parameters',
        },
        startDate: { type: 'string', description: 'Backtest start date (ISO format)' },
        endDate: { type: 'string', description: 'Backtest end date (ISO format)' },
        initialCapital: { type: 'number', description: 'Initial capital for backtest' },
      },
      required: ['symbol', 'strategy', 'startDate', 'endDate'],
    },
  },
];

// MCP Handler for stock analysis requests
export async function handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
  try {
    const { method, params } = request;

    switch (method) {
      case 'getBasicInfo': {
        const symbol = params?.symbol as string;
        if (!symbol) throw new Error('symbol parameter required');
        const result = await getBasicInfo(symbol);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'getStockQuote': {
        const symbol = params?.symbol as string;
        if (!symbol) throw new Error('symbol parameter required');
        const result = await getStockQuote(symbol);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'getHistoricalData': {
        const symbol = params?.symbol as string;
        const period = (params?.period as 'daily' | 'weekly' | 'monthly') || 'daily';
        const days = (params?.days as number) || 30;
        if (!symbol) throw new Error('symbol parameter required');
        const result = await getHistoricalData(symbol, period, days);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'getFinancialReport': {
        const symbol = params?.symbol as string;
        if (!symbol) throw new Error('symbol parameter required');
        const result = await getFinancialReport(symbol);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'getTechIndicators': {
        const symbol = params?.symbol as string;
        const period = (params?.period as string) || 'daily';
        if (!symbol) throw new Error('symbol parameter required');
        const result = await getTechIndicators(symbol, period);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'getMarketSentiment': {
        const symbol = params?.symbol as string;
        if (!symbol) throw new Error('symbol parameter required');
        const result = await getMarketSentiment(symbol);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'getEventsNews': {
        const symbol = params?.symbol as string;
        if (!symbol) throw new Error('symbol parameter required');
        const result = await getEventsNews(symbol);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'getMacroIndex': {
        const indexSymbol = params?.indexSymbol as string;
        if (!indexSymbol) throw new Error('indexSymbol parameter required');
        const result = await getMacroIndex(indexSymbol);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'runStrategyBacktest': {
        const symbol = params?.symbol as string;
        const strategy = params?.strategy as BacktestStrategy;
        const startDate = new Date(params?.startDate as string);
        const endDate = new Date(params?.endDate as string);
        const initialCapital = (params?.initialCapital as number) || 10000;

        if (!symbol || !strategy) {
          throw new Error('symbol and strategy parameters required');
        }

        const result = await runStrategyBacktest(symbol, strategy, startDate, endDate, initialCapital);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result,
        };
      }

      case 'listTools': {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: STOCK_TOOLS,
        };
      }

      default:
        throw new Error(`Unknown method: ${method}`);
    }
  } catch (error) {
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: -32603,
        message: error instanceof Error ? error.message : 'Internal error',
        data: error instanceof Error ? { stack: error.stack } : undefined,
      },
    };
  }
}

// Batch request handler
export async function handleMCPBatchRequest(
  requests: MCPRequest[]
): Promise<MCPResponse[]> {
  return Promise.all(requests.map((req) => handleMCPRequest(req)));
}
