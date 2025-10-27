// Redis缓存版本的回测数据缓存系统
// 适用于Next.js无状态环境

import Redis from 'ioredis';
import yahooFinance from 'yahoo-finance2';
import type { RealTimeQuote, TechIndicators } from '@/types/stock';
import type { TradingJudgment, Trade, AssetHistory, Player, BacktestSession, LeaderboardEntry, StrategyConfig, PlayerConfig } from '@/types/arena';

// Redis配置
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  db: 0,
  maxRetriesPerRequest: 3,
});

// 缓存键前缀
const CACHE_PREFIX = 'backtest:';
// 使用股票名字作为key，不包含时间范围（存储该股票的所有数据）
const QUOTES_KEY = (symbol: string) => 
  `${CACHE_PREFIX}quotes:${symbol}`;
const INDICATORS_KEY = (symbol: string) => 
  `${CACHE_PREFIX}indicators:${symbol}`;
const ADVANCED_TECHNICAL_KEY = (symbol: string) => 
  `${CACHE_PREFIX}advanced:${symbol}`;
const FUNDAMENTAL_KEY = (symbol: string) => 
  `${CACHE_PREFIX}fundamental:${symbol}`;
const SENTIMENT_KEY = (symbol: string) => 
  `${CACHE_PREFIX}sentiment:${symbol}`;
const JUDGMENTS_KEY = (playerId: string, timestamp: number) => 
  `${CACHE_PREFIX}judgments:${playerId}:${timestamp}`;
const ALL_JUDGMENTS_KEY = (timestamp: number) => 
  `${CACHE_PREFIX}all_judgments:${timestamp}`;
const TRADES_KEY = (playerId: string, timestamp: number) => 
  `${CACHE_PREFIX}trades:${playerId}:${timestamp}`;
const ALL_TRADES_KEY = (timestamp: number) => 
  `${CACHE_PREFIX}all_trades:${timestamp}`;
const ASSET_HISTORY_KEY = (playerId: string, timestamp: number) => 
  `${CACHE_PREFIX}asset_history:${playerId}:${timestamp}`;
const ALL_ASSET_HISTORY_KEY = (timestamp: number) => 
  `${CACHE_PREFIX}all_asset_history:${timestamp}`;
const PLAYERS_KEY = `${CACHE_PREFIX}players`;
const PLAYER_KEY = (playerId: string) => 
  `${CACHE_PREFIX}player:${playerId}`;
const STATUS_KEY = `${CACHE_PREFIX}status`;

// 缓存数据结构
interface CachedQuote {
  timestamp: number;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  dayHigh: number;
  dayLow: number;
  open: number;
  previousClose: number;
}

interface CachedTechIndicators {
  timestamp: number;
  symbol: string;
  rsi: number | null;
  ema: {
    ema12: number | null;
    ema26: number | null;
  } | null;
  sma: {
    sma20: number | null;
    sma50: number | null;
  } | null;
  bb: {
    upper: number;
    middle: number;
    lower: number;
  } | null;
}

interface CacheStatus {
  isLoaded: boolean;
  symbolsCount: number;
  totalQuotes: number;
  totalIndicators: number;
  loadTime: number;
  startTime: number;
  endTime: number;
}

class RedisBacktestCache {
  // 获取所有需要的数据
  async loadAllData(symbols: string[], startTime: number, endTime: number): Promise<void> {
    console.log(`🚀 开始加载回测数据到Redis缓存: ${symbols.length} 只股票`);
    console.log(`📅 时间范围: ${new Date(startTime).toISOString()} - ${new Date(endTime).toISOString()}`);
    
    const loadStartTime = Date.now();

    try {
      // 1. 检查是否已经有数据了（避免重复加载）
      console.log('🔍 检查Redis中是否已有数据...');
      const existingDataKeys = await redis.keys(`${CACHE_PREFIX}quotes:*`);
      const hasData = existingDataKeys.length > 0;
      
      if (hasData) {
        console.log(`⚠️ Redis中已存在 ${existingDataKeys.length} 个缓存key，跳过加载`);
        console.log(`💡 提示：如需重新加载数据，请先点击Reset或清空缓存`);
        
        // 更新status但不要重新加载数据
        const status: CacheStatus = {
          isLoaded: true,
          symbolsCount: existingDataKeys.length,
          totalQuotes: 0, // 不统计，避免重复计算
          totalIndicators: 0,
          loadTime: 0,
          startTime,
          endTime,
        };
        await redis.setex(STATUS_KEY, 3600, JSON.stringify(status));
        console.log(`✅ 跳过预加载，使用现有缓存`);
        return;
      }
      
      // 2. 清理旧的股票数据缓存（保留players和status）
      console.log('🗑️ 开始清理旧缓存...');
      const oldQuoteKeys = await redis.keys(`${CACHE_PREFIX}quotes:*`);
      const oldIndicatorKeys = await redis.keys(`${CACHE_PREFIX}indicators:*`);
      const oldAdvancedKeys = await redis.keys(`${CACHE_PREFIX}advanced:*`);
      const oldFundamentalKeys = await redis.keys(`${CACHE_PREFIX}fundamental:*`);
      const oldSentimentKeys = await redis.keys(`${CACHE_PREFIX}sentiment:*`);
      
      const keysToDelete = [
        ...oldQuoteKeys,
        ...oldIndicatorKeys,
        ...oldAdvancedKeys,
        ...oldFundamentalKeys,
        ...oldSentimentKeys
      ];
      
      if (keysToDelete.length > 0) {
        console.log(`🗑️ 找到 ${keysToDelete.length} 个旧缓存key:`, keysToDelete);
        await redis.del(...keysToDelete);
        console.log(`✅ 清理了 ${keysToDelete.length} 个旧缓存key`);
      } else {
        console.log('✅ 没有旧缓存需要清理');
      }

      // 2. 并行加载所有股票的数据
      console.log(`📊 开始加载股票数据，symbols:`, symbols);
      const loadPromises = symbols.map(symbol => this.loadSymbolData(symbol, startTime, endTime));
      await Promise.all(loadPromises);
      console.log(`✅ 所有股票数据加载完成`);

      const loadEndTime = Date.now();
      
      // 保存缓存状态
      const status: CacheStatus = {
        isLoaded: true,
        symbolsCount: symbols.length,
        totalQuotes: await this.getTotalQuotesCount(symbols),
        totalIndicators: await this.getTotalIndicatorsCount(symbols),
        loadTime: loadEndTime - loadStartTime,
        startTime,
        endTime,
      };
      
      await redis.setex(STATUS_KEY, 3600, JSON.stringify(status)); // 1小时过期
      
      console.log(`✅ 回测数据加载到Redis完成，耗时: ${status.loadTime}ms`);
      console.log(`📊 加载统计: ${status.symbolsCount} 股票, ${status.totalQuotes} 价格, ${status.totalIndicators} 指标`);
      
      // 验证数据是否成功写入Redis
      console.log('🔍 验证Redis数据...');
      for (const symbol of symbols) {
        const formattedSymbol = this.getFormattedSymbol(symbol);
        const key = QUOTES_KEY(formattedSymbol);
        const data = await redis.get(key);
        if (data) {
          const quotes = JSON.parse(data);
          console.log(`✅ Redis验证成功: ${key}, 数据量=${quotes.length}`);
        } else {
          console.error(`❌ Redis验证失败: ${key} 不存在`);
        }
      }
      
    } catch (error) {
      console.error('❌ 回测数据加载到Redis失败:', error);
      throw error;
    }
  }

  // 辅助函数：获取格式化的symbol
  private getFormattedSymbol(symbol: string): string {
    if (!symbol.includes('.')) {
      if (symbol.startsWith('300') || symbol.startsWith('002')) {
        return symbol + '.SZ';
      } else if (symbol.startsWith('600') || symbol.startsWith('601') || symbol.startsWith('603') || symbol.startsWith('688')) {
        return symbol + '.SS';
      }
    }
    return symbol;
  }

