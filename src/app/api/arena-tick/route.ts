import { NextRequest, NextResponse } from 'next/server';
import { 
  validateAndConvertSymbol
} from '@/lib/stock-analysis';
import { redisBacktestCache as backtestDataCache } from '@/lib/redis-backtest-cache';
import type {
  Player,
  Granularity,
  TradingJudgment,
  Trade,
  AssetHistory,
  ExtendedPortfolio,
} from '@/types/arena';
import type { RealTimeQuote, TechIndicatorsResponse } from '@/types/stock';


const STRATEGY_CONFIGS = {
  aggressive: {
    stockPool: ['300750', '002594', '002475', '300059', '000725', '002415', '300142', '002230'],
  },
  balanced: {
    stockPool: ['600519', '000858', '600036', '000001', '600000', '600887', '000002', '600276'],
  },
  conservative: {
    stockPool: ['601398', '601318', '600900', '600028', '601288', '600104'],
  },
};

// POST 方法用于执行回测 tick 操作
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { granularity, timestamp } = body;

    // 验证必需参数
    if (!timestamp) {
      return NextResponse.json({
        success: false,
        error: 'Timestamp is required for backtest mode'
      }, { status: 400 });
    }

    // 从Redis获取当前玩家数据
    const players = await backtestDataCache.getAllPlayers();
    
    if (players.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No players found in Redis'
      }, { status: 400 });
    }

    // 使用传入的时间戳
    const currentTime = new Date(timestamp).getTime();

    // 获取所有策略的股票池
    const allSymbols = [
      ...STRATEGY_CONFIGS.aggressive.stockPool,
      ...STRATEGY_CONFIGS.balanced.stockPool,
      ...STRATEGY_CONFIGS.conservative.stockPool,
    ];
    const uniqueSymbols = [...new Set(allSymbols)];

    console.log(`🚀 Starting backtest arena tick for ${players.length} players with ${uniqueSymbols.length} stocks at ${new Date(currentTime).toISOString()}`);

    // 1. 批量验证和转换股票代码
    const validatedSymbols = await Promise.all(
      uniqueSymbols.map(symbol => validateAndConvertSymbol(symbol))
    );

    // 2. 检查Redis缓存是否已加载
    const isCacheLoaded = await backtestDataCache.isDataLoaded();
    if (!isCacheLoaded) {
      console.log('⚠️ Redis缓存未加载，使用实时模式');
    }

    // 3. 获取股票数据（如果缓存未加载则使用实时模式）
    let stockQuotes: RealTimeQuote[];
    if (isCacheLoaded) {
      console.log(`📈 Fetching cached quotes for backtest at ${new Date(currentTime).toISOString()}`);
      stockQuotes = await backtestDataCache.getBatchQuotesAtTime(validatedSymbols, currentTime, 0, 0);
      console.log(`📈 Fetched ${stockQuotes.length} cached quotes`);
    } else {
      console.log(`📈 Fetching real-time quotes`);
      const { getBatchStockQuotes } = await import('@/lib/stock-analysis');
      stockQuotes = await getBatchStockQuotes(validatedSymbols);
      console.log(`📈 Fetched ${stockQuotes.length} real-time quotes`);
    }

    // 4. 获取技术指标（如果缓存未加载则使用空数据）
    const techIndicatorsMap = new Map<string, TechIndicatorsResponse>();
    if (isCacheLoaded) {
      const cachedIndicators = await backtestDataCache.getBatchTechIndicatorsAtTime(validatedSymbols, currentTime, 0, 0);
      cachedIndicators.forEach((indicators, symbol) => {
        techIndicatorsMap.set(symbol, {
          symbol,
          period: 'daily',
          indicators: [indicators],
        });
      });
      console.log(`📊 Fetched ${techIndicatorsMap.size} cached technical indicators`);
    } else {
      console.log(`📊 No cached technical indicators, using empty indicators`);
    }

    // 5. 获取综合分析数据（如果缓存未加载则使用空数据）
    const comprehensiveAnalysisMap = new Map<string, {
      price: RealTimeQuote | null;
      technical: Record<string, unknown>;
      advanced: Record<string, unknown>;
      fundamental: Record<string, unknown>;
      sentiment: Record<string, unknown>;
    }>();
    if (isCacheLoaded) {
      console.log(`🔍 Fetching comprehensive analysis from Redis cache...`);
      const analysisPromises = validatedSymbols.map(async (symbol: string) => {
        const analysis = await backtestDataCache.getComprehensiveAnalysisAtTime(symbol, currentTime, 0, 0);
        if (analysis) {
          comprehensiveAnalysisMap.set(symbol, {
            price: analysis.price,
            technical: analysis.technical as unknown as Record<string, unknown>,
            advanced: analysis.advanced as unknown as Record<string, unknown>,
            fundamental: analysis.fundamental as unknown as Record<string, unknown>,
            sentiment: analysis.sentiment as unknown as Record<string, unknown>,
          });
        }
      });
      await Promise.all(analysisPromises);
      console.log(`🎯 Fetched comprehensive analysis for ${comprehensiveAnalysisMap.size} stocks`);
    } else {
      console.log(`🎯 No cached comprehensive analysis, using empty analysis`);
    }

    // 6. 执行每个玩家的交易策略（增强版本）
    const { updatedPlayers, allJudgments, allTrades, allAssetHistories } = 
      await executeEnhancedPlayerStrategies(players, stockQuotes, techIndicatorsMap, comprehensiveAnalysisMap, currentTime);

    // 7. 保存所有数据到Redis（完全使用Redis存储）
    console.log(`💾 Saving all data to Redis: ${allJudgments.length} judgments, ${allTrades.length} trades, ${allAssetHistories.length} histories, ${updatedPlayers.length} players`);
    
    // 保存所有数据到Redis
    await Promise.all([
      backtestDataCache.batchSaveTradingJudgments(allJudgments, currentTime),
      backtestDataCache.batchSaveTrades(allTrades, currentTime),
      backtestDataCache.batchSaveAssetHistories(allAssetHistories, currentTime),
      backtestDataCache.batchUpdatePlayers(updatedPlayers),
    ]);
    
    console.log(`✅ Backtest tick completed successfully`);

    // 8. 将judgments和trades添加到每个玩家对象中
    const playersWithData = updatedPlayers.map(player => {
      const playerJudgments = allJudgments.filter(j => j.playerId === player.id);
      const playerTrades = allTrades.filter(t => t.playerId === player.id);
      
      return {
        ...player,
        tradingJudgments: [...player.tradingJudgments, ...playerJudgments],
        trades: [...player.trades, ...playerTrades],
      };
    });

    // 9. 直接返回 players 数据，不再包含 assetHistory
    const playersForResponse = playersWithData;

    return NextResponse.json({
      success: true,
      data: {
        players: playersForResponse,
        stockQuotes,
        tickCount: currentTime,
        timestamp: new Date(currentTime).toISOString(),
        backtestInfo: {
          targetTime: new Date(timestamp).toISOString(),
          judgments: allJudgments,
          trades: allTrades,
          assetHistories: allAssetHistories,
        },
      },
    });
  } catch (error) {
    console.error('Arena tick error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute tick' },
      { status: 500 }
    );
  }
}

