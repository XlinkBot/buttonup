import { NextResponse } from 'next/server';
import { notionService } from '@/lib/notion';

/**
 * GET /api/cache-status
 * 检查缓存状态和性能的调试端点
 */
export async function GET() {
  console.log('🔍 Cache Status Check - Starting...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as Array<{
      test: string;
      duration: number;
      cached: boolean;
      details?: string;
    }>
  };

  try {
    // 测试 1: 第一次调用 getSimpleContentList
    console.log('🧪 Test 1: First call to getSimpleContentList');
    const start1 = Date.now();
    const content1 = await notionService.getSimpleContentList();
    const end1 = Date.now();
    const duration1 = end1 - start1;
    
    results.tests.push({
      test: 'getSimpleContentList - First Call',
      duration: duration1,
      cached: false,
      details: `Retrieved ${content1.length} items`
    });

    // 等待一小段时间
    await new Promise(resolve => setTimeout(resolve, 100));

    // 测试 2: 第二次调用 getSimpleContentList (应该使用缓存)
    console.log('🧪 Test 2: Second call to getSimpleContentList (should be cached)');
    const start2 = Date.now();
    const content2 = await notionService.getSimpleContentList();
    const end2 = Date.now();
    const duration2 = end2 - start2;
    
    results.tests.push({
      test: 'getSimpleContentList - Second Call',
      duration: duration2,
      cached: duration2 < duration1 * 0.5, // 如果第二次调用时间少于第一次的50%，认为使用了缓存
      details: `Retrieved ${content2.length} items`
    });

    // 测试 3: 单个内容查询
    if (content1.length > 0) {
      const slug = content1[0].slug;
      
      console.log(`🧪 Test 3: First call to getContentBySlug(${slug})`);
      const start3 = Date.now();
      const singleContent1 = await notionService.getContentBySlug(slug);
      const end3 = Date.now();
      const duration3 = end3 - start3;
      
      results.tests.push({
        test: `getContentBySlug(${slug}) - First Call`,
        duration: duration3,
        cached: false,
        details: singleContent1 ? `Found: ${singleContent1.title}` : 'Not found'
      });

      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`🧪 Test 4: Second call to getContentBySlug(${slug}) (should be cached)`);
      const start4 = Date.now();
      const singleContent2 = await notionService.getContentBySlug(slug);
      const end4 = Date.now();
      const duration4 = end4 - start4;
      
      results.tests.push({
        test: `getContentBySlug(${slug}) - Second Call`,
        duration: duration4,
        cached: duration4 < duration3 * 0.5,
        details: singleContent2 ? `Found: ${singleContent2.title}` : 'Not found'
      });
    }

    // 计算总体缓存效果
    const cachedTests = results.tests.filter(t => t.cached);
    const cacheEffectiveness = cachedTests.length / Math.max(results.tests.length - 1, 1); // 排除第一次调用

    console.log('✅ Cache Status Check - Completed');
    
    return NextResponse.json({
      success: true,
      cacheEffectiveness: `${Math.round(cacheEffectiveness * 100)}%`,
      summary: {
        totalTests: results.tests.length,
        cachedCalls: cachedTests.length,
        averageFirstCallTime: results.tests.filter(t => !t.cached).reduce((sum, t) => sum + t.duration, 0) / results.tests.filter(t => !t.cached).length,
        averageCachedCallTime: cachedTests.length > 0 ? cachedTests.reduce((sum, t) => sum + t.duration, 0) / cachedTests.length : 0
      },
      ...results
    });

  } catch (error) {
    console.error('❌ Cache Status Check - Error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check cache status',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...results
      },
      { status: 500 }
    );
  }
}