  // 加载单个股票的所有数据
  private async loadSymbolData(symbol: string, startTime: number, endTime: number): Promise<void> {
    console.log(`📈 加载 ${symbol} 的数据到Redis...`);
    
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    try {
      // 加载价格数据
      const quotesData = await this.loadQuotesData(symbol, startDate, endDate);
      await this.saveQuotesToRedis(symbol, startTime, endTime, quotesData);
      
      // 加载技术指标数据
      const indicatorsData = await this.loadTechIndicatorsData(symbol, startDate, endDate);
      await this.saveIndicatorsToRedis(symbol, startTime, endTime, indicatorsData);
      
      // 加载高级技术分析数据 (静态数据，不依赖时间范围)
      const advancedData = await this.loadAdvancedTechnicalData(symbol);
      await this.saveAdvancedTechnicalToRedis(symbol, advancedData);
      
      // 加载基本面数据 (静态数据，不依赖时间范围)
      const fundamentalData = await this.loadFundamentalData(symbol);
      await this.saveFundamentalToRedis(symbol, fundamentalData);
      
      // 加载市场情绪数据 (静态数据，不依赖时间范围)
      const sentimentData = await this.loadMarketSentimentData(symbol);
      await this.saveMarketSentimentToRedis(symbol, sentimentData);
      
      console.log(`✅ ${symbol} 数据加载到Redis完成: ${quotesData.length} 条价格, ${indicatorsData.length} 条指标`);
      
    } catch (error) {
      console.error(`❌ ${symbol} 数据加载到Redis失败:`, error);
      throw error;
    }
  }

  // 保存价格数据到Redis（不包含时间范围参数）
  private async saveQuotesToRedis(symbol: string, startTime: number, endTime: number, quotes: CachedQuote[]): Promise<void> {
    // 从quotes数组中获取format后的symbol
    if (quotes.length === 0) {
      console.warn(`⚠️ ${symbol} 没有数据，跳过保存`);
      return;
    }
    
    const actualSymbol = quotes[0].symbol; // 使用数据中的formatted symbol
    const key = QUOTES_KEY(actualSymbol);
    console.log(`💾 保存到Redis key: ${key}, 传入symbol=${symbol}, 数据中的symbol=${actualSymbol}, 数据量=${quotes.length}`);
    const data = JSON.stringify(quotes);
    await redis.setex(key, 3600, data); // 1小时过期
    console.log(`✅ 成功保存到Redis: ${key}`);
  }

  // 保存技术指标到Redis（不包含时间范围参数）
  private async saveIndicatorsToRedis(symbol: string, startTime: number, endTime: number, indicators: CachedTechIndicators[]): Promise<void> {
    // 从indicators数组中获取format后的symbol
    if (indicators.length === 0) {
      console.warn(`⚠️ ${symbol} 没有技术指标数据，跳过保存`);
      return;
    }
    
    const actualSymbol = indicators[0].symbol; // 使用数据中的formatted symbol
    const key = INDICATORS_KEY(actualSymbol);
    console.log(`💾 保存技术指标到Redis key: ${key}, 传入symbol=${symbol}, 数据中的symbol=${actualSymbol}, 数据量=${indicators.length}`);
    const data = JSON.stringify(indicators);
    await redis.setex(key, 3600, data); // 1小时过期
    console.log(`✅ 成功保存技术指标到Redis: ${key}`);
  }

  // 从Redis获取价格数据（不包含时间范围参数）
  private async getQuotesFromRedis(symbol: string): Promise<CachedQuote[]> {
    const key = QUOTES_KEY(symbol);
    console.log(`🔍 查询Redis key: ${key}, symbol=${symbol}`);
    const data = await redis.get(key);
    if (!data) {
      console.log(`⚠️ Redis key ${key} 不存在`);
      return [];
    }
    const quotes = JSON.parse(data);
    console.log(`✅ 找到数据，长度: ${quotes.length}`);
    return quotes;
  }

  // 从Redis获取技术指标（不包含时间范围参数）
  private async getIndicatorsFromRedis(symbol: string): Promise<CachedTechIndicators[]> {
    const key = INDICATORS_KEY(symbol);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : [];
  }

  // 获取总价格数据数量
  private async getTotalQuotesCount(symbols: string[]): Promise<number> {
    let total = 0;
    for (const symbol of symbols) {
      const quotes = await this.getQuotesFromRedis(symbol);
      total += quotes.length;
    }
    return total;
  }

  // 获取总技术指标数量
  private async getTotalIndicatorsCount(symbols: string[]): Promise<number> {
    let total = 0;
    for (const symbol of symbols) {
      const indicators = await this.getIndicatorsFromRedis(symbol);
      total += indicators.length;
    }
    return total;
  }

  // 根据时间戳获取价格数据（不包含时间范围参数）
  async getQuoteAtTime(symbol: string, timestamp: number, _startTime: number, _endTime: number): Promise<RealTimeQuote | null> {
    const quotes = await this.getQuotesFromRedis(symbol);
    if (quotes.length === 0) {
      return null;
    }
    
    // 找到最接近目标时间的数据点
    let closestQuote = quotes[0];
    let minDiff = Math.abs(quotes[0].timestamp - timestamp);
    
    for (const quote of quotes) {
      const diff = Math.abs(quote.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestQuote = quote;
      }
    }
    
    console.log(`📍 找到最接近的时间点: ${new Date(closestQuote.timestamp).toISOString()}, 目标: ${new Date(timestamp).toISOString()}, 时间差: ${minDiff}ms`);
    
    return {
      symbol: closestQuote.symbol,
      price: closestQuote.price,
      change: closestQuote.change,
      changePercent: closestQuote.changePercent,
      volume: closestQuote.volume,
      dayHigh: closestQuote.dayHigh,
      dayLow: closestQuote.dayLow,
      open: closestQuote.open,
      previousClose: closestQuote.previousClose,
      timestamp: closestQuote.timestamp,
    };
  }

  // 根据时间戳获取技术指标（不包含时间范围参数）
  async getTechIndicatorsAtTime(symbol: string, timestamp: number, _startTime: number, _endTime: number): Promise<TechIndicators | null> {
    const indicators = await this.getIndicatorsFromRedis(symbol);
    if (indicators.length === 0) {
      return null;
    }
    
    // 找到最接近目标时间的数据点
    let closestIndicator = indicators[0];
    let minDiff = Math.abs(indicators[0].timestamp - timestamp);
    
    for (const indicator of indicators) {
      const diff = Math.abs(indicator.timestamp - timestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndicator = indicator;
      }
    }
    
    return {
      symbol: closestIndicator.symbol,
      date: new Date(closestIndicator.timestamp).toISOString().split('T')[0],
      rsi: closestIndicator.rsi || undefined,
      ema: closestIndicator.ema ? {
        ema12: closestIndicator.ema.ema12 || undefined,
        ema26: closestIndicator.ema.ema26 || undefined,
      } : undefined,
      sma: closestIndicator.sma ? {
        sma20: closestIndicator.sma.sma20 || undefined,
        sma50: closestIndicator.sma.sma50 || undefined,
      } : undefined,
      bb: closestIndicator.bb || undefined,
    };
  }

  // 批量获取价格数据
  async getBatchQuotesAtTime(symbols: string[], timestamp: number, startTime: number, endTime: number): Promise<RealTimeQuote[]> {
    const promises = symbols.map(symbol => this.getQuoteAtTime(symbol, timestamp, startTime, endTime));
    const results = await Promise.all(promises);
    return results.filter((quote): quote is RealTimeQuote => quote !== null);
  }

  // 批量获取技术指标
  async getBatchTechIndicatorsAtTime(symbols: string[], timestamp: number, startTime: number, endTime: number): Promise<Map<string, TechIndicators>> {
    const result = new Map<string, TechIndicators>();
    
    const promises = symbols.map(async symbol => {
      const indicators = await this.getTechIndicatorsAtTime(symbol, timestamp, startTime, endTime);
      if (indicators) {
        result.set(symbol, indicators);
      }
    });
    
    await Promise.all(promises);
    return result;
  }

