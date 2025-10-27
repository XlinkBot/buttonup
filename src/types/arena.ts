// A股投资竞技场类型定义 - Unified Architecture

export type StrategyType = 'aggressive' | 'balanced' | 'conservative';

// === CORE DATA TYPES ===

export interface PlayerAvatar {
  icon: string;
  bgColor: string;
  textColor: string;
}

export interface Position {
  symbol: string;
  stockName: string;
  quantity: number;
  costPrice: number;
  currentPrice: number;
  profitLoss: number;
  profitLossPercent: number;
}

// Legacy alias for backward compatibility
export interface Portfolio extends Position {}

export interface Trade {
  id: string;
  playerId: string;
  type: 'buy' | 'sell';
  symbol: string;
  stockName: string;
  price: number;
  quantity: number;
  amount: number;
  timestamp: number;
  judgmentId?: string;
}

export interface TradingJudgment {
  timestamp: number;
  playerId: string;
  playerName: string;
  symbol: string;
  stockName: string;
  currentPrice: number;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  technicalAnalysis: {
    rsi?: number;
    ema12?: number;
    ema26?: number;
    sma20?: number;
    sma50?: number;
    bbUpper?: number;
    bbMiddle?: number;
    bbLower?: number;
  };
  marketSentiment: string;
  riskAssessment: string;
  expectedReturn: number;
}

export interface MarketData {
  symbol: string;
  stockName: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  rsi?: number;
  ema12?: number;
  ema26?: number;
  sma20?: number;
  sma50?: number;
  bbUpper?: number;
  bbMiddle?: number;
  bbLower?: number;
}

// === STRATEGY MANAGEMENT ===

export interface StrategyConfig {
  // Core identification
  name: string;
  description?: string;
  strategyType: StrategyType;

  // Trading parameters
  stockPool: string[];
  buyThreshold: number;
  sellThreshold: number;
  positionSize: number;
  maxShares: number;
  signalSensitivity: number;
  rsiBuyThreshold: number;
  rsiSellThreshold: number;

  // Advanced options
  isRandomTrade?: boolean;
  randomBuyProbability?: number;
  randomSellProbability?: number;

  // AI/Features
  reasoning?: string;
}

// === PLAYER MANAGEMENT ===

export interface PlayerConfig {
  id: string;
  name: string;
  strategyType: StrategyType;
  avatar?: PlayerAvatar;
  strategyConfig: StrategyConfig;
}

export interface PlayerState {
  playerId: string;
  cash: number;
  portfolio: Position[];
  totalAssets: number;
  totalReturn: number;
  totalReturnPercent: number;
  isActive: boolean;
  lastUpdateTime: number;
}

// Complete player data for UI (config + state + history)
export interface Player extends PlayerConfig {
  cash: number;
  portfolio: Position[];
  trades: Trade[];
  tradingJudgments: TradingJudgment[];
  totalAssets: number;
  totalReturn: number;
  totalReturnPercent: number;
  isActive: boolean;
  lastUpdateTime: number;
}

// === SESSION & BATTLE MANAGEMENT ===

export type SessionStatus = 'pending' | 'running' | 'completed' | 'paused';

export interface BacktestSnapshot {
  timestamp: number;
  players: PlayerState[];
  trades: Trade[];
  judgments: TradingJudgment[];
  marketData: MarketData[];
}

export interface BacktestSession {
  sessionId: string;
  name: string;
  description?: string;
  status: SessionStatus;
  startTime: number;
  endTime: number;
  createdAt: number;
  updatedAt: number;
  tags: string[];

  playerConfigs: PlayerConfig[];
  snapshots: BacktestSnapshot[];

  metadata?: {
    totalTicks: number;
    totalTrades: number;
    bestPlayerId?: string;
    worstPlayerId?: string;
  };
}

// === LEADERBOARD & RANKINGS ===

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  strategyType: StrategyType;
  totalSessions: number;
  totalReturn: number;
  totalReturnPercent: number;
  bestSession?: {
    sessionId: string;
    returnPercent: number;
  };
  latestSession?: {
    sessionId: string;
    returnPercent: number;
  };
  rank: number;
}

export interface LeaderboardData {
  periods: Array<{
    name: string;
    start: number;
    end: number;
    leaderboard: LeaderboardEntry[];
    totalSessions: number;
  }>;
  currentSession?: {
    sessionId: string;
    name: string;
    description?: string;
    createdAt: number;
  } | null;
}

// === MULTIPLAYER MATCHING ===

export interface MatchRoom {
  roomId: string;
  users: Array<{
    userId: string;
    userName: string;
    joinTime: number;
  }>;
  status: 'waiting' | 'matched';
  createdAt: number;
  sessionId?: string;
}

// === API & UTILITIES ===

export type Granularity = 'second' | 'minute' | 'day' | 'week' | 'month';

export interface TickResponse {
  success: boolean;
  data?: {
    players: Player[];
    marketData: MarketData[];
    tickCount: number;
  };
  error?: string;
}