import { z } from 'zod';
import { STOCK_TOOLS } from './mcp-stock-server';
import type { MCPRequest, MCPResponse } from './mcp-stock-server';

/**
 * Convert STOCK_TOOLS from MCP format to AI-SDK tool format
 * This adapter allows DeepSeek to understand and use stock analysis tools
 */

interface ToolProperty {
  type?: string;
  description?: string;
}

export const MCPToolsForAISDK = STOCK_TOOLS.map((tool) => ({
  name: tool.name,
  description: tool.description,
  parameters: z.object(
    Object.entries(tool.inputSchema.properties).reduce(
      (acc, [key, prop]: [string, unknown]) => {
        const property = prop as ToolProperty;
        const isRequired = tool.inputSchema.required.includes(key);
        const baseSchema = z.string().describe(property.description || key);
        acc[key] = isRequired ? baseSchema : baseSchema.optional();
        return acc;
      },
      {} as Record<string, z.ZodTypeAny>
    )
  ),
}));

/**
 * Execute MCP tool via the JSON-RPC endpoint
 */
export async function executeMCPTool(
  toolName: string,
  params: Record<string, string | undefined>
): Promise<MCPResponse> {
  try {
    // Filter out undefined values
    const cleanParams = Object.entries(params).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: `${toolName}-${Date.now()}`,
      method: toolName,
      params: cleanParams,
    };

    const response = await fetch('/api/stock/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`MCP API error: ${response.statusText}`);
    }

    const data: MCPResponse = await response.json();
    return data;
  } catch (error) {
    console.error(`Error executing MCP tool ${toolName}:`, error);
    throw error;
  }
}

/**
 * Format tool result for AI response
 */
export function formatToolResult(
  toolName: string,
  result: unknown,
  request?: MCPRequest
): {
  toolName: string;
  request: MCPRequest | null;
  result: unknown;
} {
  return {
    toolName,
    request: request || null,
    result,
  };
}