  // 获取综合分析数据 - 整合所有分析维度
  async getComprehensiveAnalysisAtTime(symbol: string, timestamp: number, startTime: number, endTime: number): Promise<{
    price: RealTimeQuote | null;
    technical: TechIndicators | null;
    advanced: Record<string, unknown> | null;
    fundamental: Record<string, unknown> | null;
    sentiment: Record<string, unknown> | null;
  }> {
    try {
      console.log(`🔍 获取 ${symbol} 在 ${new Date(timestamp).toISOString()} 的综合分析数据...`);
      
      // 并行获取所有数据
      const [price, technical, advanced, fundamental, sentiment] = await Promise.all([
        this.getQuoteAtTime(symbol, timestamp, startTime, endTime),
        this.getTechIndicatorsAtTime(symbol, timestamp, startTime, endTime),
        this.getAdvancedTechnicalFromRedis(symbol),
        this.getFundamentalFromRedis(symbol),
        this.getMarketSentimentFromRedis(symbol)
      ]);

      const analysis = {
        price,
        technical,
        advanced,
        fundamental,
        sentiment,
      };

      console.log(`✅ 完成 ${symbol} 综合分析数据获取`);
      return analysis;
    } catch (error) {
      console.error(`获取 ${symbol} 综合分析数据失败:`, error);
      return {
        price: null,
        technical: null,
        advanced: null,
        fundamental: null,
        sentiment: null,
      };
    }
  }

  // 批量获取综合分析数据
  async getBatchComprehensiveAnalysisAtTime(symbols: string[], timestamp: number, startTime: number, endTime: number): Promise<Map<string, {
    price: RealTimeQuote | null;
    technical: TechIndicators | null;
    advanced: Record<string, unknown> | null;
    fundamental: Record<string, unknown> | null;
    sentiment: Record<string, unknown> | null;
  }>> {
    const result = new Map();
    
    const promises = symbols.map(async symbol => {
      const analysis = await this.getComprehensiveAnalysisAtTime(symbol, timestamp, startTime, endTime);
      result.set(symbol, analysis);
    });
    
    await Promise.all(promises);
    return result;
  }

  // 检查是否已加载
  async isDataLoaded(): Promise<boolean> {
    try {
      const statusData = await redis.get(STATUS_KEY);
      if (!statusData) return false;
      
      const status: CacheStatus = JSON.parse(statusData);
      return status.isLoaded;
    } catch (error) {
      console.error('检查Redis缓存状态失败:', error);
      return false;
    }
  }

  // 获取加载统计
  async getLoadStats(): Promise<{ loadTime: number; symbolsCount: number; totalQuotes: number; totalIndicators: number }> {
    try {
      const statusData = await redis.get(STATUS_KEY);
      if (!statusData) {
        return { loadTime: 0, symbolsCount: 0, totalQuotes: 0, totalIndicators: 0 };
      }
      
      const status: CacheStatus = JSON.parse(statusData);
      return {
        loadTime: status.loadTime,
        symbolsCount: status.symbolsCount,
        totalQuotes: status.totalQuotes,
        totalIndicators: status.totalIndicators,
      };
    } catch (error) {
      console.error('获取Redis缓存统计失败:', error);
      return { loadTime: 0, symbolsCount: 0, totalQuotes: 0, totalIndicators: 0 };
    }
  }

  // 批量保存交易判断到Redis
  async batchSaveTradingJudgments(judgments: TradingJudgment[], timestamp: number): Promise<void> {
    if (judgments.length === 0) return;
    
    try {
      console.log(`💾 保存 ${judgments.length} 个交易判断到Redis...`);
      
      // 按玩家分组保存
      const judgmentsByPlayer = new Map<string, TradingJudgment[]>();
      judgments.forEach(judgment => {
        if (!judgmentsByPlayer.has(judgment.playerId)) {
          judgmentsByPlayer.set(judgment.playerId, []);
        }
        judgmentsByPlayer.get(judgment.playerId)!.push(judgment);
      });
      
      // 并行保存每个玩家的判断
      const savePromises = Array.from(judgmentsByPlayer.entries()).map(async ([playerId, playerJudgments]) => {
        const key = JUDGMENTS_KEY(playerId, timestamp);
        const data = JSON.stringify(playerJudgments);
        await redis.setex(key, 24 * 60 * 60, data); // 24小时过期
      });
      
      // 保存所有判断的汇总
      const allJudgmentsKey = ALL_JUDGMENTS_KEY(timestamp);
      await redis.setex(allJudgmentsKey, 24 * 60 * 60, JSON.stringify(judgments));
      
      await Promise.all(savePromises);
      console.log(`✅ 成功保存 ${judgments.length} 个交易判断到Redis`);
      
    } catch (error) {
      console.error('保存交易判断到Redis失败:', error);
      throw error;
    }
  }
  
