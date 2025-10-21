import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
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
} from "@/lib/stock-analysis";
import type { BacktestStrategy } from "@/types/stock";


const handler =createMcpHandler(
  (server) => {
    server.tool(
      "getBasicInfo",
      "Get basic company information including industry, sector, market cap, PE, PB ratios",
      {
        symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
      },
      async ({ symbol }) => {
        const result = await getBasicInfo(symbol);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                data: result,
                message: `Retrieved basic information for ${symbol}`,
              }, null, 2),
            },
          ],
        };
      }
    );
      server.tool(
        "getStockQuote",
        "Get real-time stock quote including price, change, volume, bid/ask",
        {
          symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
        },
        async ({ symbol }) => {
          const result = await getStockQuote(symbol);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Retrieved real-time quote for ${symbol}`,
                }, null, 2),
              },
            ],
          };
        }
      );
      server.tool(
        "getHistoricalData",
        "Get historical price data for a stock",
        {
          symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
          period: z
            .enum(["daily", "weekly", "monthly"])
            .optional()
            .describe("Time period for data (default: daily)"),
          days: z
            .number()
            .optional()
            .describe("Number of days of historical data (default: 30)"),
        },
        async ({ symbol, period = "daily", days = 30 }) => {
          const result = await getHistoricalData(symbol, period, days);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Retrieved ${days} days of ${period} historical data for ${symbol}`,
                }, null, 2),
              },
            ],
          };
        }
      );
      server.tool(
        "getFinancialReport",
        "Get financial data including revenue, earnings, assets, liabilities, ROE, margins",
        {
          symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
        },
        async ({ symbol }) => {
          const result = await getFinancialReport(symbol);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Retrieved financial report for ${symbol}`,
                }, null, 2),
              },
            ],
          };
        }
      );
      server.tool(
        "getTechIndicators",
        "Get technical indicators including RSI, EMA, SMA, Bollinger Bands",
        {
          symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
          period: z
            .string()
            .optional()
            .describe("Period for indicators (default: daily)"),
        },
        async ({ symbol, period = "daily" }) => {
          const result = await getTechIndicators(symbol, period);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Retrieved technical indicators for ${symbol}`,
                }, null, 2),
              },
            ],
          };
        }
      );
      server.tool(
        "getMarketSentiment",
        "Get market sentiment data including fund flows, margin data, retail sentiment",
        {
          symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
        },
        async ({ symbol }) => {
          const result = await getMarketSentiment(symbol);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Retrieved market sentiment for ${symbol}`,
                }, null, 2),
              },
            ],
          };
        }
      );
      server.tool(
        "getEventsNews",
        "Get company events (dividends, earnings, buybacks) and news articles",
        {
          symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
        },
        async ({ symbol }) => {
          const result = await getEventsNews(symbol);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Retrieved events and news for ${symbol}`,
                }, null, 2),
              },
            ],
          };
        }
      );
      server.tool(
        "getMacroIndex",
        "Get macro index data including sector performance and economic indicators",
        {
          indexSymbol: z
            .string()
            .describe("Index ticker symbol (e.g., ^GSPC, ^IXIC, ^DJI)"),
        },
        async ({ indexSymbol }) => {
          const result = await getMacroIndex(indexSymbol);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Retrieved macro index data for ${indexSymbol}`,
                }, null, 2),
              },
            ],
          };
        }
      );
      server.tool(
        "runStrategyBacktest",
        "Run strategy backtest to evaluate trading strategy performance with historical data",
        {
          symbol: z.string().describe("Stock ticker symbol (e.g., AAPL, MSFT)"),
          strategy: z
            .object({
              type: z
                .string()
                .describe(
                  "Strategy type (e.g., sma_crossover, rsi_mean_reversion)"
                ),
              parameters: z
                .record(z.any(), z.any())
                .describe("Strategy-specific parameters"),
            })
            .describe("Trading strategy configuration"),
          startDate: z
            .string()
            .describe("Backtest start date in ISO format (YYYY-MM-DD)"),
          endDate: z
            .string()
            .describe("Backtest end date in ISO format (YYYY-MM-DD)"),
          initialCapital: z
            .number()
            .optional()
            .describe("Initial capital for backtest (default: 10000)"),
        },
        async ({
          symbol,
          strategy,
          startDate,
          endDate,
          initialCapital = 10000,
        }) => {
          const start = new Date(startDate);
          const end = new Date(endDate);
          const result = await runStrategyBacktest(
            symbol,
            strategy as unknown as BacktestStrategy,
            start,
            end,
            initialCapital
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  data: result,
                  message: `Completed backtest for ${symbol} from ${startDate} to ${endDate}`,
                }, null, 2),
              },
            ],
          };
        }
      );
  },{
  },
  {
    redisUrl: process.env.REDIS_URL,
    basePath: "/api/mcp", // this needs to match where the [transport] is located.
    maxDuration: 60,
    verboseLogs: true,
  }
   );


export { handler as GET, handler as POST };