// 增强的执行玩家策略函数 - 使用综合分析数据
async function executeEnhancedPlayerStrategies(
  players: Player[],
  stockQuotes: RealTimeQuote[],
  techIndicatorsMap: Map<string, TechIndicatorsResponse>,
  comprehensiveAnalysisMap: Map<string, {
    price: RealTimeQuote | null;
    technical: Record<string, unknown>;
    advanced: Record<string, unknown>;
    fundamental: Record<string, unknown>;
    sentiment: Record<string, unknown>;
  }>,
  currentTime: number
): Promise<{
  updatedPlayers: Player[];
  allJudgments: TradingJudgment[];
  allTrades: Trade[];
  allAssetHistories: AssetHistory[];
}> {
  const allJudgments: TradingJudgment[] = [];
  const allTrades: Trade[] = [];
  const allAssetHistories: AssetHistory[] = [];
  const updatedPlayers: Player[] = [];

  // 并行处理所有玩家
  const playerResults = await Promise.all(
    players.map(player => executeEnhancedPlayerStrategy(player, stockQuotes, techIndicatorsMap, comprehensiveAnalysisMap, currentTime))
  );

  // 收集所有结果
  playerResults.forEach(result => {
    updatedPlayers.push(result.updatedPlayer);
    allJudgments.push(...result.judgments);
    allTrades.push(...result.trades);
    allAssetHistories.push(result.assetHistory);
  });

  return {
    updatedPlayers,
    allJudgments,
    allTrades,
    allAssetHistories,
  };
}

