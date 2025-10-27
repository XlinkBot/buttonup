import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

interface StockData {
  Symbol: string;
  ShortName: string;
  IndustryName: string;
  PROVINCE: string;
  CITY: string;
  MAINBUSSINESS: string;
  Validated_Symbol: string;
}

// 缓存股票数据以提高性能
let stockDataCache: StockData[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

async function loadStockData(): Promise<StockData[]> {
  const now = Date.now();
  
  // 如果缓存存在且未过期，直接返回缓存
  if (stockDataCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return stockDataCache;
  }

  return new Promise((resolve, reject) => {
    const csvPath = path.join(process.cwd(), 'src/app/api/stock/symbol-lookup/stock_data_processed.csv');
    const results: StockData[] = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data: StockData) => {
        results.push(data);
      })
      .on('end', () => {
        stockDataCache = results;
        cacheTimestamp = now;
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const symbol = searchParams.get('symbol');

    if (!query && !symbol) {
      return NextResponse.json(
        { error: '请提供查询参数 q (股票名称) 或 symbol (股票代码)' },
        { status: 400 }
      );
    }

    const stockData = await loadStockData();
    let results: StockData[] = [];

    if (query) {
      // 根据股票名称搜索 (包含匹配)
      results = stockData.filter(stock => 
        stock.ShortName.toLowerCase().includes(query.toLowerCase())
      );
    } else if (symbol) {
      // 根据股票代码搜索 (精确匹配)
      results = stockData.filter(stock => 
        stock.Symbol === symbol
      );
    }

    if (results.length === 0) {
      return NextResponse.json(
        { 
          message: '未找到匹配的股票',
          results: []
        },
        { status: 404 }
      );
    }

    // 返回匹配结果，包含Validated_Symbol
    const response = results.map(stock => ({
      symbol: stock.Symbol,
      shortName: stock.ShortName,
      industryName: stock.IndustryName,
      province: stock.PROVINCE,
      city: stock.CITY,
      mainBusiness: stock.MAINBUSSINESS,
      validatedSymbol: stock.Validated_Symbol
    }));

    return NextResponse.json({
      message: `找到 ${results.length} 个匹配结果`,
      count: results.length,
      results: response
    });

  } catch (error) {
    console.error('股票符号查询API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, symbol } = body;

    if (!query && !symbol) {
      return NextResponse.json(
        { error: '请提供查询参数 query (股票名称) 或 symbol (股票代码)' },
        { status: 400 }
      );
    }

    const stockData = await loadStockData();
    let results: StockData[] = [];

    if (query) {
      // 根据股票名称搜索 (包含匹配)
      results = stockData.filter(stock => 
        stock.ShortName.toLowerCase().includes(query.toLowerCase())
      );
    } else if (symbol) {
      // 根据股票代码搜索 (精确匹配)
      results = stockData.filter(stock => 
        stock.Symbol === symbol
      );
    }

    if (results.length === 0) {
      return NextResponse.json(
        { 
          message: '未找到匹配的股票',
          results: []
        },
        { status: 404 }
      );
    }

    // 返回匹配结果，包含Validated_Symbol
    const response = results.map(stock => ({
      symbol: stock.Symbol,
      shortName: stock.ShortName,
      industryName: stock.IndustryName,
      province: stock.PROVINCE,
      city: stock.CITY,
      mainBusiness: stock.MAINBUSSINESS,
      validatedSymbol: stock.Validated_Symbol
    }));

    return NextResponse.json({
      message: `找到 ${results.length} 个匹配结果`,
      count: results.length,
      results: response
    });

  } catch (error) {
    console.error('股票符号查询API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
