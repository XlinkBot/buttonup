import { NextRequest, NextResponse } from 'next/server';
import {
  validateAndConvertSymbol
} from '@/lib/stock-analysis';
import { redisBacktestCache as backtestDataCache } from '@/lib/redis-backtest-cache';
import { TechnicalStrategyEngine } from '@/lib/arena-strategy';
import { ArenaExecutor } from '@/lib/arena-executor';
import type {
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
    const { timestamp, startTime, endTime, sessionId } = body;

    // 验证必需参数
    if (!timestamp) {
      return NextResponse.json({
        success: false,
        error: 'Timestamp is required for backtest mode'
      }, { status: 400 });
    }

    // 获取会话数据
    let session: BacktestSession | null = null;

    if (!sessionId) {
      return NextResponse.json({
        success: false,
        error: 'Session ID is required'
      }, { status: 400 });
    }

    // 从会话中获取数据
    session = await backtestDataCache.getSession(sessionId);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    // 获取最新的快照中的玩家状态（用于计算交易）
    let currentPlayerStates: PlayerState[] = [];
    if (session.snapshots.length > 0) {
      // 使用最新快照的玩家状态
      const latestSnapshot = session.snapshots[session.snapshots.length - 1];
      currentPlayerStates = latestSnapshot.players;
    } else {
      // 如果没有快照，使用 playerStates（初始状态）
      currentPlayerStates = session.playerStates || [];
    }

    if (currentPlayerStates.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No players found in session'
      }, { status: 400 });
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

    // 基于每个玩家的策略配置聚合股票池
    const allSymbols = currentPlayerStates
      .flatMap(ps => ps.playerConfig?.strategyConfig?.stockPool || []);
    const uniqueSymbols = [...new Set(allSymbols)];
    
    // 调试：股票池与玩家数量
    console.log(`🚀 Tick start: players=${currentPlayerStates.length}, symbols=${uniqueSymbols.length}`);

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
      stockQuotes = await backtestDataCache.getBatchQuotesAtTime(validatedSymbols, currentTime, cacheStartTime, cacheEndTime);
    } else {
      const { getBatchStockQuotes } = await import('@/lib/stock-analysis');
      stockQuotes = await getBatchStockQuotes(validatedSymbols);
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
    } else {
      console.log(`🎯 No cached comprehensive analysis, using empty analysis`);
    }

    // 6. 执行每个玩家的交易策略
    const { updatedPlayerStates, allJudgments, allTrades } =
      await executePlayerStrategies(currentPlayerStates, session, stockQuotes, techIndicatorsMap, comprehensiveAnalysisMap, currentTime);

    // 7. 创建新的快照并保存到会话
    console.log(`💾 Save snapshot: judgments=${allJudgments.length}, trades=${allTrades.length}, players=${updatedPlayerStates.length}`);

    // 为玩家状态添加必要的信息
    const enrichedPlayerStates = updatedPlayerStates.map(state => {
      // 查找对应的 playerConfig 以获取完整信息
      const playerConfig = session.playerStates?.find(p => p.playerId === state.playerId)?.playerConfig;
      return {
        ...state,
        playerConfig: state.playerConfig || playerConfig,
      };
    });

    // 创建新的快照
    const newSnapshot: BacktestSnapshot = {
      timestamp: currentTime,
      players: enrichedPlayerStates,
      trades: allTrades,
      judgments: allJudgments,
      marketData: stockQuotes.map(quote => ({
        symbol: quote.symbol,
        stockName: quote.symbol,
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        volume: quote.volume,
        timestamp: currentTime,
      })),
    };

    // 更新会话
    session.snapshots.push(newSnapshot);
    session.updatedAt = currentTime;
    session.status = 'running';

    // 保存更新的会话
    await backtestDataCache.saveSession(session);
    console.log(`✅ Snapshot saved, total=${session.snapshots.length}`);

    return NextResponse.json({
      success: true,
      data: {
        players: enrichedPlayerStates,
        stockQuotes,
        tickCount: session.snapshots.length,
        timestamp: new Date(currentTime).toISOString(),
        session: {
          sessionId: session.sessionId,
          snapshotCount: session.snapshots.length,
          status: session.status,
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

// 执行玩家策略函数 - 基于 PlayerState
async function executePlayerStrategies(
  playerStates: PlayerState[],
  session: BacktestSession,
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
  updatedPlayerStates: PlayerState[];
  allJudgments: TradingJudgment[];
  allTrades: Trade[];
}> {
  const allJudgments: TradingJudgment[] = [];
  const allTrades: Trade[] = [];
  const updatedPlayerStates: PlayerState[] = [];

  // 并行处理所有玩家
  const playerResults = await Promise.all(
    playerStates.map(state => executePlayerStrategy(state, session, stockQuotes, techIndicatorsMap, comprehensiveAnalysisMap, currentTime))
  );

  // 收集所有结果
  playerResults.forEach(result => {
    updatedPlayerStates.push(result.updatedPlayerState);
    allJudgments.push(...result.judgments);
    allTrades.push(...result.trades);
  });

  return {
    updatedPlayerStates,
    allJudgments,
    allTrades,
  };
}

// 单个玩家策略执行 - 基于 PlayerState
async function executePlayerStrategy(
  playerState: PlayerState,
  session: BacktestSession,
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
  updatedPlayerState: PlayerState;
  judgments: TradingJudgment[];
  trades: Trade[];
}> {
  if (!playerState.isActive) {
    return {
      updatedPlayerState: playerState,
      judgments: [],
      trades: [],
    };
  }

  const judgments: TradingJudgment[] = [];
  const trades: Trade[] = [];
  
  // 获取策略配置（若无配置则保持不交易，仅更新持仓估值）
  const finalStrategyConfig = playerState.playerConfig.strategyConfig;

  if (!finalStrategyConfig || !Array.isArray(finalStrategyConfig.stockPool) || finalStrategyConfig.stockPool.length === 0) {
    // 无策略配置时，仅更新估值并返回
    const updatedPortfolio = playerState.portfolio.map(pos => {
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
    const stockValue = updatedPortfolio.reduce((sum, pos) => {
      const currentQuote = stockQuotes.find(q => q.symbol === pos.symbol);
      return sum + (currentQuote?.price || 0) * pos.quantity;
    }, 0);
    const totalAssets = playerState.cash + stockValue;

    let initialCapital = 100000;
    if (session.snapshots.length > 0) {
      const firstSnapshot = session.snapshots[0];
      const playerInFirstSnapshot = firstSnapshot.players.find(p => p.playerId === playerState.playerId);
      if (playerInFirstSnapshot) {
        initialCapital = playerInFirstSnapshot.totalAssets;
      }
    }
    const totalReturn = totalAssets - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;

    return {
      updatedPlayerState: {
        ...playerState,
        portfolio: updatedPortfolio,
        totalAssets: Math.round(totalAssets * 100) / 100,
        totalReturn: Math.round(totalReturn * 100) / 100,
        totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
        lastUpdateTime: currentTime,
      },
      judgments: [],
      trades: [],
    };
  }

  const relevantStocks = stockQuotes.filter(quote => {
    // 提取股票代码的基础部分（去掉.SZ/.SH后缀）
    const baseSymbol = quote.symbol.split('.')[0];
    return finalStrategyConfig.stockPool.includes(baseSymbol);
  });
  
  // 调试：玩家与相关股票数量
  console.log(`🎯 ${playerState.playerConfig.name}: relevantStocks=${relevantStocks.length}`);

  // 创建策略执行器
  const strategyEngine = new TechnicalStrategyEngine(finalStrategyConfig);
  const executor = new ArenaExecutor(finalStrategyConfig);

  let currentState = playerState;

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
      currentState,
      stockQuote,
      techIndicators,
      comprehensiveAnalysis
    );
    
    // 4. 生成交易判断记录
    const judgment: TradingJudgment = {
      timestamp: currentTime,
      playerId: currentState.playerId,
      playerName: currentState.playerConfig.name,
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
      currentState,
      decision,
      stockQuote,
      currentTime,
      `judgment_${currentState.playerId}_${currentTime}_${stockQuote.symbol}`,
      stockQuotes // 传入所有股票报价以计算持仓盈亏
    );
    
    if (result.trade) {
      trades.push(result.trade);
      // 更新玩家状态以便下次循环使用最新状态
      currentState = result.updatedPlayerState;
    }
  }
  
  // 6. 计算最终的资产状态（无论是否有交易，都要更新持仓的当前价格）
  // 首先更新持仓的当前价格和盈亏
  const updatedPortfolio = currentState.portfolio.map(pos => {
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
  
  const stockValue = updatedPortfolio.reduce((sum, pos) => {
    const stockQuote = stockQuotes.find(q => q.symbol === pos.symbol);
    return sum + (stockQuote?.price || 0) * pos.quantity;
  }, 0);
  
  const totalAssets = currentState.cash + stockValue;
  
  // 从session的第一个快照中获取初始资本
  let initialCapital = 100000;
  if (session.snapshots.length > 0) {
    const firstSnapshot = session.snapshots[0];
    const playerInFirstSnapshot = firstSnapshot.players.find(p => p.playerId === playerState.playerId);
    if (playerInFirstSnapshot) {
      initialCapital = playerInFirstSnapshot.totalAssets;
    }
  }
  
  const totalReturn = totalAssets - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;

  const updatedPlayerState: PlayerState = {
    ...currentState,
    portfolio: updatedPortfolio,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalReturn: Math.round(totalReturn * 100) / 100,
    totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
    lastUpdateTime: currentTime,
  };

  return {
    updatedPlayerState,
    judgments,
    trades,
  };
}

