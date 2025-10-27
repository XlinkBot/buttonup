'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StockPriceProps {
  symbol: string;
  className?: string;
}

interface StockData {
  quote: {
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    currency?: string;
  };
}

export function StockPrice({ symbol, className = "" }: StockPriceProps) {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/stock/${symbol}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }
        
        const data = await response.json();
        setStockData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchStockData();
    }
  }, [symbol]);

  if (loading) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
        <span className="text-xs text-gray-400">加载中...</span>
      </div>
    );
  }

  if (error || !stockData?.quote) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <span className="text-xs text-gray-400">${symbol}</span>
      </div>
    );
  }

  const { regularMarketPrice, regularMarketChange, regularMarketChangePercent, currency } = stockData.quote;
  
  if (!regularMarketPrice) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <span className="text-xs text-gray-400">${symbol}</span>
      </div>
    );
  }

  const isPositive = (regularMarketChange || 0) >= 0;
  const changePercent = regularMarketChangePercent || 0;
  const currencySymbol = currency === 'USD' ? '$' : currency || '$';

  return (
    <div className={`inline-flex items-center space-x-1 text-xs ${className}`}>

      <div className={`flex items-center space-x-0.5 ${
        isPositive 
          ? 'text-green-600 dark:text-green-400' 
          : 'text-red-600 dark:text-red-400'
      }`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className="font-medium">
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>

        <span className="font-medium text-gray-900 dark:text-white">
            {currencySymbol} {regularMarketPrice.toFixed(2)}
      </span>

      </div>
    </div>
  );
}
