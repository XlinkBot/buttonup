'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react'
import { Send, Trash2, Loader, Settings, Plus, X, Server } from 'lucide-react';
import { QUICK_PROMPTS } from '@/lib/mcp-quick-prompts';
import { DefaultChatTransport } from 'ai';


interface MCPServer {
  id: string;
  name: string;
  url: string;
  description?: string;
  enabled: boolean;
  transport: "mcp" | "sse" | "stdio";
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

export default function MCPChatDemo() {
  const [showConfig, setShowConfig] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([
    {
      id: 'default-stock',
      name: 'Stock Analysis Server',
      url: 'http://localhost:3000/api/mcp',
      description: '内置股票分析工具',
      enabled: true,
      transport: 'mcp',
      tools: []
    }
  ]);
  const [newServer, setNewServer] = useState<Partial<MCPServer>>({
    name: '',
    url: '',
    description: '',
    enabled: true,
    transport: 'mcp',
  });

  // 使用 useChat hook
  const { messages, setMessages, status, sendMessage } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/mcp-chat',
      body: {
        serverConfigs: mcpServers, // 将服务器配置发送到后端
      },
    }),
  });

  // 输入状态管理
  const [input, setInput] = useState('');

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ parts: [{ type: 'text', text: input }] });
      setInput('');
    }
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };




  // MCP Server Management Functions
  const addMCPServer = () => {
    if (!newServer.name || !newServer.url) return;
    
    const server: MCPServer = {
      id: `server-${Date.now()}`,
      name: newServer.name,
      url: newServer.url,
      description: newServer.description || '',
      enabled: newServer.enabled || true,
      transport: newServer.transport || 'mcp',
    };
    
    setMcpServers(prev => [...prev, server]);
    setNewServer({ 
      name: '', 
      url: '', 
      description: '', 
      enabled: true, 
      transport: 'mcp'
    });
  };

  const removeMCPServer = (id: string) => {
    setMcpServers(prev => prev.filter(server => server.id !== id));
  };

  const toggleMCPServer = (id: string) => {
    setMcpServers(prev => prev.map(server => 
      server.id === id ? { ...server, enabled: !server.enabled } : server
    ));
  };

  const discoverTools = async (serverId: string) => {
    const server = mcpServers.find(s => s.id === serverId);
    if (!server) return;

    try {
      const response = await fetch('/api/mcp/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverConfig: server }),
      });

      const data = await response.json();

      if (data.success) {
        // 更新服务器配置中的工具列表
        setMcpServers(prev => prev.map(s => 
          s.id === serverId ? { ...s, tools: data.tools } : s
        ));
        
        alert(`发现 ${data.count} 个工具！`);
      } else {
        throw new Error(data.error || 'Tool discovery failed');
      }
    } catch (error) {
      console.error('Tool discovery failed:', error);
      alert(`工具发现失败：${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-gray-900 dark:to-gray-800 rounded-lg">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            MCP Chat Demo
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            支持动态配置外部 MCP 服务器的智能聊天
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="配置 MCP 服务器"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setMessages([])}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
            title="清空聊天记录"
          >
            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* MCP Server Configuration Panel */}
      {showConfig && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 sm:px-6 py-4 sm:py-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              MCP 服务器配置 (直接客户端连接)
            </h3>
            
            {/* Add New Server Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                添加新服务器
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="服务器名称"
                  value={newServer.name || ''}
                  onChange={(e) => setNewServer(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <input
                  type="url"
                  placeholder="服务器 URL (例如: /api/sse)"
                  value={newServer.url || ''}
                  onChange={(e) => setNewServer(prev => ({ ...prev, url: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <select
                  value={newServer.transport || 'mcp'}
                  onChange={(e) => setNewServer(prev => ({ ...prev, transport: e.target.value as 'mcp' | 'sse' | 'stdio' }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="mcp">MCP Transport (推荐)</option>
                  <option value="sse">SSE Transport</option>
                  <option value="stdio" disabled>Stdio Transport (不支持)</option>
                </select>
                <input
                  type="text"
                  placeholder="描述 (可选)"
                  value={newServer.description || ''}
                  onChange={(e) => setNewServer(prev => ({ ...prev, description: e.target.value }))}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  onClick={addMCPServer}
                  disabled={!newServer.name || !newServer.url}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed sm:col-span-2"
                >
                  <Plus className="w-4 h-4" />
                  添加服务器
                </button>
              </div>
            </div>

            {/* Server List */}
            <div className="space-y-2">
              {mcpServers.map((server) => (
                <div
                  key={server.id}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Server className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {server.name}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            server.enabled 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                          }`}>
                            {server.enabled ? '已启用' : '已禁用'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {server.url} ({server.transport})
                        </p>
                        {server.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {server.description}
                          </p>
                        )}
                        {server.tools && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            发现 {server.tools.length} 个工具
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => discoverTools(server.id)}
                        className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg transition-colors"
                      >
                        发现工具
                      </button>
                      <button
                        onClick={() => toggleMCPServer(server.id)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          server.enabled
                            ? 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                            : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400'
                        }`}
                      >
                        {server.enabled ? '禁用' : '启用'}
                      </button>
                      {server.id !== 'default-stock' && (
                        <button
                          onClick={() => removeMCPServer(server.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4 sm:mb-6">
              <span className="text-xl sm:text-3xl">📊</span>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              欢迎使用 MCP Chat Demo
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md mb-6 sm:mb-8">
              配置 MCP 服务器后，AI 将根据您的需求自动调用相应的工具。
              支持股票分析、文件操作、数据库查询等多种功能。使用 AI SDK 直接连接 MCP 服务器。
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <div key={msg.id} className="mb-4">
            {/* Role indicator */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                msg.role === 'user' 
                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                {msg.role === 'user' ? 'U' : 'AI'}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {msg.role}
              </span>
            </div>
            
            {/* Message content */}
            <div className={`rounded-lg p-4 ${
              msg.role === 'user'
                ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}>
              {/* Render message parts */}
              {msg.parts.map((part, index) => {
                console.log('part', part);
                if (part.type === 'text') {
                  return (
                    <div key={index} className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                      {part.text}
                    </div>
                  );
                }
                
                // 处理 dynamic-tool 类型
                if (part.type === 'dynamic-tool') {
                  const dynamicTool = part as unknown as {
                    toolName: string;
                    toolCallId: string;
                    state: string;
                    input: unknown;
                    output?: {
                      content: Array<{ type: string; text: string }>;
                      isError: boolean;
                    };
                  };
                  
                  return (
                    <div key={index} className="mt-3 space-y-2">
                      {/* 工具调用 */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            🔧 {dynamicTool.toolName}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            dynamicTool.state === 'output-available' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {dynamicTool.state === 'output-available' ? '已完成' : '执行中'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          <strong>参数:</strong>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                            {JSON.stringify(dynamicTool.input, null, 2)}
                          </pre>
                        </div>
                      </div>
                      
                      {/* 工具结果 */}
                      {dynamicTool.output && (
                        <div className={`p-3 border rounded-lg ${
                          dynamicTool.output.isError
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        }`}>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <strong>{dynamicTool.output.isError ? '错误结果:' : '执行结果:'}</strong>
                            <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto max-h-32">
                              {dynamicTool.output.content.map((content, i) => {
                                if (content.type === 'text') {
                                  try {
                                    // 尝试解析JSON以美化显示
                                    const parsed = JSON.parse(content.text);
                                    return JSON.stringify(parsed, null, 2);
                                  } catch {
                                    return content.text;
                                  }
                                }
                                return content.text;
                              }).join('\n')}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                
                // 处理传统的 tool- 类型（向后兼容）
                if (part.type.startsWith('tool-')) {
                  const toolName = part.type.replace('tool-', '');
                  return (
                    <div key={index} className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          🔧 {toolName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>参数:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                          {JSON.stringify((part as unknown as { input?: unknown }).input || part, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                }
                
                // 处理 tool-result 类型（向后兼容）
                if (part.type === 'tool-result') {
                  return (
                    <div key={index} className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <strong>结果:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto max-h-32">
                          {typeof (part as unknown as { result: unknown }).result === 'string' 
                            ? (part as unknown as { result: string }).result 
                            : JSON.stringify((part as unknown as { result: unknown }).result, null, 2)
                          }
                        </pre>
                      </div>
                    </div>
                  );
                }
                
                return null;
              })}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {status === 'streaming' && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI 正在思考中...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      {messages.length === 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4 sm:py-6">
          <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 sm:mb-4">
            💡 快速提示词（股票分析示例）：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_PROMPTS.slice(0, 6).map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => sendMessage({ parts: [{ type: 'text', text: prompt.prompt }] })}
                disabled={status === 'streaming'}
                className="text-left px-3 sm:px-4 py-2 sm:py-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-600 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 disabled:opacity-50 transition-colors text-xs sm:text-sm"
              >
                <div className="font-medium text-orange-900 dark:text-orange-100">
                  {prompt.title}
                </div>
                <div className="text-orange-700 dark:text-orange-300 text-xs line-clamp-1">
                  {prompt.prompt}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-600 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 提示：点击右上角的设置按钮可以添加更多 MCP 服务器。此客户端使用 AI SDK 直接连接 MCP 服务器，支持文件操作、数据库查询、API 调用等功能
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 sm:px-6 py-4 sm:py-6">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 sm:gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            disabled={status === 'streaming'}
            placeholder="输入您的问题... (例如：查询 AAPL 股价、分析市场趋势等)"
            className="flex-1 px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'streaming' || !input.trim()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            {status === 'streaming' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">发送</span>
          </button>
        </form>
      </div>
    </div>
  );
}
