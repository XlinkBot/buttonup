// 性能测试工具
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private renderCounts: Map<string, number> = new Map();
  private apiCallCounts: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // 记录组件渲染
  recordRender(componentName: string) {
    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);
    console.log(`🔄 ${componentName} rendered (${count + 1} times)`);
  }

  // 记录API调用
  recordApiCall(endpoint: string) {
    const count = this.apiCallCounts.get(endpoint) || 0;
    this.apiCallCounts.set(endpoint, count + 1);
    console.log(`🌐 API call to ${endpoint} (${count + 1} times)`);
  }

  // 获取渲染统计
  getRenderStats() {
    return Object.fromEntries(this.renderCounts);
  }

  // 获取API调用统计
  getApiStats() {
    return Object.fromEntries(this.apiCallCounts);
  }

  // 重置统计
  reset() {
    this.renderCounts.clear();
    this.apiCallCounts.clear();
  }

  // 打印性能报告
  printReport() {
    console.log('📊 Performance Report:');
    console.log('Component Renders:', this.getRenderStats());
    console.log('API Calls:', this.getApiStats());
  }
}

// React Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const monitor = PerformanceMonitor.getInstance();
  
  // 在组件渲染时记录
  monitor.recordRender(componentName);
  
  return {
    recordApiCall: (endpoint: string) => monitor.recordApiCall(endpoint),
    getStats: () => ({
      renders: monitor.getRenderStats(),
      apiCalls: monitor.getApiStats()
    })
  };
}
