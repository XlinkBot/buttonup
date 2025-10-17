import { NextRequest, NextResponse } from 'next/server';
import { handleMCPRequest, handleMCPBatchRequest, STOCK_TOOLS, type MCPRequest } from '@/lib/mcp-stock-server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Handle batch requests (array) or single request
    let responses;
    if (Array.isArray(body)) {
      responses = await handleMCPBatchRequest(body as MCPRequest[]);
    } else {
      const response = await handleMCPRequest(body as MCPRequest);
      responses = [response];
    }

    return NextResponse.json(Array.isArray(body) ? responses : responses[0], { status: 200 });
  } catch (error) {
    console.error('Error in MCP endpoint:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32700,
          message: 'Parse error',
        },
      },
      { status: 400 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  // Return available tools on GET
  return NextResponse.json(
    {
      version: '1.0.0',
      tools: STOCK_TOOLS,
      description: 'Stock Analysis MCP Server - Provides 10 core stock analysis interfaces',
    },
    { status: 200 }
  );
}
