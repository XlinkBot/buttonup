import { NextResponse } from 'next/server';
import { redisBacktestCache } from '@/lib/redis-backtest-cache';
import type { BacktestSession, PlayerConfig, BacktestSnapshot, PlayerState } from '@/types/arena';
import Redis from 'ioredis';

// Initialize sample data for leaderboard testing
export async function POST(): Promise<NextResponse> {
  try {
    console.log('🚀 Initializing sample leaderboard data...');

    // Test Redis connection first
    const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
    await redis.ping();
    console.log('✅ Redis connection successful');
    await redis.quit();

    // 1. Initialize system players pool (for match system)
    await redisBacktestCache.initializeSystemPlayersPool();
    console.log('✅ Created system players pool');
    
    // 2. Get all system players for creating sessions
    const systemPlayers = await redisBacktestCache.getAllSystemPlayers();
    console.log(`✅ Retrieved ${systemPlayers.length} system players`);

    // 3. Create sample sessions with performance data
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 10; i++) {
      const sessionId = `sample_session_${i}`;
      const sessionTime = oneWeekAgo + (i * 24 * 60 * 60 * 1000); // Spread over 10 days

      // Create sample player configurations from system players
      const playerConfigs: PlayerConfig[] = systemPlayers.slice(0, 8).map(player => ({
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        strategyConfig: player.strategyConfig,
      }));

      // Create sample snapshots with varied performance
      const snapshots: BacktestSnapshot[] = [];
      const numSnapshots = 20;
      let finalPlayerStates: PlayerState[] = [];

      for (let j = 0; j < numSnapshots; j++) {
        const timestamp = sessionTime + (j * 60 * 60 * 1000); // Hourly snapshots
        const progress = j / numSnapshots;

        // Create varied player performance
        const playerStates: PlayerState[] = playerConfigs.map((config, idx) => {
          // Generate different performance patterns for each player
          let returnPercent = 0;

          if (idx === 0) { // Aggressive player - high volatility
            returnPercent = Math.sin(progress * Math.PI * 4) * 15 + (Math.random() - 0.5) * 10;
          } else if (idx === 1) { // Balanced player - steady growth
            returnPercent = progress * 8 + (Math.random() - 0.5) * 3;
          } else if (idx === 2) { // Conservative player - modest gains
            returnPercent = progress * 3 + (Math.random() - 0.5) * 2;
          } else { // Other players - varied performance
            returnPercent = (Math.random() - 0.3) * 20 + progress * 5;
          }

          const totalReturn = 100000 * (returnPercent / 100);
          const totalAssets = 100000 + totalReturn;

          const avgCost = 10 + Math.random() * 5;
          const currentPrice = avgCost * (1 + returnPercent / 100);
          const quantity = Math.floor((totalAssets - 10000) / 10);
          const profitLoss = (currentPrice - avgCost) * quantity;
          const profitLossPercent = ((currentPrice - avgCost) / avgCost) * 100;

          return {
            playerId: config.id,
            playerConfig: config,
            cash: Math.max(10000, totalAssets * (1 - progress * 0.8)), // Decrease cash over time
            portfolio: [{
              symbol: '000001.SZ',
              stockName: '平安银行',
              quantity: quantity,
              costPrice: avgCost,
              currentPrice: currentPrice,
              profitLoss: Math.round(profitLoss),
              profitLossPercent: Math.round(profitLossPercent * 100) / 100,
            }],
            totalAssets: Math.round(totalAssets),
            totalReturn: Math.round(totalReturn),
            totalReturnPercent: Math.round(returnPercent * 100) / 100,
            isActive: true,
            lastUpdateTime: timestamp,
          };
        });

        snapshots.push({
          timestamp,
          players: playerStates,
          trades: [],
          judgments: [], // Empty for simplicity
          marketData: [],
        });

        // Save the final player states for session
        if (j === numSnapshots - 1) {
          finalPlayerStates = playerStates;
        }
      }

      // Create session
      const session: BacktestSession = {
        sessionId,
        name: `Sample Session ${i + 1}`,
        description: `Generated sample session for testing`,
        status: 'completed',
        startTime: sessionTime,
        endTime: sessionTime + (numSnapshots * 60 * 60 * 1000),
        createdAt: sessionTime,
        updatedAt: sessionTime + (numSnapshots * 60 * 60 * 1000),
        tags: ['sample', 'test'],
        playerStates: finalPlayerStates,
        snapshots,
        metadata: {
          totalTicks: numSnapshots,
          totalTrades: snapshots.reduce((sum, snap) => sum + snap.trades.length, 0),
        },
      };

      // Save session
      await redisBacktestCache.saveSession(session);

      // Save player performance data for leaderboard - use the last snapshot
      const lastSnapshot = snapshots[snapshots.length - 1];
      for (const player of lastSnapshot.players) {
        // Count trades from snapshots for this player
        const totalTrades = snapshots.reduce((count, snapshot) => 
          count + snapshot.trades.filter(trade => trade.playerId === player.playerId).length, 0
        );
        
        await redisBacktestCache.savePlayerPerformance(player.playerId, sessionId, {
          totalReturn: player.totalReturn,
          totalReturnPercent: player.totalReturnPercent,
          totalAssets: player.totalAssets,
          totalTrades: totalTrades,
          sessionDuration: numSnapshots * 60 * 60 * 1000,
          timestamp: sessionTime + (numSnapshots * 60 * 60 * 1000),
        });
      }

      console.log(`✅ Created session ${sessionId} with ${numSnapshots} snapshots`);
    }

    console.log('🎉 Sample data initialization complete!');

    return NextResponse.json({
      success: true,
      message: 'Sample data initialized successfully',
      data: {
        playersCreated: systemPlayers.length,
        sessionsCreated: 10,
        totalSnapshots: 10 * 20,
      }
    });

  } catch (error) {
    console.error('Failed to initialize sample data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize sample data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}