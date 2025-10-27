'use client';

import { Bot, User, Wrench, CheckCircle } from 'lucide-react';

interface ToolCall {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
}

interface MCPChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
}

export default function MCPChatMessage({
  role,
  content,
  isStreaming = false,
  toolCalls = [],
}: MCPChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`flex gap-3 sm:gap-4 mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
          isUser
            ? 'bg-orange-100 dark:bg-orange-900/30'
            : 'bg-blue-100 dark:bg-blue-900/30'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 dark:text-orange-400" />
        ) : (
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
        )}
      </div>

      {/* Message content */}
      <div className="flex-1 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
        {/* Tool calls */}
        {toolCalls && toolCalls.length > 0 && (
          <div className="mb-3 space-y-2">
            {toolCalls.map((toolCall, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {toolCall.toolName}
                  </span>
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                
                {/* Tool parameters */}
                <div className="mb-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">参数:</p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs font-mono text-gray-800 dark:text-gray-200">
                    {JSON.stringify(toolCall.args, null, 2)}
                  </div>
                </div>

                {/* Tool result */}
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">结果:</p>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-xs font-mono text-gray-800 dark:text-gray-200 max-h-32 overflow-y-auto">
                    {typeof toolCall.result === 'string' 
                      ? toolCall.result 
                      : JSON.stringify(toolCall.result, null, 2)
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`rounded-lg px-4 sm:px-5 py-3 sm:py-4 ${
            isUser
              ? 'bg-orange-600 dark:bg-orange-700 text-white rounded-br-none'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
          }`}
        >
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {content}
            {isStreaming && (
              <span className="inline-block ml-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-current rounded-full animate-pulse"></span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
