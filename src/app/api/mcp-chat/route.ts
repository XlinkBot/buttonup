import { NextRequest } from 'next/server';
import { convertToModelMessages, streamText, generateText, stepCountIs } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';
import { experimental_createMCPClient as createMCPClient } from 'ai';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export async function POST(req: NextRequest) {
  try {
    const { messages, serverConfigs } = await req.json();

    console.log("server config", serverConfigs)

    const userMessages = convertToModelMessages(messages);

    // 创建 MCP 客户端并收集工具
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mcpClients: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allTools: Record<string, any> = {};

    try {
      // 为每个启用的服务器创建客户端
      for (const config of serverConfigs) {
        if (!config.enabled ) {
          continue;
        }
        console.log('config', config);
        const transport = new StreamableHTTPClientTransport(new URL(config.url + '/mcp'), {
          sessionId: `chat-${config.id}-${Date.now()}`,
        });

        const mcpClient = await createMCPClient({
          transport,
        });

        mcpClients.push(mcpClient);

        // 获取并合并工具
        const tools = await mcpClient.tools();
        Object.assign(allTools, tools);
      }
      
      // 选择使用 streamText 或 generateText
      const useStreaming = true; // 设置为 false 使用 generateText
      
      if (useStreaming) {
        // 使用 streamText 生成响应，启用多步骤工具调用
        const result = await streamText({
          model: deepseek('deepseek-chat'),
          messages: userMessages,
          tools: Object.keys(allTools).length > 0 ? allTools : undefined,
          // 启用多步骤调用，让AI能够处理工具返回的结果
          stopWhen: stepCountIs(10), // 最多允许10步，防止无限循环
          onStepFinish: ({ text, toolCalls, toolResults, finishReason, usage }) => {
            console.log('Step finished:', {
              text: text?.slice(0, 100) + '...',
              toolCalls: toolCalls?.length || 0,
              toolResults: toolResults?.length || 0,
              finishReason,
              usage
            });
          },
          onFinish: async () => {
            // 关闭所有 MCP 客户端
            for (const client of mcpClients) {
              try {
                await client.close();
              } catch (error) {
                console.error('Error closing MCP client:', error);
              }
            }
          },
          
        });
        
        return result.toUIMessageStreamResponse();
      } else {
        // 使用 generateText 一次性获取完整结果
        const { text, steps } = await generateText({
          model: deepseek('deepseek-chat'),
          messages: userMessages,
          tools: Object.keys(allTools).length > 0 ? allTools : undefined,
          stopWhen: stepCountIs(10),
        });
        
        // 关闭所有 MCP 客户端
        for (const client of mcpClients) {
          try {
            await client.close();
          } catch (error) {
            console.error('Error closing MCP client:', error);
          }
        }
        
        // 返回 JSON 响应而不是流
        return new Response(JSON.stringify({ 
          text, 
          steps: steps.map(step => ({
            text: step.text,
            toolCalls: step.toolCalls?.length || 0,
            toolResults: step.toolResults?.length || 0,
            finishReason: step.finishReason
          }))
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      // 确保在错误情况下也关闭客户端
      for (const client of mcpClients) {
        try {
          await client.close();
        } catch (e) {
          console.error('Error closing MCP client during cleanup:', e);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

