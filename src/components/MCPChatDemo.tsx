'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import { Response } from '@/components/ai-elements/response';
import {
  Suggestion,
} from '@/components/ai-elements/suggestion';
import { Tool, ToolHeader, ToolContent } from '@/components/ai-elements/tool';
import { GlobeIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { QUICK_PROMPTS } from '@/lib/mcp-quick-prompts';
import { DefaultChatTransport } from 'ai';



const models = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-2', name: 'Claude 2' },
  { id: 'claude-instant', name: 'Claude Instant' },
];

const MCPChatDemo = () => {
  // MCP服务器配置（隐藏但需要发送给后端）
  const mcpServers = [
    {
      id: 'default-stock',
      name: 'Stock Analysis Server',
      url: 'http://localhost:3000/api/mcp',
      description: '内置股票分析工具',
      enabled: true,
      transport: 'mcp' as const,
      tools: []
    }
  ];

  // 使用 useChat hook
  const { messages, sendMessage, status } = useChat({ 
    transport: new DefaultChatTransport({
      api: '/api/mcp-chat',
      body: {
        serverConfigs: mcpServers, // 将服务器配置发送到后端
      },
    })
  });

  // 状态管理
  const [model, setModel] = useState<string>(models[0].id);
  const [text, setText] = useState<string>('');
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  // 处理提交
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage({ parts: [{ type: 'text', text: message.text || 'Sent with attachments' }] });
    setText('');
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ parts: [{ type: 'text', text: suggestion }] });
  };




  return (
    <div className="relative flex size-full flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Header - 只在有消息时显示 */}
      {messages.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            股票分析助手
          </h2>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              MCP服务提供商
            </p>
            <p className="text-sm font-medium text-orange-600 dark:text-blue-400">
              ButtonUp MCP
            </p>
          </div>
        </div>
      )}

      {/* 聊天内容 - 只在有消息时显示 */}
      {messages.length > 0 && (
        <Conversation>
          <ConversationContent>
            {messages.map((message) => (
              <Message
                from={message.role}
                key={message.id}
              >
                <div>
                  {message.parts?.map((part, index) => {
                    if (part.type === 'dynamic-tool') {
                      return (
                        <Tool key={index} defaultOpen={false}>
                          <ToolHeader
                            title={part.toolName || '工具'}
                            type="tool-call"
                            state={part.state}
                          />
                          <ToolContent>
                            <div className="space-y-2">
                              <div>
                                <strong className="text-sm">参数:</strong>
                                <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(part.input, null, 2)}
                                </pre>
                              </div>
                              {part.output ? (
                                <div>
                                  <strong className="text-sm">执行结果:</strong>
                                  <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-x-auto max-h-32">
                                    {JSON.stringify(part.output, null, 2)}
                                  </pre>
                                </div>
                              ) : null}
                            </div>
                          </ToolContent>
                        </Tool>
                      );
                    } else if (part.type === 'text') {
                      return (
                        <MessageContent key={index} variant="contained" className="mt-3 mb-3">
                          <Response>{part.text}</Response>
                        </MessageContent>
                      );
                    }
                    return null;
                  })}
                </div>
                <MessageAvatar 
                  name={message.role === 'user' ? '用户' : 'AI股票分析助手'} 
                  src={message.role === 'user' ? 'https://github.com/user.png' : 'https://github.com/openai.png'} 
                />
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}
      
      <div className="grid shrink-0 gap-4 pt-4">
        <div className="px-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.slice(0, 2).map((prompt) => (
              <Suggestion
                key={prompt.id}
                onClick={() => handleSuggestionClick(prompt.prompt)}
                suggestion={prompt.title}
                className="text-xs sm:text-sm whitespace-normal max-w-[calc(50%-4px)]"
              />
            ))}
          </div>
        </div>
        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
              <PromptInputTextarea
                onChange={(event) => setText(event.target.value)}
                ref={textareaRef}
                value={text}
                placeholder="输入股票代码或公司名称... (例如：000001、平安银行、中国平安等)"
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <div className="hidden sm:block">
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                </div>
                <PromptInputButton
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  variant={useWebSearch ? 'default' : 'ghost'}
                  className="hidden sm:flex"
                >
                  <GlobeIcon size={16} />
                  <span className="hidden sm:inline">Search</span>
                </PromptInputButton>
                <PromptInputModelSelect onValueChange={setModel} value={model}>
                  <PromptInputModelSelectTrigger>
                    <PromptInputModelSelectValue />
                  </PromptInputModelSelectTrigger>
                  <PromptInputModelSelectContent>
                    {models.map((model) => (
                      <PromptInputModelSelectItem
                        key={model.id}
                        value={model.id}
                      >
                        {model.name}
                      </PromptInputModelSelectItem>
                    ))}
                  </PromptInputModelSelectContent>
                </PromptInputModelSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={(!text.trim() && !status) || status === 'streaming'}
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

export default MCPChatDemo;
