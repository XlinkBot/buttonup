'use client';

import { useState } from 'react';
import { Copy, Play, RotateCcw } from 'lucide-react';
import { STOCK_TOOLS } from '@/lib/mcp-stock-server';
import MCPChatDemo from '@/components/MCPChatDemo';

type TabType = 'sandbox' | 'chat';

interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: { code: number; message: string };
}

interface ToolProperty {
  type?: string;
  description?: string;
}

const MCP_TOOLS_MAP = STOCK_TOOLS.reduce(
  (acc, tool) => {
    acc[tool.name] = tool;
    return acc;
  },
  {} as Record<string, typeof STOCK_TOOLS[0]>
);

export default function StockAnalysisMCPPage() {
  const [activeTab, setActiveTab] = useState<TabType>('sandbox');
  const [selectedTool, setSelectedTool] = useState<string>(STOCK_TOOLS[0].name);
  const [params, setParams] = useState<Record<string, unknown>>({});
  const [response, setResponse] = useState<MCPResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId] = useState<string | number>(1);

  const currentTool = MCP_TOOLS_MAP[selectedTool];

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExecute = async () => {
    try {
      setLoading(true);
      setError(null);
      setResponse(null);

      const request: MCPRequest = {
        jsonrpc: '2.0',
        id: requestId,
        method: selectedTool,
        params,
      };

      const res = await fetch('/api/stock/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: MCPResponse = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParams({});
    setResponse(null);
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isSuccessResponse = (resp: unknown): resp is MCPResponse => {
    return (
      typeof resp === 'object' &&
      resp !== null &&
      'result' in resp
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            MCP Stock Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Test stock analysis APIs and chat with AI-powered assistant
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`px-4 sm:px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'sandbox'
                ? 'border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            API Sandbox
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 sm:px-6 py-4 font-medium border-b-2 transition-colors ${
              activeTab === 'chat'
                ? 'border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            MCP Chat Demo
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'sandbox' ? (
          // Original Sandbox Content
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Request Builder */}
            <div className="lg:col-span-1 space-y-6">
              {/* Tool Selector */}
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Select API Method
                </label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {STOCK_TOOLS.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => {
                        setSelectedTool(tool.name);
                        setParams({});
                        setResponse(null);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition ${
                        selectedTool === tool.name
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600 text-orange-900 dark:text-orange-100'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-300 dark:hover:border-orange-600'
                      }`}
                    >
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs mt-1 opacity-75">{tool.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              {currentTool && (
                <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Parameters
                  </label>
                  <div className="space-y-3">
                    {Object.entries(currentTool.inputSchema.properties).map(([key, prop]: [string, unknown]) => {
                      const property = prop as ToolProperty;
                      return (
                        <div key={key}>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {key}
                            {currentTool.inputSchema.required.includes(key) && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            placeholder={property.description || key}
                            value={(params[key] as string) || ''}
                            onChange={(e) => handleParamChange(key, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition text-sm"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={handleExecute}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                    >
                      <Play className="w-4 h-4" />
                      {loading ? '执行中...' : 'Execute'}
                    </button>
                    <button
                      onClick={handleReset}
                      className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium flex items-center justify-center gap-2 transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel - Request/Response */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request */}
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Request</h3>
                  <button
                    onClick={() => {
                      const request: MCPRequest = {
                        jsonrpc: '2.0',
                        id: requestId,
                        method: selectedTool,
                        params,
                      };
                      copyToClipboard(JSON.stringify(request, null, 2));
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="bg-gray-900 dark:bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                  {JSON.stringify(
                    {
                      jsonrpc: '2.0',
                      id: requestId,
                      method: selectedTool,
                      params,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>

              {/* Response */}
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Response</h3>
                    {response && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {loading ? '加载中...' : isSuccessResponse(response) ? '✅ Success' : '❌ Error'}
                      </p>
                    )}
                  </div>
                  {response && (
                    <button
                      onClick={() => {
                        copyToClipboard(JSON.stringify(response, null, 2));
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin">
                      <Play className="w-6 h-6 text-orange-500" />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 p-4 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 font-mono">{error}</p>
                  </div>
                )}

                {response && (
                  <pre className="bg-gray-900 dark:bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                )}

                {!response && !error && !loading && (
                  <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                    Execute a request to see the response here
                  </div>
                )}
              </div>

              {/* API Info */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">API Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Endpoint</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-mono mt-1">/api/stock/mcp</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Method</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-mono mt-1">POST</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Protocol</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-mono mt-1">JSON-RPC 2.0</p>
                  </div>

                  {currentTool && (
                    <>
                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Current Method</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{currentTool.name}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Description</p>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">{currentTool.description}</p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Required Parameters</p>
                        <div className="mt-2 space-y-1">
                          {currentTool.inputSchema.required.length > 0 ? (
                            currentTool.inputSchema.required.map((param) => (
                              <span
                                key={param}
                                className="inline-block px-2 py-1 bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100 text-xs rounded mr-2 mb-1"
                              >
                                {param}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-blue-800 dark:text-blue-200">No required parameters</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // MCP Chat Demo Tab
          <div className="h-[600px] sm:h-[700px]">
            <MCPChatDemo />
          </div>
        )}
      </div>
    </div>
  );
}
