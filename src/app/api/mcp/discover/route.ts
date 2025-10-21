import { NextRequest, NextResponse } from 'next/server';
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export async function POST(req: NextRequest) {
  try {
    const { serverConfig } = await req.json();
    console.log('serverConfig', serverConfig);
    const { id, name, url, transport } = serverConfig;

    // 创建 MCP 客户端
    const mcpTransport = new StreamableHTTPClientTransport(new URL(url + '/mcp'), {
      sessionId: `discover-${id}-${Date.now()}`,
    });

    const mcpClient = await createMCPClient({
      transport: mcpTransport,
    });

    try {
      // 获取工具列表
      const toolsObject = await mcpClient.tools();
     
      // 提取工具信息
      const tools = Object.keys(toolsObject).map(toolName => {
        const tool = toolsObject[toolName];
        return {
          name: toolName,
          description: tool.description || 'No description available',
          parameters: tool.inputSchema || {},
        };
      });

      return NextResponse.json({
        success: true,
        tools,
        count: tools.length,
      });
    } finally {
      // 确保客户端被关闭
      await mcpClient.close();
    }
  } catch (error) {
    console.error('Tool discovery error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
