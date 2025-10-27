// 性能调试工具
export class PerformanceDebugger {
  private static instance: PerformanceDebugger;
  private apiCallTimes: number[] = [];
  private renderTimes: number[] = [];
  private lastApiCallTime = 0;

  static getInstance(): PerformanceDebugger {
    if (!PerformanceDebugger.instance) {
      PerformanceDebugger.instance = new PerformanceDebugger();
    }
    return PerformanceDebugger.instance;
  }

  // 记录API调用
  recordApiCall() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCallTime;
    this.apiCallTimes.push(timeSinceLastCall);
    this.lastApiCallTime = now;
    
    console.log(`🌐 API Call - Time since last: ${timeSinceLastCall}ms`);
    
    // 如果调用间隔太短，发出警告
    if (timeSinceLastCall < 5000) { // 5秒
      console.warn(`⚠️ API called too frequently! Only ${timeSinceLastCall}ms since last call`);
    }
  }

  // 记录组件渲染
  recordRender(componentName: string) {
    const now = Date.now();
    this.renderTimes.push(now);
    console.log(`🔄 ${componentName} rendered at ${new Date().toLocaleTimeString()}`);
  }

  // 获取统计信息
  getStats() {
    const avgApiInterval = this.apiCallTimes.length > 1 
      ? this.apiCallTimes.slice(1).reduce((a, b) => a + b, 0) / (this.apiCallTimes.length - 1)
      : 0;
    
    return {
      totalApiCalls: this.apiCallTimes.length,
      averageApiInterval: Math.round(avgApiInterval),
      totalRenders: this.renderTimes.length,
      lastApiCall: this.lastApiCallTime ? new Date(this.lastApiCallTime).toLocaleTimeString() : 'Never'
    };
  }

  // 打印报告
  printReport() {
    const stats = this.getStats();
    console.log('📊 Performance Debug Report:');
    console.log(`Total API Calls: ${stats.totalApiCalls}`);
    console.log(`Average API Interval: ${stats.averageApiInterval}ms`);
    console.log(`Total Renders: ${stats.totalRenders}`);
    console.log(`Last API Call: ${stats.lastApiCall}`);
  }

  // 重置
  reset() {
    this.apiCallTimes = [];
    this.renderTimes = [];
    this.lastApiCallTime = 0;
  }
}

// Hook for debugging
export function usePerformanceDebug(componentName: string) {
  const debugInstance = PerformanceDebugger.getInstance();
  
  return {
    recordApiCall: () => debugInstance.recordApiCall(),
    recordRender: () => debugInstance.recordRender(componentName),
    getStats: () => debugInstance.getStats(),
    printReport: () => debugInstance.printReport()
  };
}
