'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { createPostAction } from '@/lib/actions';
import { SearchStock } from '@/types/stock';
import { Loader2, X, Hash, TrendingUp } from 'lucide-react';

interface PostComposerProps {
  placeholder?: string;
  className?: string;
}

export function PostComposer({ 
  placeholder = "有什么新鲜事？", 
  className = ""
}: PostComposerProps) {
  const [content, setContent] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchStock[]>([]);
  const [currentMention, setCurrentMention] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // 解析 @ 提及
  const parseMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  };

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setContent(value);
    
    // 检查是否在输入 @
    const beforeCursor = value.substring(0, cursorPos);
    const atMatch = beforeCursor.match(/@(\w*)$/);
    
    if (atMatch) {
      const mention = atMatch[1];
      setCurrentMention(mention);
      setMentionStart(beforeCursor.lastIndexOf('@'));
      
      if (mention.length >= 1) {
        searchStocks(mention);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
      setCurrentMention('');
      setMentionStart(-1);
    }
  };

  // 搜索股票
  const searchStocks = async (query: string) => {
    if (query.length < 1) return;
    
    try {
      setIsSearching(true);
      const response = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.stocks || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error searching stocks:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // 选择建议
  const selectSuggestion = (stock: SearchStock) => {
    if (mentionStart === -1) return;
    
    const beforeMention = content.substring(0, mentionStart);
    const afterMention = content.substring(mentionStart + currentMention.length + 1);
    const newContent = `${beforeMention}@${stock.symbol} ${afterMention}`;
    
    setContent(newContent);
    setShowSuggestions(false);
    setCurrentMention('');
    setMentionStart(-1);
    
    // 重新聚焦到文本框
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newCursorPos = beforeMention.length + stock.symbol.length + 2;
      textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }
  };

  // 处理表单提交
  const handleSubmit = async (formData: FormData) => {
    if (!content.trim() || isPending) return;
    
    const mentions = parseMentions(content);
    formData.set('mentions', JSON.stringify(mentions));
    
    startTransition(async () => {
      try {
        await createPostAction(formData);
        setContent('');
        setShowComposer(false);
      } catch (error) {
        console.error('Failed to create post:', error);
        // 这里可以添加错误提示
      }
    });
  };

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const characterCount = content.length;
  const maxLength = 280;
  const hasContent = content.trim().length > 0;
  const mentions = parseMentions(content);

  // 如果没有显示编辑器，显示触发按钮
  if (!showComposer) {
    return (
      <div className={`p-4 ${className}`}>
        <button
          onClick={() => setShowComposer(true)}
          className="w-full flex items-center space-x-3 p-4 rounded-xl 
                   border border-gray-200 dark:border-gray-700 
                   hover:bg-gray-50 dark:hover:bg-gray-900/50
                   transition-colors group text-left"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            <Hash className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-gray-500 dark:text-gray-400 text-lg">
              {placeholder}
            </div>
            <div className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              支持@股票代码，获取AI专家分析
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 ${className}`}>
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">发起讨论</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">分享投资观点</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowComposer(false);
              setContent('');
            }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 文本输入区域 */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            name="content"
            value={content}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isPending}
            className="w-full min-h-[120px] max-h-[300px] p-4 border border-gray-200 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-900 text-gray-900 dark:text-white 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
                     placeholder-gray-500 dark:placeholder-gray-400 text-lg leading-relaxed
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ overflow: 'hidden' }}
          />
          
          {/* @ 建议下拉框 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => selectSuggestion(stock)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 
                           border-b border-gray-100 dark:border-gray-600 last:border-b-0
                           focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      $
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        ${stock.symbol}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {stock.shortname || stock.longname}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {isSearching && (
                <div className="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                  搜索中...
                </div>
              )}
            </div>
          )}
        </div>

        {/* 提及的股票预览 */}
        {mentions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mentions.map((mention, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                         bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                <span className="mr-1">$</span>
                {mention}
              </span>
            ))}
          </div>
        )}

        {/* 底部工具栏 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {/* 字符计数 */}
            {content.length > 0 && (
              <div className={`text-sm ${
                characterCount > maxLength ? 'text-red-500' : 
                characterCount > maxLength * 0.8 ? 'text-yellow-500' : 
                'text-gray-500 dark:text-gray-400'
              }`}>
                {characterCount > maxLength * 0.8 && `${characterCount}/${maxLength}`}
              </div>
            )}
            
            {/* 提示信息 */}
            <div className="text-xs text-gray-400 dark:text-gray-500">
              使用@符号提及股票代码
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 取消按钮 */}
            <button
              type="button"
              onClick={() => {
                setShowComposer(false);
                setContent('');
              }}
              disabled={isPending}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 
                       font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              取消
            </button>
            
            {/* 发帖按钮 */}
            <button
              type="submit"
              disabled={isPending || !content.trim() || characterCount > maxLength}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-600
                       text-white font-bold rounded-lg transition-colors text-sm
                       disabled:cursor-not-allowed disabled:opacity-50 flex items-center space-x-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>发布中...</span>
                </>
              ) : (
                <span>发布讨论</span>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}