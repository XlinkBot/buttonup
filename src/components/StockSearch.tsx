'use client';

import { useState, useEffect, useRef } from 'react';
import { SearchStock } from '@/types/stock';

type Stock = SearchStock;

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
}

export function StockSearch({ onStockSelect }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setStocks([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setStocks(data.stocks || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error searching stocks:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleStockSelect = (stock: Stock) => {
    setQuery(`${stock.symbol} - ${stock.shortname}`);
    setShowResults(false);
    onStockSelect(stock.symbol);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索股票代码或公司名称..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-slate-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   placeholder-gray-500 dark:placeholder-gray-400"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {showResults && stocks.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {stocks.map((stock) => (
            <button
              key={stock.symbol}
              onClick={() => handleStockSelect(stock)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-600 
                       border-b border-gray-100 dark:border-gray-600 last:border-b-0
                       focus:bg-gray-50 dark:focus:bg-slate-600 focus:outline-none"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {stock.symbol}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                    {stock.shortname || stock.longname}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {stock.exchange}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && stocks.length === 0 && !isLoading && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            未找到相关股票
          </p>
        </div>
      )}
    </div>
  );
}