// 增强的单个玩家策略执行 - 使用综合分析数据
async function executeEnhancedPlayerStrategy(
  player: Player,
  stockQuotes: RealTimeQuote[],
  techIndicatorsMap: Map<string, TechIndicatorsResponse>,
  comprehensiveAnalysisMap: Map<string, {
    price: RealTimeQuote | null;
    technical: Record<string, unknown>;
    advanced: Record<string, unknown>;
    fundamental: Record<string, unknown>;
    sentiment: Record<string, unknown>;
  }>,
  currentTime: number
): Promise<{
  updatedPlayer: Player;
  judgments: TradingJudgment[];
  trades: Trade[];
  assetHistory: AssetHistory;
}> {
  if (!player.isActive) {
    return {
      updatedPlayer: player,
      judgments: [],
      trades: [],
      assetHistory: player.assetHistory[player.assetHistory.length - 1] || {
        id: `history_${player.id}_${currentTime}`,
        playerId: player.id,
        timestamp: currentTime,
        totalAssets: player.cash,
        cash: player.cash,
        stockValue: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      },
    };
  }

  const judgments: TradingJudgment[] = [];
  const trades: Trade[] = [];
  
  // 获取玩家策略相关的股票
  const strategyConfig = STRATEGY_CONFIGS[player.strategyType];
  const relevantStocks = stockQuotes.filter(quote => {
    // 提取股票代码的基础部分（去掉.SZ/.SH后缀）
    const baseSymbol = quote.symbol.split('.')[0];
    return strategyConfig.stockPool.includes(baseSymbol);
  });
  
  console.log(`🎯 Player ${player.name} (${player.strategyType}): ${relevantStocks.length} relevant stocks found`);
  console.log(`📊 Strategy stock pool:`, strategyConfig.stockPool);
  console.log(`📈 Available quotes:`, stockQuotes.map(q => q.symbol));
  console.log(`✅ Relevant stocks:`, relevantStocks.map(q => q.symbol));

  // 对每只相关股票生成交易判断
  for (const stockQuote of relevantStocks) {
    // 1. 生成交易判断（使用综合分析数据或基础数据）
    const comprehensiveAnalysis = comprehensiveAnalysisMap.get(stockQuote.symbol);
    
    // 如果缓存分析数据不存在，创建一个基础的分析数据
    const analysisForJudgment = comprehensiveAnalysis || {
      price: stockQuote,
      technical: {},
      advanced: {},
      fundamental: {},
      sentiment: {},
    };
    
    const judgment = await generateEnhancedTradingJudgment(player, stockQuote, techIndicatorsMap, analysisForJudgment, currentTime);
    judgments.push(judgment);

    // 2. 执行交易（如果有交易决定）
    const trade = await executeTrade(player, judgment, stockQuote, currentTime);
    if (trade) {
      trades.push(trade);
    }
  }

  // 3. 更新Portfolio（使用平均成本）
  const updatedPortfolio = updatePortfolioWithAverageCost(player, trades, stockQuotes);
  
  // 4. 计算新的现金余额
  let newCash = player.cash;
  trades.forEach(trade => {
    if (trade.type === 'buy') {
      newCash -= trade.amount;
    } else {
      newCash += trade.amount;
    }
  });

  // 5. 计算当前总资产
  const stockValue = updatedPortfolio.reduce((sum, pos) => {
    const stockQuote = stockQuotes.find(q => q.symbol === pos.symbol);
    return sum + (stockQuote?.price || 0) * pos.quantity;
  }, 0);
  
  const totalAssets = newCash + stockValue;
  const totalReturn = totalAssets - 100000; // 相对于初始10000的收益
  const totalReturnPercent = (totalReturn / 100000) * 100;

  // 6. 创建AssetHistory记录
  const assetHistory: AssetHistory = {
    id: `history_${player.id}_${currentTime}`,
    playerId: player.id,
    timestamp: currentTime,
    totalAssets: Math.round(totalAssets * 100) / 100,
    cash: Math.round(newCash * 100) / 100,
    stockValue: Math.round(stockValue * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
  };

  // 7. 返回更新后的玩家
  const updatedPlayer: Player = {
    ...player,
    cash: Math.round(newCash * 100) / 100,
    portfolio: updatedPortfolio,
    trades: [...player.trades, ...trades],
    assetHistory: [...player.assetHistory, assetHistory],
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    lastUpdateTime: currentTime,
  };

  return {
    updatedPlayer,
    judgments,
    trades,
    assetHistory,
  };
}

// 生成增强交易判断（基于综合分析数据）
async function generateEnhancedTradingJudgment(
  player: Player, 
  stockQuote: RealTimeQuote, 
  techIndicatorsMap: Map<string, TechIndicatorsResponse>,
  comprehensiveAnalysis: {
    price: RealTimeQuote | null;
    technical: Record<string, unknown>;
    advanced: Record<string, unknown>;
    fundamental: Record<string, unknown>;
    sentiment: Record<string, unknown>;
  },
  currentTime: number
): Promise<TradingJudgment> {
  const currentPosition = player.portfolio.find(p => p.symbol === stockQuote.symbol);
  const hasPosition = currentPosition && currentPosition.quantity > 0;
  
  // 获取技术指标（从预获取的Map中获取）
  let technicalAnalysis: {
    rsi?: number;
    ema12?: number;
    ema26?: number;
    sma20?: number;
    sma50?: number;
    bbUpper?: number;
    bbMiddle?: number;
    bbLower?: number;
  } = {
    rsi: undefined,
    ema12: undefined,
    ema26: undefined,
    sma20: undefined,
    sma50: undefined,
    bbUpper: undefined,
    bbMiddle: undefined,
    bbLower: undefined,
  };

  const techIndicators = techIndicatorsMap.get(stockQuote.symbol);
  if (techIndicators && techIndicators.indicators.length > 0) {
    const latest = techIndicators.indicators[techIndicators.indicators.length - 1];
    technicalAnalysis = {
      rsi: latest.rsi,
      ema12: latest.ema?.ema12,
      ema26: latest.ema?.ema26,
      sma20: latest.sma?.sma20,
      sma50: latest.sma?.sma50,
      bbUpper: latest.bb?.upper,
      bbMiddle: latest.bb?.middle,
      bbLower: latest.bb?.lower,
    };
  }

  // 基于综合分析的多维度交易逻辑
  let action: 'buy' | 'sell' | 'hold' = 'hold';
  let confidence = 50;
  let reasoning = '';
  
  const rsi = technicalAnalysis.rsi;
  const price = stockQuote.price;
  const changePercent = stockQuote.changePercent;
  
  // 获取综合分析数据
  const advanced = comprehensiveAnalysis?.advanced;
  const fundamental = comprehensiveAnalysis?.fundamental;
  const sentiment = comprehensiveAnalysis?.sentiment;
  
  // 多维度信号评分
  let buySignals = 0;
  let sellSignals = 0;
  const totalSignals = 8; // 总信号数
  
  // 1. 技术指标信号
  if (rsi && rsi < 30) buySignals++; // RSI超卖
  if (rsi && rsi > 70) sellSignals++; // RSI超买
  
  // 2. 价格信号
  if (changePercent > 3) buySignals++; // 强势上涨
  if (changePercent < -3) sellSignals++; // 强势下跌
  
  // 3. 支撑阻力位信号
  if (advanced?.support && typeof advanced.support === 'number' && price <= advanced.support * 1.02) buySignals++; // 接近支撑位
  if (advanced?.resistance && typeof advanced.resistance === 'number' && price >= advanced.resistance * 0.98) sellSignals++; // 接近阻力位
  
  // 4. 基本面信号
  const fundamentalData = fundamental?.fundamentalData as Record<string, unknown> | undefined;
  if (fundamentalData?.returnOnEquity && typeof fundamentalData.returnOnEquity === 'number' && fundamentalData.returnOnEquity > 0.15) buySignals++; // ROE良好
  if (fundamentalData?.debtToEquity && typeof fundamentalData.debtToEquity === 'number' && fundamentalData.debtToEquity > 100) sellSignals++; // 负债率过高
  
  // 5. 市场情绪信号
  if (sentiment?.analystRating === 'buy') buySignals++; // 分析师推荐买入
  if (sentiment?.analystRating === 'sell') sellSignals++; // 分析师推荐卖出
  
  // 决策逻辑
  const buyRatio = buySignals / totalSignals;
  const sellRatio = sellSignals / totalSignals;
  
  console.log(`📊 ${stockQuote.symbol} 分析: 买入=${buySignals}, 卖出=${sellSignals}, 价格=${price}, 涨跌=${changePercent.toFixed(2)}%, 持仓=${hasPosition}`);
  
  if (buyRatio >= 0.4 && !hasPosition && player.cash > price * 100) {
    action = 'buy';
    confidence = Math.min(90, 60 + buyRatio * 30);
    reasoning = `多维度买入信号(${buySignals}/${totalSignals})，RSI: ${rsi?.toFixed(1) || 'N/A'}，支撑位: ${advanced?.support || 'N/A'}`;
  } else if (sellRatio >= 0.4 && hasPosition) {
    action = 'sell';
    confidence = Math.min(85, 55 + sellRatio * 30);
    reasoning = `多维度卖出信号(${sellSignals}/${totalSignals})，RSI: ${rsi?.toFixed(1) || 'N/A'}，阻力位: ${advanced?.resistance || 'N/A'}`;
  } else {
    reasoning = `信号不足，RSI: ${rsi?.toFixed(1) || 'N/A'}，涨跌: ${changePercent.toFixed(1)}%，买入信号: ${buySignals}/${totalSignals}，卖出信号: ${sellSignals}/${totalSignals}`;
  }
  // const stock_name = await searchStockSymbol(undefined, stockQuote.symbol.split('.')[0]);
  return {
    timestamp: currentTime,
    playerId: player.id,
    playerName: player.name,
    symbol: stockQuote.symbol,
    stockName: stockQuote.symbol,
    currentPrice: stockQuote.price,
    action,
    confidence,
    reasoning,
    technicalAnalysis,
    marketSentiment: changePercent > 2 ? 'bullish' : changePercent < -2 ? 'bearish' : 'neutral',
    riskAssessment: Math.abs(changePercent) > 5 ? 'high' : Math.abs(changePercent) > 2 ? 'medium' : 'low',
    expectedReturn: action === 'buy' ? Math.max(2, changePercent * 0.5) : action === 'sell' ? -Math.abs(changePercent * 0.3) : 0,
  };
}
// 删除旧的generateTradingJudgment函数残留代码

// 执行交易
async function executeTrade(
  player: Player,
  judgment: TradingJudgment,
  stockQuote: RealTimeQuote,
  currentTime: number
): Promise<Trade | null> {
  const currentPosition = player.portfolio.find(p => p.symbol === judgment.symbol);
  const hasPosition = currentPosition && currentPosition.quantity > 0;
  
  // 交易手续费（0.1%）
  const transactionFee = 0.001;
  
  if (judgment.action === 'buy' && !hasPosition) {
    // 买入逻辑
    const maxQuantity = Math.floor(player.cash / (stockQuote.price * (1 + transactionFee)));
    if (maxQuantity > 0) {
      const quantity = Math.min(maxQuantity, 100); // 限制单次买入数量
      const amount = quantity * stockQuote.price * (1 + transactionFee);
      
      return {
        id: `trade_${player.id}_${currentTime}_${judgment.symbol}`,
        playerId: player.id,
        type: 'buy',
        symbol: judgment.symbol,
        stockName: judgment.stockName,
        price: stockQuote.price,
        quantity,
        amount: Math.round(amount * 100) / 100,
        timestamp: currentTime,
        judgmentId: `judgment_${player.id}_${currentTime}_${judgment.symbol}`,
      };
    }
  } else if (judgment.action === 'sell' && hasPosition) {
    // 卖出逻辑
    const quantity = currentPosition.quantity;
    const amount = quantity * stockQuote.price * (1 - transactionFee);
    
    return {
      id: `trade_${player.id}_${currentTime}_${judgment.symbol}`,
      playerId: player.id,
      type: 'sell',
      symbol: judgment.symbol,
      stockName: judgment.stockName,
      price: stockQuote.price,
      quantity,
      amount: Math.round(amount * 100) / 100,
      timestamp: currentTime,
      judgmentId: `judgment_${player.id}_${currentTime}_${judgment.symbol}`,
    };
  }
  
  return null;
}

// 使用平均成本更新Portfolio（同步版本）
function updatePortfolioWithAverageCost(
  player: Player,
  trades: Trade[],
  stockQuotes: RealTimeQuote[]
): ExtendedPortfolio[] {
  const portfolioMap = new Map<string, ExtendedPortfolio>();
  
  // 初始化现有持仓
  player.portfolio.forEach(position => {
    const currentQuote = stockQuotes.find(q => q.symbol === position.symbol);
    const currentPrice = currentQuote?.price || position.costPrice;
    const profitLoss = (currentPrice - position.costPrice) * position.quantity;
    const profitLossPercent = ((currentPrice - position.costPrice) / position.costPrice) * 100;
    
    portfolioMap.set(position.symbol, {
      ...position,
      currentPrice: Math.round(currentPrice * 100) / 100,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercent: Math.round(profitLossPercent * 100) / 100,
    });
  });
  
  // 处理交易
  trades.forEach(trade => {
    const existing = portfolioMap.get(trade.symbol);
    
    if (trade.type === 'buy') {
      if (existing) {
        // 计算平均成本
        const totalQuantity = existing.quantity + trade.quantity;
        const totalCost = (existing.costPrice * existing.quantity) + (trade.price * trade.quantity);
        const averageCost = totalCost / totalQuantity;
        
        const currentQuote = stockQuotes.find(q => q.symbol === trade.symbol);
        const currentPrice = currentQuote?.price || averageCost;
        const profitLoss = (currentPrice - averageCost) * totalQuantity;
        const profitLossPercent = ((currentPrice - averageCost) / averageCost) * 100;
        
        portfolioMap.set(trade.symbol, {
          symbol: trade.symbol,
          stockName: trade.stockName,
          quantity: totalQuantity,
          costPrice: Math.round(averageCost * 100) / 100,
          currentPrice: Math.round(currentPrice * 100) / 100,
          profitLoss: Math.round(profitLoss * 100) / 100,
          profitLossPercent: Math.round(profitLossPercent * 100) / 100,
        });
      } else {
        const currentQuote = stockQuotes.find(q => q.symbol === trade.symbol);
        const currentPrice = currentQuote?.price || trade.price;
        const profitLoss = (currentPrice - trade.price) * trade.quantity;
        const profitLossPercent = ((currentPrice - trade.price) / trade.price) * 100;
        
        portfolioMap.set(trade.symbol, {
          symbol: trade.symbol,
          stockName: trade.stockName,
          quantity: trade.quantity,
          costPrice: trade.price,
          currentPrice: Math.round(currentPrice * 100) / 100,
          profitLoss: Math.round(profitLoss * 100) / 100,
          profitLossPercent: Math.round(profitLossPercent * 100) / 100,
        });
      }
    } else if (trade.type === 'sell') {
      if (existing) {
        const newQuantity = existing.quantity - trade.quantity;
        if (newQuantity > 0) {
          const currentQuote = stockQuotes.find(q => q.symbol === trade.symbol);
          const currentPrice = currentQuote?.price || existing.costPrice;
          const profitLoss = (currentPrice - existing.costPrice) * newQuantity;
          const profitLossPercent = ((currentPrice - existing.costPrice) / existing.costPrice) * 100;
          
          portfolioMap.set(trade.symbol, {
            ...existing,
            quantity: newQuantity,
            currentPrice: Math.round(currentPrice * 100) / 100,
            profitLoss: Math.round(profitLoss * 100) / 100,
            profitLossPercent: Math.round(profitLossPercent * 100) / 100,
          });
        } else {
          portfolioMap.delete(trade.symbol);
        }
      }
    }
  });
  
  return Array.from(portfolioMap.values());
}

// 删除旧的executePlayerStrategy函数，已被executeOptimizedPlayerStrategy替代

// 将时间序列按分钟/日/周/月做聚合，取该周期内最后一个点（收盘式的"当前总资产"）
function aggregateHistoryByGranularity(history: AssetHistory[], granularity: Granularity) {
  if (!history || history.length === 0) return history;
  const buckets = new Map<string, AssetHistory>();
  for (const point of history) {
    const d = new Date(point.timestamp);
    let key = '';
    switch (granularity) {
      case 'second':
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()} ${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`;
        break;
      case 'minute':
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()} ${d.getUTCHours()}:${d.getUTCMinutes()}`;
        break;
      case 'day':
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
        break;
      case 'week': {
        // 以周一为一周开始：计算 ISO 周
        const day = d.getUTCDay() || 7;
        const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 1));
        key = `${monday.getUTCFullYear()}-W${monday.getUTCMonth()}-${monday.getUTCDate()}`;
        break;
      }
      case 'month':
        key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        break;
    }
    // 取该桶里的"最后一个点"作为该粒度的代表值
    const existed = buckets.get(key);
    if (!existed || point.timestamp >= existed.timestamp) {
      buckets.set(key, point);
    }
  }
  return Array.from(buckets.values()).sort((a, b) => a.timestamp - b.timestamp);
}
