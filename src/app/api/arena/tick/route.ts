import { NextRequest, NextResponse } from 'next/server';
import {
  validateAndConvertSymbol
} from '@/lib/stock-analysis';
import { redisBacktestCache as backtestDataCache } from '@/lib/redis-backtest-cache';
import { STRATEGY_CONFIGS, createStrategyEngine } from '@/lib/arena-strategy';
import { ArenaExecutor } from '@/lib/arena-executor';
import type {
  Player,
  Granularity,
  TradingJudgment,
  Trade,
  BacktestSession,
  BacktestSnapshot,
  PlayerState,
} from '@/types/arena';
import type { RealTimeQuote, TechIndicatorsResponse } from '@/types/stock';

// POST 方法用于执行回测 tick 操作
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { granularity, timestamp, startTime, endTime, sessionId } = body;

    // 验证必需参数
    if (!timestamp) {
      return NextResponse.json({
        success: false,
        error: 'Timestamp is required for backtest mode'
      }, { status: 400 });
    }

    // 获取会话数据
    let session: BacktestSession | null = null;
    let players: Player[] = [];

    if (sessionId) {
      // 从会话中获取玩家数据
      session = await backtestDataCache.getSession(sessionId);
      if (!session) {
        return NextResponse.json({
          success: false,
          error: 'Session not found'
        }, { status: 404 });
      }

      // 使用最新的快照获取玩家状态，如果没有快照则使用初始配置
      if (session && session.snapshots.length > 0) {
        const latestSnapshot = session.snapshots[session.snapshots.length - 1];
        const allSnapshots = session.snapshots; // 保存到变量以避免箭头函数内的null问题
        // 将快照中的PlayerState转换为Player
        players = session.playerConfigs.map(config => {
          const state = latestSnapshot.players.find(s => s.playerId === config.id);
          // 从session中获取该玩家的所有交易记录
          const playerTrades = allSnapshots
            .flatMap(snapshot => snapshot.trades)
            .filter(trade => trade.playerId === config.id);
          
          return {
            ...config,
            cash: state?.cash || 100000,
            portfolio: state?.portfolio || [],
            trades: playerTrades,
            tradingJudgments: [],
            totalAssets: state?.totalAssets || 100000,
            totalReturn: state?.totalReturn || 0,
            totalReturnPercent: state?.totalReturnPercent || 0,
            isActive: state?.isActive !== false,
            lastUpdateTime: state?.lastUpdateTime || Date.now(),
          };
        });
      } else {
        // 没有快照，使用初始配置
        players = session.playerConfigs.map(config => ({
          ...config,
          cash: 100000,
          portfolio: [],
          trades: [],
          tradingJudgments: [],
          totalAssets: 100000,
          totalReturn: 0,
          totalReturnPercent: 0,
          isActive: true,
          lastUpdateTime: Date.now(),
        }));
      }
    } else {
      // 兼容旧方式：从Redis获取当前玩家数据
      players = await backtestDataCache.getAllPlayers();

      if (players.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No players found in Redis and no session provided'
        }, { status: 400 });
      }
    }

    // 使用传入的时间戳
    const currentTime = new Date(timestamp).getTime();
    
    // 使用传入的时间范围，如果没有则使用默认值（用于Redis缓存key匹配）
    let cacheStartTime: number;
    let cacheEndTime: number;
    
    if (startTime && endTime) {
      cacheStartTime = startTime;
      cacheEndTime = endTime;
      console.log(`📅 使用传入的Redis缓存时间范围: ${new Date(cacheStartTime).toISOString()} - ${new Date(cacheEndTime).toISOString()}`);
    } else {
      // 默认值：14天前到今天
      console.warn('⚠️ 未传入时间范围，使用默认值（14天前到今天）');
      const backtestStartTime = new Date();
      backtestStartTime.setDate(backtestStartTime.getDate() - 14);
      backtestStartTime.setHours(0, 0, 0, 0);
      const backtestEndTime = new Date();
      backtestEndTime.setHours(23, 59, 59, 999);
      
      cacheStartTime = backtestStartTime.getTime();
      cacheEndTime = backtestEndTime.getTime();
      
      console.log(`📅 使用默认Redis缓存时间范围: ${new Date(cacheStartTime).toISOString()} - ${new Date(cacheEndTime).toISOString()}`);
    }

    // 获取所有策略的股票池
    const allSymbols = [
      ...STRATEGY_CONFIGS.aggressive.stockPool,
      ...STRATEGY_CONFIGS.balanced.stockPool,
      ...STRATEGY_CONFIGS.conservative.stockPool,
    ];
    const uniqueSymbols = [...new Set(allSymbols)];
    
    console.log(`📊 股票池: ${uniqueSymbols.join(', ')}`);

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
      stockQuotes = await backtestDataCache.getBatchQuotesAtTime(validatedSymbols, currentTime, cacheStartTime, cacheEndTime);
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
      const cachedIndicators = await backtestDataCache.getBatchTechIndicatorsAtTime(validatedSymbols, currentTime, cacheStartTime, cacheEndTime);
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
        const analysis = await backtestDataCache.getComprehensiveAnalysisAtTime(symbol, currentTime, cacheStartTime, cacheEndTime);
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
    const { updatedPlayers, allJudgments, allTrades } =
      await executeEnhancedPlayerStrategies(players, stockQuotes, techIndicatorsMap, comprehensiveAnalysisMap, currentTime, session);

    // 7. 保存数据到会话快照（新的方式）
    console.log(`💾 Saving tick data to session: ${allJudgments.length} judgments, ${allTrades.length} trades, ${updatedPlayers.length} players`);

    // 如果有会话，创建新的快照并保存到会话中
    if (session) {
      // 将Player转换为PlayerState
      const playerStates: PlayerState[] = updatedPlayers.map(player => ({
        playerId: player.id,
        cash: player.cash,
        portfolio: player.portfolio,
        trades: player.trades,
        totalAssets: player.totalAssets,
        totalReturn: player.totalReturn,
        totalReturnPercent: player.totalReturnPercent,
        isActive: player.isActive,
        lastUpdateTime: currentTime,
      }));

      // 创建新的快照
      const newSnapshot: BacktestSnapshot = {
        timestamp: currentTime,
        players: playerStates,
        trades: allTrades,
        judgments: allJudgments,
        marketData: [], // 可以根据需要添加市场数据
      };

      // 更新会话
      session.snapshots.push(newSnapshot);
      session.updatedAt = currentTime;
      session.status = 'running'; // 标记为运行中

      // 保存更新的会话
      await backtestDataCache.saveSession(session);
      console.log(`✅ Session updated with new snapshot, total snapshots: ${session.snapshots.length}`);
    } else {
      // 兼容旧方式：保存到Redis
      await Promise.all([
        backtestDataCache.batchSaveTradingJudgments(allJudgments, currentTime),
        backtestDataCache.batchSaveTrades(allTrades, currentTime),
        backtestDataCache.batchUpdatePlayers(updatedPlayers),
      ]);
      console.log(`✅ Backtest tick completed successfully (legacy mode)`);
    }

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

    // 9. 返回玩家数据（移除assetHistory聚合逻辑，因为现在使用snapshots）
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
  currentTime: number,
  session: BacktestSession | null
): Promise<{
  updatedPlayers: Player[];
  allJudgments: TradingJudgment[];
  allTrades: Trade[];
}> {
  const allJudgments: TradingJudgment[] = [];
  const allTrades: Trade[] = [];
  const updatedPlayers: Player[] = [];

  // 并行处理所有玩家
  const playerResults = await Promise.all(
    players.map(player => executeEnhancedPlayerStrategy(player, stockQuotes, techIndicatorsMap, comprehensiveAnalysisMap, currentTime, session))
  );

  // 收集所有结果
  playerResults.forEach(result => {
    updatedPlayers.push(result.updatedPlayer);
    allJudgments.push(...result.judgments);
    allTrades.push(...result.trades);
  });

  return {
    updatedPlayers,
    allJudgments,
    allTrades,
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
  currentTime: number,
  session: BacktestSession | null
): Promise<{
  updatedPlayer: Player;
  judgments: TradingJudgment[];
  trades: Trade[];
}> {
  if (!player.isActive) {
    return {
      updatedPlayer: player,
      judgments: [],
      trades: [],
    };
  }

  const judgments: TradingJudgment[] = [];
  const trades: Trade[] = [];
  
  // 使用新的统一策略配置
  const finalStrategyConfig = player.strategyConfig || STRATEGY_CONFIGS[player.strategyType];

  const relevantStocks = stockQuotes.filter(quote => {
    // 提取股票代码的基础部分（去掉.SZ/.SH后缀）
    const baseSymbol = quote.symbol.split('.')[0];
    return finalStrategyConfig.stockPool.includes(baseSymbol);
  });
  
  console.log(`🎯 Player ${player.name} (${player.strategyType}): ${relevantStocks.length} relevant stocks found`);
  console.log(`📊 Strategy stock pool:`, finalStrategyConfig.stockPool);
  console.log(`📈 Available quotes:`, stockQuotes.map(q => q.symbol));
  console.log(`✅ Relevant stocks:`, relevantStocks.map(q => q.symbol));

  // 创建策略执行器（使用统一配置）
  const strategyEngine = createStrategyEngine(player.strategyType, finalStrategyConfig);
  const executor = new ArenaExecutor(finalStrategyConfig);

  // 对每只相关股票生成交易判断和执行
  for (const stockQuote of relevantStocks) {
    // 1. 获取技术指标
    const techIndicators = techIndicatorsMap.get(stockQuote.symbol);
    
    // 2. 获取综合分析数据
    const comprehensiveAnalysis = comprehensiveAnalysisMap.get(stockQuote.symbol) || {
      price: stockQuote,
      technical: {},
      advanced: {},
      fundamental: {},
      sentiment: {},
    };
    
    // 3. 使用策略引擎做出决策
    const decision = await strategyEngine.makeDecision(
      player,
      stockQuote,
      techIndicators,
      comprehensiveAnalysis
    );
    
    // 4. 生成交易判断记录
    const judgment: TradingJudgment = {
      timestamp: currentTime,
      playerId: player.id,
      playerName: player.name,
      symbol: stockQuote.symbol,
      stockName: stockQuote.symbol,
      currentPrice: stockQuote.price,
      action: decision.action,
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      technicalAnalysis: {},
      marketSentiment: stockQuote.changePercent > 2 ? 'bullish' : stockQuote.changePercent < -2 ? 'bearish' : 'neutral',
      riskAssessment: Math.abs(stockQuote.changePercent) > 5 ? 'high' : Math.abs(stockQuote.changePercent) > 2 ? 'medium' : 'low',
      expectedReturn: decision.action === 'buy' ? Math.max(2, stockQuote.changePercent * 0.5) : decision.action === 'sell' ? -Math.abs(stockQuote.changePercent * 0.3) : 0,
    };
    judgments.push(judgment);

    // 5. 使用执行器执行交易
    const result = executor.executeDecision(
      player,
      decision,
      stockQuote,
      currentTime,
      `judgment_${player.id}_${currentTime}_${stockQuote.symbol}`,
      stockQuotes // 传入所有股票报价以计算持仓盈亏
    );
    
    if (result.trade) {
      trades.push(result.trade);
      // 更新玩家状态以便下次循环使用最新状态
      player = result.updatedPlayer;
    }
  }
  
  // 6. 计算最终的资产状态（无论是否有交易，都要更新持仓的当前价格）
  // 首先更新持仓的当前价格和盈亏
  const updatedPortfolio = player.portfolio.map(pos => {
    const currentQuote = stockQuotes.find(q => q.symbol === pos.symbol);
    const currentPrice = currentQuote?.price || pos.costPrice;
    const profitLoss = (currentPrice - pos.costPrice) * pos.quantity;
    const profitLossPercent = ((currentPrice - pos.costPrice) / pos.costPrice) * 100;
    return {
      ...pos,
      currentPrice: Math.round(currentPrice * 100) / 100,
      profitLoss: Math.round(profitLoss * 100) / 100,
      profitLossPercent: Math.round(profitLossPercent * 100) / 100,
    };
  });
  
  const finalPlayer = {
    ...player,
    portfolio: updatedPortfolio,
  };
  
  const stockValue = finalPlayer.portfolio.reduce((sum, pos) => {
    const stockQuote = stockQuotes.find(q => q.symbol === pos.symbol);
    return sum + (stockQuote?.price || 0) * pos.quantity;
  }, 0);
  
  const totalAssets = finalPlayer.cash + stockValue;
  
  // 从session的第一个快照中获取初始资本，如果没有session则使用默认值
  let initialCapital = 100000;
  if (session && session.snapshots.length > 0) {
    const firstSnapshot = session.snapshots[0];
    const playerInFirstSnapshot = firstSnapshot.players.find(p => p.playerId === player.id);
    if (playerInFirstSnapshot) {
      initialCapital = playerInFirstSnapshot.totalAssets;
    }
  }
  
  const totalReturn = totalAssets - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;

  const updatedPlayer: Player = {
    ...finalPlayer,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
    lastUpdateTime: currentTime,
  };

  return {
    updatedPlayer,
    judgments,
    trades,
  };
}

// 注意：旧的generateEnhancedTradingJudgment、executeTrade、updatePortfolioWithAverageCost函数
// 已迁移到 lib/arena-strategy.ts 和 lib/arena-executor.ts
// 请使用新的模块化实现

// 注意：数据聚合函数已移除，因为现在使用 snapshots 作为单一数据源
// 历史数据可以通过 useSessionSnapshots hook 从 snapshots 中动态生成

// ============ 模块化完成 ============
// 原 generateEnhancedTradingJudgment、executeTrade、updatePortfolioWithAverageCost 
// 相关逻辑已迁移到:
// - lib/arena-strategy.ts (策略决策)
// - lib/arena-executor.ts (交易执行)