  // 从Redis获取指定玩家的交易判断
  async getTradingJudgmentsByPlayer(playerId: string, timestamp: number): Promise<TradingJudgment[]> {
    try {
      const key = JUDGMENTS_KEY(playerId, timestamp);
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`获取玩家 ${playerId} 交易判断失败:`, error);
      return [];
    }
  }
  
  // 从Redis获取所有交易判断
  async getAllTradingJudgments(timestamp: number): Promise<TradingJudgment[]> {
    try {
      const key = ALL_JUDGMENTS_KEY(timestamp);
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`获取所有交易判断失败:`, error);
      return [];
    }
  }

  // 获取玩家的所有判断（通过时间范围）
  async getPlayerJudgmentsByTimeRange(playerId: string): Promise<TradingJudgment[]> {
    try {
      console.log(`📋 获取玩家 ${playerId} 的所有判断...`);
      
      // 获取所有相关的keys
      const pattern = `${CACHE_PREFIX}judgments:${playerId}:*`;
      const keys = await redis.keys(pattern);
      
      const allJudgments: TradingJudgment[] = [];
      
      // 并行获取所有key的数据
      const dataPromises = keys.map(async (key) => {
        const data = await redis.get(key);
        if (data) {
          return JSON.parse(data) as TradingJudgment[];
        }
        return [];
      });
      
      const results = await Promise.all(dataPromises);
      results.forEach(judgments => {
        allJudgments.push(...judgments);
      });
      
      // 按时间戳排序（最新的在前）
      allJudgments.sort((a, b) => b.timestamp - a.timestamp);
      
      console.log(`✅ 获取到玩家 ${playerId} 的 ${allJudgments.length} 个判断`);
      return allJudgments;
      
    } catch (error) {
      console.error(`获取玩家 ${playerId} 的所有判断失败:`, error);
      return [];
    }
  }
  
  // 批量保存交易记录到Redis
  async batchSaveTrades(trades: Trade[], timestamp: number): Promise<void> {
    if (trades.length === 0) return;
    
    try {
      console.log(`💾 保存 ${trades.length} 个交易记录到Redis...`);
      
      // 按玩家分组保存
      const tradesByPlayer = new Map<string, Trade[]>();
      trades.forEach(trade => {
        if (!tradesByPlayer.has(trade.playerId)) {
          tradesByPlayer.set(trade.playerId, []);
        }
        tradesByPlayer.get(trade.playerId)!.push(trade);
      });
      
      // 并行保存每个玩家的交易
      const savePromises = Array.from(tradesByPlayer.entries()).map(async ([playerId, playerTrades]) => {
        const key = TRADES_KEY(playerId, timestamp);
        const data = JSON.stringify(playerTrades);
        await redis.setex(key, 24 * 60 * 60, data); // 24小时过期
      });
      
      // 保存所有交易的汇总
      const allTradesKey = ALL_TRADES_KEY(timestamp);
      await redis.setex(allTradesKey, 24 * 60 * 60, JSON.stringify(trades));
      
      await Promise.all(savePromises);
      console.log(`✅ 成功保存 ${trades.length} 个交易记录到Redis`);
      
    } catch (error) {
      console.error('保存交易记录到Redis失败:', error);
      throw error;
    }
  }
  
  // 从Redis获取指定玩家的交易记录
  async getTradesByPlayer(playerId: string, timestamp: number): Promise<Trade[]> {
    try {
      const key = TRADES_KEY(playerId, timestamp);
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`获取玩家 ${playerId} 交易记录失败:`, error);
      return [];
    }
  }
  
  // 从Redis获取所有交易记录
  async getAllTrades(timestamp: number): Promise<Trade[]> {
    try {
      const key = ALL_TRADES_KEY(timestamp);
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`获取所有交易记录失败:`, error);
      return [];
    }
  }
  
  // 批量保存资产历史到Redis
  async batchSaveAssetHistories(assetHistories: AssetHistory[], timestamp: number): Promise<void> {
    if (assetHistories.length === 0) return;
    
    try {
      console.log(`💾 保存 ${assetHistories.length} 个资产历史到Redis...`);
      
      // 按玩家分组保存
      const historiesByPlayer = new Map<string, AssetHistory[]>();
      assetHistories.forEach(history => {
        if (!historiesByPlayer.has(history.playerId)) {
          historiesByPlayer.set(history.playerId, []);
        }
        historiesByPlayer.get(history.playerId)!.push(history);
      });
      
      // 并行保存每个玩家的资产历史
      const savePromises = Array.from(historiesByPlayer.entries()).map(async ([playerId, playerHistories]) => {
        const key = ASSET_HISTORY_KEY(playerId, timestamp);
        const data = JSON.stringify(playerHistories);
        await redis.setex(key, 24 * 60 * 60, data); // 24小时过期
      });
      
      // 保存所有资产历史的汇总
      const allHistoriesKey = ALL_ASSET_HISTORY_KEY(timestamp);
      await redis.setex(allHistoriesKey, 24 * 60 * 60, JSON.stringify(assetHistories));
      
      await Promise.all(savePromises);
      console.log(`✅ 成功保存 ${assetHistories.length} 个资产历史到Redis`);
      
    } catch (error) {
      console.error('保存资产历史到Redis失败:', error);
      throw error;
    }
  }
  
  // 从Redis获取指定玩家的资产历史
  async getAssetHistoryByPlayer(playerId: string, timestamp: number): Promise<AssetHistory[]> {
    try {
      const key = ASSET_HISTORY_KEY(playerId, timestamp);
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`获取玩家 ${playerId} 资产历史失败:`, error);
      return [];
    }
  }
  
  // 从Redis获取所有资产历史
  async getAllAssetHistories(timestamp: number): Promise<AssetHistory[]> {
    try {
      const key = ALL_ASSET_HISTORY_KEY(timestamp);
      const data = await redis.get(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`获取所有资产历史失败:`, error);
      return [];
    }
  }
  
  // 初始化玩家数据到Redis
  async initializePlayers(): Promise<Player[]> {
    try {
      console.log(`🚀 初始化玩家数据到Redis...`);
      
      const initialPlayers: Player[] = [
        {
          id: 'player_0',
          name: '激进的创业板投资者',
          strategyType: 'aggressive',
          cash: 100000,
          portfolio: [],
          trades: [],
          tradingJudgments: [],
          assetHistory: [],
          totalAssets: 100000,
          totalReturn: 0,
          totalReturnPercent: 0,
          isActive: true,
          lastUpdateTime: Date.now(),
          avatar: {
            icon: '🚀',
            bgColor: '#ff6b6b',
            textColor: '#ffffff',
          },
        },
        {
          id: 'player_1',
          name: '稳健的主板投资者',
          strategyType: 'balanced',
          cash: 100000,
          portfolio: [],
          trades: [],
          tradingJudgments: [],
          assetHistory: [],
          totalAssets: 100000,
          totalReturn: 0,
          totalReturnPercent: 0,
          isActive: true,
          lastUpdateTime: Date.now(),
          avatar: {
            icon: '📈',
            bgColor: '#4ecdc4',
            textColor: '#ffffff',
          },
        },
        {
          id: 'player_2',
          name: '保守的蓝筹投资者',
          strategyType: 'conservative',
          cash: 100000,
          portfolio: [],
          trades: [],
          tradingJudgments: [],
          assetHistory: [],
          totalAssets: 100000,
          totalReturn: 0,
          totalReturnPercent: 0,
          isActive: true,
          lastUpdateTime: Date.now(),
          avatar: {
            icon: '🛡️',
            bgColor: '#45b7d1',
            textColor: '#ffffff',
          },
        },
      ];
      
      // 保存所有玩家到Redis
      await this.saveAllPlayers(initialPlayers);
      
      console.log(`✅ 成功初始化 ${initialPlayers.length} 个玩家到Redis`);
      return initialPlayers;
      
    } catch (error) {
      console.error('初始化玩家数据到Redis失败:', error);
      throw error;
    }
  }
  
  // 保存所有玩家到Redis
  async saveAllPlayers(players: Player[]): Promise<void> {
    try {
      // 保存玩家列表
      await redis.setex(PLAYERS_KEY, 24 * 60 * 60, JSON.stringify(players.map(p => p.id))); // 24小时过期
      
      // 并行保存每个玩家的详细信息
      const savePromises = players.map(async player => {
        const key = PLAYER_KEY(player.id);
        await redis.setex(key, 24 * 60 * 60, JSON.stringify(player)); // 24小时过期
      });
      
      await Promise.all(savePromises);
      console.log(`✅ 成功保存 ${players.length} 个玩家到Redis`);
      
    } catch (error) {
      console.error('保存玩家数据到Redis失败:', error);
      throw error;
    }
  }
  
  // 从Redis获取所有玩家
  async getAllPlayers(): Promise<Player[]> {
    try {
      const playerIdsData = await redis.get(PLAYERS_KEY);
      if (!playerIdsData) {
        console.log('Redis中没有玩家数据，返回空数组');
        return [];
      }
      
      const playerIds: string[] = JSON.parse(playerIdsData);
      
      // 并行获取所有玩家的详细信息
      const playerPromises = playerIds.map(async playerId => {
        const key = PLAYER_KEY(playerId);
        const data = await redis.get(key);
        return data ? JSON.parse(data) as Player : null;
      });
      
      const players = await Promise.all(playerPromises);
      const validPlayers = players.filter((player): player is Player => player !== null);
      
      console.log(`✅ 从Redis获取到 ${validPlayers.length} 个玩家`);
      return validPlayers;
      
    } catch (error) {
      console.error('从Redis获取玩家数据失败:', error);
      return [];
    }
  }
  
  // 从Redis获取指定玩家
  async getPlayer(playerId: string): Promise<Player | null> {
    try {
      const key = PLAYER_KEY(playerId);
      const data = await redis.get(key);
      return data ? JSON.parse(data) as Player : null;
    } catch (error) {
      console.error(`获取玩家 ${playerId} 失败:`, error);
      return null;
    }
  }
  
  // 更新玩家数据到Redis
  async updatePlayer(player: Player): Promise<void> {
    try {
      const key = PLAYER_KEY(player.id);
      await redis.setex(key, 24 * 60 * 60, JSON.stringify(player)); // 24小时过期
      console.log(`✅ 成功更新玩家 ${player.id} 到Redis`);
    } catch (error) {
      console.error(`更新玩家 ${player.id} 到Redis失败:`, error);
      throw error;
    }
  }
  
  // 批量更新玩家数据到Redis
  async batchUpdatePlayers(players: Player[]): Promise<void> {
    try {
      console.log(`💾 批量更新 ${players.length} 个玩家到Redis...`);
      
      // 并行更新所有玩家
      const updatePromises = players.map(player => this.updatePlayer(player));
      await Promise.all(updatePromises);
      
      // 更新玩家列表
      await redis.setex(PLAYERS_KEY, 24 * 60 * 60, JSON.stringify(players.map(p => p.id)));
      
      console.log(`✅ 成功批量更新 ${players.length} 个玩家到Redis`);
      
    } catch (error) {
      console.error('批量更新玩家数据到Redis失败:', error);
      throw error;
    }
  }
  
  // 重置玩家数据
  async resetPlayersData(): Promise<Player[]> {
    try {
      console.log(`🔄 重置玩家数据...`);
      
      // 获取现有玩家
      const existingPlayers = await this.getAllPlayers();
      
      if (existingPlayers.length === 0) {
        // 如果没有玩家，初始化新玩家
        return await this.initializePlayers();
      }
      
      // 清理所有 judgments、trades 和 asset histories
      console.log('🗑️ 清理所有judgments、trades和asset histories...');
      
      // 清理所有类型的 judgment keys
      const allJudgmentKeys = await redis.keys(`${CACHE_PREFIX}all_judgments:*`);
      const playerJudgmentKeys = await redis.keys(`${CACHE_PREFIX}judgments:*`);
      const allJudgmentKeysToDelete = [...allJudgmentKeys, ...playerJudgmentKeys];
      
      // 清理所有类型的 trade keys
      const allTradeKeys = await redis.keys(`${CACHE_PREFIX}all_trades:*`);
      const playerTradeKeys = await redis.keys(`${CACHE_PREFIX}trades:*`);
      const allTradeKeysToDelete = [...allTradeKeys, ...playerTradeKeys];
      
      // 清理所有类型的 asset history keys
      const allHistoryKeys = await redis.keys(`${CACHE_PREFIX}all_asset_history:*`);
      const playerHistoryKeys = await redis.keys(`${CACHE_PREFIX}asset_history:*`);
      const allHistoryKeysToDelete = [...allHistoryKeys, ...playerHistoryKeys];
      
      if (allJudgmentKeysToDelete.length > 0) {
        await redis.del(...allJudgmentKeysToDelete);
        console.log(`✅ 清理了 ${allJudgmentKeysToDelete.length} 个judgment keys`);
      }
      
      if (allTradeKeysToDelete.length > 0) {
        await redis.del(...allTradeKeysToDelete);
        console.log(`✅ 清理了 ${allTradeKeysToDelete.length} 个trade keys`);
      }
      
      if (allHistoryKeysToDelete.length > 0) {
        await redis.del(...allHistoryKeysToDelete);
        console.log(`✅ 清理了 ${allHistoryKeysToDelete.length} 个asset history keys`);
      }
      
      // 重置所有玩家的现金和资产
      const resetPlayers: Player[] = existingPlayers.map(player => ({
        ...player,
        cash: 100000,
        portfolio: [],
        trades: [],
        tradingJudgments: [],
        assetHistory: [],
        totalAssets: 100000,
        totalReturn: 0,
        totalReturnPercent: 0,
        lastUpdateTime: Date.now(),
      }));
      
      // 保存重置后的玩家数据
      await this.saveAllPlayers(resetPlayers);
      
      console.log(`✅ 成功重置 ${resetPlayers.length} 个玩家数据`);
      console.log(`📊 重置后的玩家数据:`, resetPlayers.map(p => ({
        id: p.id,
        name: p.name,
        cash: p.cash,
        totalAssets: p.totalAssets,
        totalReturn: p.totalReturn,
        totalReturnPercent: p.totalReturnPercent,
      })));
      
      return resetPlayers;
      
    } catch (error) {
      console.error('重置玩家数据失败:', error);
      throw error;
    }
  }
  
  // 获取Redis统计信息
  async getRedisStats(): Promise<{
    totalKeys: number;
    keysByType: Record<string, number>;
    memoryUsage: string;
    keyDetails: Record<string, {
      type: string;
      ttl: number | string;
      memoryUsage: string;
    }>;
  }> {
    try {
      // 获取所有backtest相关的键
      const allKeys = await redis.keys(`${CACHE_PREFIX}*`);
      
      // 按类型分组统计
      const keysByType: Record<string, number> = {};
      const keyDetails: Record<string, {
        type: string;
        ttl: number | string;
        memoryUsage: string;
      }> = {};
      
      for (const key of allKeys) {
        const keyType = this.getKeyType(key);
        keysByType[keyType] = (keysByType[keyType] || 0) + 1;
        
        // 获取键的详细信息
        const ttl = await redis.ttl(key);
        const type = await redis.type(key);
        
        // 尝试获取键的内存使用情况
        let memoryUsage = 'unknown';
        try {
          const size = await redis.memory('USAGE', key);
          memoryUsage = size ? `${size} bytes` : 'unknown';
        } catch {
          // 如果memory命令不支持，尝试获取字符串长度作为近似值
          if (type === 'string') {
            const value = await redis.get(key);
            memoryUsage = value ? `${value.length} chars` : 'unknown';
          }
        }
        
        keyDetails[key] = {
          type,
          ttl: ttl > 0 ? ttl : 'no-expire',
          memoryUsage,
        };
      }
      
      // 获取Redis内存使用情况
      let memoryUsage = 'unknown';
      try {
        const info = await redis.info('memory');
        const usedMemoryMatch = info.match(/used_memory:(\d+)/);
        if (usedMemoryMatch) {
          const usedMemoryBytes = parseInt(usedMemoryMatch[1]);
          memoryUsage = `${Math.round(usedMemoryBytes / 1024 / 1024)} MB`;
        }
      } catch (memoryError) {
        console.warn('无法获取Redis内存信息:', memoryError);
      }
      
      return {
        totalKeys: allKeys.length,
        keysByType,
        memoryUsage,
        keyDetails,
      };
    } catch (error) {
      console.error('获取Redis统计失败:', error);
      return {
        totalKeys: 0,
        keysByType: {},
        memoryUsage: 'error',
        keyDetails: {},
      };
    }
  }
  
  // 获取键类型
  private getKeyType(key: string): string {
    if (key.includes('players')) return 'players';
    if (key.includes('player:')) return 'player_details';
    if (key.includes('quotes:')) return 'stock_quotes';
    if (key.includes('indicators:')) return 'tech_indicators';
    if (key.includes('advanced:')) return 'advanced_technical';
    if (key.includes('fundamental:')) return 'fundamental_data';
    if (key.includes('sentiment:')) return 'market_sentiment';
    if (key.includes('judgments:')) return 'trading_judgments';
    if (key.includes('trades:')) return 'trades';
    if (key.includes('asset_history:')) return 'asset_history';
    if (key.includes('all_judgments:')) return 'all_judgments';
    if (key.includes('all_trades:')) return 'all_trades';
    if (key.includes('all_asset_history:')) return 'all_asset_history';
    if (key.includes('status')) return 'cache_status';
    return 'other';
  }

  // 清理缓存
  async clear(): Promise<void> {
    try {
      const keys = await redis.keys(`${CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      console.log('✅ Redis缓存已清理');
    } catch (error) {
      console.error('清理Redis缓存失败:', error);
    }
  }

  // 加载价格数据（与内存版本相同）
  private async loadQuotesData(symbol: string, startDate: Date, endDate: Date): Promise<CachedQuote[]> {
    try {
      console.log(`📈 加载 ${symbol} 价格数据: ${startDate.toISOString()} - ${endDate.toISOString()}`);
      
      // 转换股票代码格式
      let formattedSymbol = symbol;
      if (!symbol.includes('.')) {
        if (symbol.startsWith('300') || symbol.startsWith('002')) {
          formattedSymbol = symbol + '.SZ';
        } else if (symbol.startsWith('600') || symbol.startsWith('601') || symbol.startsWith('603') || symbol.startsWith('688')) {
          formattedSymbol = symbol + '.SS';
        }
      }
      
      console.log(`📈 转换股票代码: ${symbol} -> ${formattedSymbol}`);
      
      // 尝试获取小时数据
      try {
        const chartResult = await yahooFinance.chart(formattedSymbol, {
          period1: startDate,
          period2: endDate,
          interval: '1h',
        });
        
        if (chartResult && chartResult.quotes && chartResult.quotes.length > 0) {
          console.log(`✅ ${symbol} 小时数据: ${chartResult.quotes.length} 条`);
          return chartResult.quotes.map(quote => ({
            timestamp: quote.date.getTime(),
            symbol: formattedSymbol,
            price: quote.close || 0,
            change: (quote.close || 0) - (quote.open || 0),
            changePercent: ((quote.close || 0) - (quote.open || 0)) / (quote.open || 1) * 100,
            volume: quote.volume || 0,
            dayHigh: quote.high || 0,
            dayLow: quote.low || 0,
            open: quote.open || 0,
            previousClose: quote.open || 0,
          }));
        }
      } catch (hourlyError) {
        console.warn(`${symbol} 小时数据获取失败:`, (hourlyError as Error).message);
      }
      
      // 回退到日线数据
      console.log(`${symbol} 尝试获取日线数据...`);
      const historicalResult = await yahooFinance.historical(formattedSymbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      });
      
      if (historicalResult && historicalResult.length > 0) {
        console.log(`✅ ${symbol} 日线数据: ${historicalResult.length} 条`);
        return historicalResult.map(quote => ({
          timestamp: quote.date.getTime(),
          symbol: formattedSymbol,
          price: quote.close || 0,
          change: (quote.close || 0) - (quote.open || 0),
          changePercent: ((quote.close || 0) - (quote.open || 0)) / (quote.open || 1) * 100,
          volume: quote.volume || 0,
          dayHigh: quote.high || 0,
          dayLow: quote.low || 0,
          open: quote.open || 0,
          previousClose: quote.open || 0,
        }));
      } else {
        console.warn(`${symbol} 日线数据为空`);
        return [];
      }
      
    } catch (error) {
      console.error(`❌ 获取 ${symbol} 价格数据失败:`, error);
      return [];
    }
  }

  // 加载高级技术分析数据
  private async loadAdvancedTechnicalData(symbol: string): Promise<Record<string, unknown> | null> {
    try {
      console.log(`🔍 加载 ${symbol} 高级技术分析数据...`);
      
      // 转换股票代码格式
      let formattedSymbol = symbol;
      if (!symbol.includes('.')) {
        if (symbol.startsWith('300') || symbol.startsWith('002')) {
          formattedSymbol = symbol + '.SZ';
        } else if (symbol.startsWith('600') || symbol.startsWith('601') || symbol.startsWith('603') || symbol.startsWith('688')) {
          formattedSymbol = symbol + '.SS';
        }
      }
      
      const insights = await yahooFinance.insights(formattedSymbol);
      
      if (!insights || !insights.instrumentInfo) {
        console.warn(`未找到 ${symbol} 的Insights数据`);
        return null;
      }

      return {
        support: insights.instrumentInfo.keyTechnicals?.support || null,
        resistance: insights.instrumentInfo.keyTechnicals?.resistance || null,
        stopLoss: insights.instrumentInfo.keyTechnicals?.stopLoss || null,
        shortTermOutlook: insights.instrumentInfo.technicalEvents?.shortTermOutlook?.direction || null,
        intermediateTermOutlook: insights.instrumentInfo.technicalEvents?.intermediateTermOutlook?.direction || null,
        longTermOutlook: insights.instrumentInfo.technicalEvents?.longTermOutlook?.direction || null,
        valuation: insights.instrumentInfo.valuation?.description || null,
      };
    } catch (error) {
      console.error(`获取 ${symbol} 高级技术分析失败:`, error);
      return null;
    }
  }

  // 加载基本面数据
  private async loadFundamentalData(symbol: string): Promise<Record<string, unknown> | null> {
    try {
      console.log(`💰 加载 ${symbol} 基本面数据...`);
      
      // 转换股票代码格式
      let formattedSymbol = symbol;
      if (!symbol.includes('.')) {
        if (symbol.startsWith('300') || symbol.startsWith('002')) {
          formattedSymbol = symbol + '.SZ';
        } else if (symbol.startsWith('600') || symbol.startsWith('601') || symbol.startsWith('603') || symbol.startsWith('688')) {
          formattedSymbol = symbol + '.SS';
        }
      }
      
      const result = await yahooFinance.quoteSummary(formattedSymbol, {
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

      return {
        financialData: result.financialData || null,
        defaultKeyStatistics: result.defaultKeyStatistics || null,
        balanceSheetHistory: result.balanceSheetHistory || null,
        incomeStatementHistory: result.incomeStatementHistory || null,
      };
    } catch (error) {
      console.error(`获取 ${symbol} 基本面数据失败:`, error);
      return null;
    }
  }

  // 加载市场情绪数据
  private async loadMarketSentimentData(symbol: string): Promise<Record<string, unknown> | null> {
    try {
      console.log(`📈 加载 ${symbol} 市场情绪数据...`);
      
      // 转换股票代码格式
      let formattedSymbol = symbol;
      if (!symbol.includes('.')) {
        if (symbol.startsWith('300') || symbol.startsWith('002')) {
          formattedSymbol = symbol + '.SZ';
        } else if (symbol.startsWith('600') || symbol.startsWith('601') || symbol.startsWith('603') || symbol.startsWith('688')) {
          formattedSymbol = symbol + '.SS';
        }
      }
      
      const result = await yahooFinance.quoteSummary(formattedSymbol, {
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

      return {
        analystRating: result.financialData?.recommendationKey || null,
        recommendationMean: result.financialData?.recommendationMean || null,
        numberOfAnalystOpinions: result.financialData?.numberOfAnalystOpinions || null,
        institutionOwnership: result.institutionOwnership || null,
        insiderTransactions: (result as Record<string, unknown>).insiderTransactions || null,
      };
    } catch (error) {
      console.error(`获取 ${symbol} 市场情绪数据失败:`, error);
      return null;
    }
  }

  // 保存高级技术分析到Redis
  private async saveAdvancedTechnicalToRedis(symbol: string, data: Record<string, unknown> | null): Promise<void> {
    if (!data) return;
    
    const key = ADVANCED_TECHNICAL_KEY(symbol);
    const jsonData = JSON.stringify(data);
    await redis.setex(key, 24 * 60 * 60, jsonData); // 24小时过期
  }

  // 保存基本面数据到Redis
  private async saveFundamentalToRedis(symbol: string, data: Record<string, unknown> | null): Promise<void> {
    if (!data) return;
    
    const key = FUNDAMENTAL_KEY(symbol);
    const jsonData = JSON.stringify(data);
    await redis.setex(key, 7 * 24 * 60 * 60, jsonData); // 7天过期
  }

  // 保存市场情绪数据到Redis
  private async saveMarketSentimentToRedis(symbol: string, data: Record<string, unknown> | null): Promise<void> {
    if (!data) return;
    
    const key = SENTIMENT_KEY(symbol);
    const jsonData = JSON.stringify(data);
    await redis.setex(key, 7 * 24 * 60 * 60, jsonData); // 7天过期
  }

  // 从Redis获取高级技术分析
  async getAdvancedTechnicalFromRedis(symbol: string): Promise<Record<string, unknown> | null> {
    const key = ADVANCED_TECHNICAL_KEY(symbol);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // 从Redis获取基本面数据
  async getFundamentalFromRedis(symbol: string): Promise<Record<string, unknown> | null> {
    const key = FUNDAMENTAL_KEY(symbol);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // 从Redis获取市场情绪数据
  async getMarketSentimentFromRedis(symbol: string): Promise<Record<string, unknown> | null> {
    const key = SENTIMENT_KEY(symbol);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // 加载技术指标数据（简化版本）
  private async loadTechIndicatorsData(symbol: string, startDate: Date, endDate: Date): Promise<CachedTechIndicators[]> {
    try {
      console.log(`📊 加载 ${symbol} 技术指标数据`);
      
      // 转换股票代码格式
      let formattedSymbol = symbol;
      if (!symbol.includes('.')) {
        if (symbol.startsWith('300') || symbol.startsWith('002')) {
          formattedSymbol = symbol + '.SZ';
        } else if (symbol.startsWith('600') || symbol.startsWith('601') || symbol.startsWith('603') || symbol.startsWith('688')) {
          formattedSymbol = symbol + '.SS';
        }
      }
      
      // 获取足够的历史数据用于计算技术指标
      const extendedStartDate = new Date(startDate);
      extendedStartDate.setDate(extendedStartDate.getDate() - 200);
      
      const chartResult = await yahooFinance.chart(formattedSymbol, {
        period1: extendedStartDate,
        period2: endDate,
        interval: '1h',
      });
      
      if (!chartResult || !chartResult.quotes || chartResult.quotes.length < 50) {
        throw new Error('Insufficient data for technical indicators');
      }
      
      // 简化版本：为每个数据点计算基本指标
      const indicators: CachedTechIndicators[] = [];
      
      for (let i = 50; i < chartResult.quotes.length; i++) {
        const currentQuote = chartResult.quotes[i];
        const timestamp = currentQuote.date.getTime();
        
        // 只返回在目标时间范围内的指标
        if (timestamp >= startDate.getTime() && timestamp <= endDate.getTime()) {
          indicators.push({
            timestamp,
            symbol: formattedSymbol,
            rsi: Math.random() * 100, // 模拟RSI
            ema: {
              ema12: (currentQuote.close || 0) * (1 + Math.random() * 0.1 - 0.05),
              ema26: (currentQuote.close || 0) * (1 + Math.random() * 0.1 - 0.05),
            },
            sma: {
              sma20: (currentQuote.close || 0) * (1 + Math.random() * 0.1 - 0.05),
              sma50: (currentQuote.close || 0) * (1 + Math.random() * 0.1 - 0.05),
            },
            bb: {
              upper: (currentQuote.close || 0) * 1.02,
              middle: currentQuote.close || 0,
              lower: (currentQuote.close || 0) * 0.98,
            },
          });
        }
      }
      
      return indicators;
      
    } catch (error) {
      console.error(`获取 ${symbol} 技术指标失败:`, error);
      return [];
    }
  }

  // ========== Session 管理方法 ==========
  
  // 保存会话到 Redis
  async saveSession(session: BacktestSession): Promise<void> {
    try {
      const key = `backtest:session:${session.sessionId}`;
      const data = JSON.stringify(session);

      // 保存会话数据，设置30天过期
      await redis.setex(key, 30 * 24 * 60 * 60, data);

      // 将会话ID添加到会话列表中
      const sessionListKey = `backtest:sessions:list`;
      await redis.sadd(sessionListKey, session.sessionId);

      // 自动保存玩家性能记录
      if (session.snapshots && session.snapshots.length > 0) {
        const latestSnapshot = session.snapshots[session.snapshots.length - 1];
        const sessionDuration = session.endTime - session.startTime;

        // 为每个玩家保存性能记录
        for (const playerState of latestSnapshot.players) {
          await this.savePlayerPerformance(playerState.playerId, session.sessionId, {
            totalReturn: playerState.totalReturn,
            totalReturnPercent: playerState.totalReturnPercent,
            totalAssets: playerState.totalAssets,
            totalTrades: latestSnapshot.trades.filter(t => t.playerId === playerState.playerId).length,
            sessionDuration,
            timestamp: latestSnapshot.timestamp
          });
        }
      }

      console.log(`✅ 会话已保存: ${session.sessionId} (${session.name})`);
    } catch (error) {
      console.error('保存会话失败:', error);
      throw error;
    }
  }
  
  // 从 Redis 获取会话
  async getSession(sessionId: string): Promise<BacktestSession | null> {
    try {
      const key = `backtest:session:${sessionId}`;
      const data = await redis.get(key);
      
      if (!data) return null;
      
      return JSON.parse(data) as BacktestSession;
    } catch (error) {
      console.error(`获取会话失败 (${sessionId}):`, error);
      return null;
    }
  }
  
  // 列出所有会话
  async listSessions(filter?: { tags?: string[] }): Promise<BacktestSession[]> {
    try {
      const sessionListKey = `backtest:sessions:list`;
      const sessionIds = await redis.smembers(sessionListKey);
      
      if (sessionIds.length === 0) return [];
      
      // 并行获取所有会话
      const sessions = await Promise.all(
        sessionIds.map(id => this.getSession(id))
      );
      
      // 过滤出有效会话并应用筛选器
      let validSessions = sessions.filter((s): s is BacktestSession => s !== null);
      
      if (filter?.tags) {
        validSessions = validSessions.filter(session => {
          return filter.tags!.some(tag => session.tags.includes(tag));
        });
      }
      
      // 按创建时间降序排序
      validSessions.sort((a, b) => b.createdAt - a.createdAt);
      
      return validSessions;
    } catch (error) {
      console.error('列出会话失败:', error);
      return [];
    }
  }
  
  // 删除会话
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const key = `backtest:session:${sessionId}`;
      
      // 删除会话数据
      const deleted = await redis.del(key);
      
      // 从会话列表中移除
      const sessionListKey = `backtest:sessions:list`;
      await redis.srem(sessionListKey, sessionId);
      
      console.log(`✅ 会话已删除: ${sessionId}`);
      return deleted > 0;
    } catch (error) {
      console.error(`删除会话失败 (${sessionId}):`, error);
      return false;
    }
  }
  
  // 获取会话统计信息
  async getSessionStats(sessionId: string): Promise<{
    totalSnapshots: number;
    totalTrades: number;
    totalJudgments: number;
    sessionDuration: number;
  } | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) return null;
      
      return {
        totalSnapshots: session.snapshots.length,
        totalTrades: session.snapshots.reduce((sum, s) => sum + s.trades.length, 0),
        totalJudgments: session.snapshots.reduce((sum, s) => sum + s.judgments.length, 0),
        sessionDuration: session.endTime - session.startTime,
      };
    } catch (error) {
      console.error(`获取会话统计失败 (${sessionId}):`, error);
      return null;
    }
  }
  
  // ========== LEADERBOARD & PERFORMANCE TRACKING ==========

  // 保存玩家性能记录
  async savePlayerPerformance(playerId: string, sessionId: string, performance: {
    totalReturn: number;
    totalReturnPercent: number;
    totalAssets: number;
    totalTrades: number;
    sessionDuration: number;
    timestamp: number;
  }): Promise<void> {
    try {
      const key = `backtest:player_performance:${playerId}`;
      const performanceRecord = {
        sessionId,
        ...performance,
        recordedAt: Date.now()
      };

      // 将性能记录添加到玩家的历史记录中
      await redis.lpush(key, JSON.stringify(performanceRecord));

      // 只保留最近50条记录
      await redis.ltrim(key, 0, 49);

      // 设置过期时间（30天）
      await redis.expire(key, 30 * 24 * 60 * 60);

      console.log(`✅ 保存玩家性能记录: ${playerId} (${performance.totalReturnPercent.toFixed(2)}%)`);
    } catch (error) {
      console.error('保存玩家性能记录失败:', error);
      throw error;
    }
  }

  // 获取玩家最佳性能记录
  async getPlayerBestPerformance(playerId: string): Promise<{
    sessionId: string;
    totalReturn: number;
    totalReturnPercent: number;
    totalAssets: number;
    totalTrades: number;
    sessionDuration: number;
    timestamp: number;
  } | null> {
    try {
      const key = `backtest:player_performance:${playerId}`;
      const records = await redis.lrange(key, 0, -1);

      if (records.length === 0) return null;

      // 解析所有记录并找到最佳性能（最高收益率）
      let bestPerformance = null;
      let bestReturnPercent = -Infinity;

      for (const record of records) {
        const performance = JSON.parse(record);
        if (performance.totalReturnPercent > bestReturnPercent) {
          bestReturnPercent = performance.totalReturnPercent;
          bestPerformance = performance;
        }
      }

      return bestPerformance;
    } catch (error) {
      console.error(`获取玩家最佳性能失败 (${playerId}):`, error);
      return null;
    }
  }

  // 获取排行榜前N名玩家
  async getTopPlayers(limit: number = 10): Promise<LeaderboardEntry[]> {
    try {
      console.log(`🏆 获取排行榜前 ${limit} 名玩家...`);

      // 获取所有玩家ID（从字符串读取，因为 saveAllPlayers 使用 setex）
      const playerIdsData = await redis.get(`${CACHE_PREFIX}players`);
      if (!playerIdsData) return [];
      
      const playerIds: string[] = JSON.parse(playerIdsData);

      if (playerIds.length === 0) return [];

      // 并行获取所有玩家的最佳性能
      const playerPerformancePromises = playerIds.map(async (playerId) => {
        const bestPerformance = await this.getPlayerBestPerformance(playerId);
        const player = await this.getPlayer(playerId);

        return {
          playerId,
          playerName: player?.name || 'Unknown Player',
          strategyType: player?.strategyType || 'balanced',
          totalSessions: await this.getPlayerSessionCount(playerId),
          totalReturn: bestPerformance?.totalReturn || 0,
          totalReturnPercent: bestPerformance?.totalReturnPercent || 0,
          bestSession: bestPerformance ? {
            sessionId: bestPerformance.sessionId,
            returnPercent: bestPerformance.totalReturnPercent
          } : undefined,
          latestSession: undefined, // 可以后续添加
          rank: 0 // 将在排序后设置
        } as LeaderboardEntry;
      });

      const playerPerformances = await Promise.all(playerPerformancePromises);

      // 过滤掉没有性能数据的玩家
      const validPerformances = playerPerformances.filter(p => p.totalReturnPercent !== 0);

      // 按收益率排序并设置排名
      validPerformances.sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
      validPerformances.forEach((player, index) => {
        player.rank = index + 1;
      });

      // 返回前N名
      const topPlayers = validPerformances.slice(0, limit);

      console.log(`✅ 获取排行榜完成，共 ${topPlayers.length} 名玩家`);
      return topPlayers;
    } catch (error) {
      console.error('获取排行榜失败:', error);
      return [];
    }
  }

  // 获取玩家参与的会话数量
  private async getPlayerSessionCount(playerId: string): Promise<number> {
    try {
      const key = `backtest:player_performance:${playerId}`;
      const count = await redis.llen(key);
      return count;
    } catch (error) {
      console.error(`获取玩家会话数量失败 (${playerId}):`, error);
      return 0;
    }
  }

  // ========== CUSTOM STRATEGY MANAGEMENT ==========

  // 保存用户自定义策略
  async saveCustomStrategy(userId: string, strategy: {
    name: string;
    description: string;
    strategyConfig: StrategyConfig;
    isPublic: boolean;
    tags: string[];
  }): Promise<string> {
    try {
      const strategyId = `strategy_${Date.now()}_${userId}`;
      const strategyData = {
        id: strategyId,
        userId,
        name: strategy.name,
        description: strategy.description,
        strategyConfig: strategy.strategyConfig,
        isPublic: strategy.isPublic,
        tags: strategy.tags,
        createdAt: Date.now(),
        usageCount: 0,
        avgReturnPercent: 0,
        totalSessions: 0
      };

      // 保存策略详情
      const strategyKey = `backtest:strategy:${strategyId}`;
      await redis.setex(strategyKey, 90 * 24 * 60 * 60, JSON.stringify(strategyData)); // 90天过期

      // 添加到用户的策略列表
      const userStrategiesKey = `backtest:user_strategies:${userId}`;
      await redis.sadd(userStrategiesKey, strategyId);
      await redis.expire(userStrategiesKey, 90 * 24 * 60 * 60);

      // 如果是公开策略，添加到公开策略列表
      if (strategy.isPublic) {
        const publicStrategiesKey = `backtest:public_strategies`;
        await redis.sadd(publicStrategiesKey, strategyId);
        await redis.expire(publicStrategiesKey, 90 * 24 * 60 * 60);
      }

      console.log(`✅ 保存自定义策略: ${strategy.name} (${strategyId})`);
      return strategyId;
    } catch (error) {
      console.error('保存自定义策略失败:', error);
      throw error;
    }
  }

  // 获取用户的自定义策略列表
  async getUserStrategies(userId: string): Promise<Array<{
    id: string;
    name: string;
    description: string;
    strategyConfig: StrategyConfig;
    isPublic: boolean;
    tags: string[];
    createdAt: number;
    usageCount: number;
    avgReturnPercent: number;
    totalSessions: number;
  }>> {
    try {
      const userStrategiesKey = `backtest:user_strategies:${userId}`;
      const strategyIds = await redis.smembers(userStrategiesKey);

      if (strategyIds.length === 0) return [];

      // 并行获取所有策略详情
      const strategies = await Promise.all(
        strategyIds.map(async (strategyId) => {
          const strategyKey = `backtest:strategy:${strategyId}`;
          const data = await redis.get(strategyKey);
          return data ? JSON.parse(data) : null;
        })
      );

      return strategies.filter(s => s !== null);
    } catch (error) {
      console.error(`获取用户策略失败 (${userId}):`, error);
      return [];
    }
  }

  // 获取公开策略列表
  async getPublicStrategies(limit: number = 50): Promise<Array<{
    id: string;
    name: string;
    description: string;
    userId: string;
    tags: string[];
    usageCount: number;
    avgReturnPercent: number;
    totalSessions: number;
    createdAt: number;
  }>> {
    try {
      const publicStrategiesKey = `backtest:public_strategies`;
      const strategyIds = await redis.smembers(publicStrategiesKey);

      if (strategyIds.length === 0) return [];

      // 并行获取策略详情
      const strategies = await Promise.all(
        strategyIds.map(async (strategyId) => {
          const strategyKey = `backtest:strategy:${strategyId}`;
          const data = await redis.get(strategyKey);
          if (data) {
            const strategy = JSON.parse(data);
            return {
              id: strategy.id,
              name: strategy.name,
              description: strategy.description,
              userId: strategy.userId,
              tags: strategy.tags,
              usageCount: strategy.usageCount,
              avgReturnPercent: strategy.avgReturnPercent,
              totalSessions: strategy.totalSessions,
              createdAt: strategy.createdAt
            };
          }
          return null;
        })
      );

      // 过滤并排序
      const validStrategies = strategies.filter(s => s !== null)
        .sort((a, b) => b.usageCount - a.usageCount) // 按使用次数排序
        .slice(0, limit);

      return validStrategies;
    } catch (error) {
      console.error('获取公开策略失败:', error);
      return [];
    }
  }

  // 更新策略使用统计
  async updateStrategyStats(strategyId: string, sessionResult: {
    totalReturnPercent: number;
    totalTrades: number;
    sessionId: string;
  }): Promise<void> {
    try {
      const strategyKey = `backtest:strategy:${strategyId}`;
      const data = await redis.get(strategyKey);

      if (!data) return;

      const strategy = JSON.parse(data);

      // 更新统计信息
      strategy.usageCount = (strategy.usageCount || 0) + 1;
      strategy.totalSessions = (strategy.totalSessions || 0) + 1;

      // 计算平均收益率
      const currentTotalReturn = (strategy.avgReturnPercent || 0) * (strategy.totalSessions - 1);
      strategy.avgReturnPercent = (currentTotalReturn + sessionResult.totalReturnPercent) / strategy.totalSessions;

      // 保存更新后的策略
      await redis.setex(strategyKey, 90 * 24 * 60 * 60, JSON.stringify(strategy));

      console.log(`✅ 更新策略统计: ${strategy.name} (使用次数: ${strategy.usageCount})`);
    } catch (error) {
      console.error(`更新策略统计失败 (${strategyId}):`, error);
    }
  }

  // 删除自定义策略
  async deleteCustomStrategy(userId: string, strategyId: string): Promise<boolean> {
    try {
      const strategyKey = `backtest:strategy:${strategyId}`;
      const data = await redis.get(strategyKey);

      if (!data) return false;

      const strategy = JSON.parse(data);

      // 检查是否为策略所有者
      if (strategy.userId !== userId) {
        console.warn(`用户 ${userId} 无权删除策略 ${strategyId}`);
        return false;
      }

      // 删除策略
      await redis.del(strategyKey);

      // 从用户策略列表中移除
      const userStrategiesKey = `backtest:user_strategies:${userId}`;
      await redis.srem(userStrategiesKey, strategyId);

      // 如果是公开策略，从公开列表中移除
      if (strategy.isPublic) {
        const publicStrategiesKey = `backtest:public_strategies`;
        await redis.srem(publicStrategiesKey, strategyId);
      }

      console.log(`✅ 删除自定义策略: ${strategy.name} (${strategyId})`);
      return true;
    } catch (error) {
      console.error(`删除策略失败 (${strategyId}):`, error);
      return false;
    }
  }

  // 类结束
}

// 导出Redis缓存实例
export const redisBacktestCache = new RedisBacktestCache();
export type { CachedQuote, CachedTechIndicators, CacheStatus };
