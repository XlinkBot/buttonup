import { NextResponse } from 'next/server';
import Redis from 'ioredis';

// Test Redis connection from Next.js
export async function GET(): Promise<NextResponse> {
  try {
    console.log('🔍 Testing Redis connection...');

    // Create Redis connection with same config as redis-backtest-cache
    const redis = new Redis({
      host: 'localhost',
      port: 6379,
      db: 0,
      maxRetriesPerRequest: 3,
    });

    // Test basic connection
    await redis.ping();
    console.log('✅ Redis ping successful');

    // Try to write a unique key
    const testKey = `api_test_${Date.now()}`;
    await redis.set(testKey, 'hello_from_api', 'EX', 60);
    const value = await redis.get(testKey);
    console.log(`✅ Redis write test successful: ${testKey} = ${value}`);

    // Check for backtest keys
    const allKeys = await redis.keys('*');
    const backtestKeys = allKeys.filter(key => key.startsWith('backtest:'));
    console.log(`📊 Found ${backtestKeys.length} backtest keys`);

    // Check for players set
    const players = await redis.smembers('backtest:players');
    console.log(`👥 Found ${players.length} players`);

    await redis.quit();

    return NextResponse.json({
      success: true,
      data: {
        testWrite: { key: testKey, value },
        totalKeys: allKeys.length,
        backtestKeysCount: backtestKeys.length,
        backtestKeys: backtestKeys.slice(0, 10), // Show first 10
        playersCount: players.length,
        players: players.slice(0, 5), // Show first 5
        allKeys: allKeys.filter(key => !key.startsWith('bull:')).slice(0, 10)
      }
    });

  } catch (error) {
    console.error('❌ Redis debug error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Redis connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}