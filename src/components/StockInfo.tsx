'use client';

import { StockData } from '@/types/stock';

interface StockInfoProps {
  stockData: StockData;
}

export function StockInfo({ stockData }: StockInfoProps) {
  const { quote } = stockData;
  
  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatMarketCap = (marketCap: number | undefined) => {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const changePercent = quote?.regularMarketChangePercent || 0;
  const isPositive = changePercent >= 0;

  return (
    <div className="space-y-4">
      {/* Company Name & Symbol */}
      <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {quote?.longName || quote?.shortName || stockData.symbol}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {stockData.symbol} • {quote?.fullExchangeName || quote?.exchange}
        </p>
      </div>

      {/* Price Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${formatNumber(quote?.regularMarketPrice)}
          </div>
          <div className={`text-sm font-medium ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {isPositive ? '+' : ''}{formatNumber(quote?.regularMarketChange)} 
            ({isPositive ? '+' : ''}{formatNumber(changePercent)}%)
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">开盘:</span>
            <span className="text-gray-900 dark:text-white">
              ${formatNumber(quote?.regularMarketOpen)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">最高:</span>
            <span className="text-gray-900 dark:text-white">
              ${formatNumber(quote?.regularMarketDayHigh)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">最低:</span>
            <span className="text-gray-900 dark:text-white">
              ${formatNumber(quote?.regularMarketDayLow)}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-600 pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">市值:</span>
          <span className="text-gray-900 dark:text-white">
            {formatMarketCap(quote?.marketCap)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">P/E 比率:</span>
          <span className="text-gray-900 dark:text-white">
            {formatNumber(quote?.trailingPE)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">成交量:</span>
          <span className="text-gray-900 dark:text-white">
            {quote?.regularMarketVolume?.toLocaleString() || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">52周范围:</span>
          <span className="text-gray-900 dark:text-white text-xs">
            ${formatNumber(quote?.fiftyTwoWeekLow)} - ${formatNumber(quote?.fiftyTwoWeekHigh)}
          </span>
        </div>
      </div>

      {/* Market Status */}
      <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          quote?.marketState === 'REGULAR' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
        }`}>
          {quote?.marketState === 'REGULAR' ? '🟢 交易中' : '🔴 休市'}
        </span>
      </div>
    </div>
  );
}
