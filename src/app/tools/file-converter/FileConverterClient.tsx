'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { FileText, Upload, Copy, Check, AlertCircle, Loader2, Download, Home, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function FileConverterClient() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ markdown: string; filename: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const fileName = selectedFile.name.toLowerCase();
      const fileType = selectedFile.type;
      
      const isValidFile = 
        fileType === 'application/pdf' || fileName.endsWith('.pdf') ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx') ||
        fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || fileName.endsWith('.pptx');
      
      if (!isValidFile) {
        setError('不支持的文件类型。请选择 PDF、DOCX 或 PPTX 文件。');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('请选择一个文件');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/tools/file-converter', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '转换失败');
      }

      setResult({
        markdown: data.markdown,
        filename: data.filename
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '转换过程中发生错误');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.markdown) return;

    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadTextFile = () => {
    if (!result?.markdown) return;

    // Generate filename with .txt extension
    const originalName = result.filename;
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const txtFilename = `${nameWithoutExt}.txt`;

    // Create blob and download
    const blob = new Blob([result.markdown], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = txtFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="mb-8" aria-label="面包屑导航">
          <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <Link 
                href="/" 
                className="flex items-center hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                <Home className="w-4 h-4 mr-1" />
                首页
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4" />
            </li>
            <li>
              <Link 
                href="/tools" 
                className="hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                在线工具
              </Link>
            </li>
            <li>
              <ChevronRight className="w-4 h-4" />
            </li>
            <li className="text-gray-900 dark:text-gray-100 font-medium">
              文件转换工具
            </li>
          </ol>
        </nav>

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mr-4">
              <FileText className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                文件转换工具
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                支持 PDF、DOCX、PPTX 文件转换为文本
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-8 mb-8">
          <div className="text-center mb-6">
            <Upload className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              上传文件
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              选择 PDF、DOCX 或 PPTX 文件进行转换，最大支持5MB
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="file"
                id="file"
                accept=".pdf,.docx,.pptx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isLoading}
              />
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      {file ? file.name : '点击选择文件'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      支持 PDF、DOCX、PPTX 格式
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={!file || isLoading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  转换中...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  转换为文本
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-8 text-center">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-300">
              正在转换文件，请稍候...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                  转换失败
                </h3>
                <p className="text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result State */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    文本结果
                  </h3> 
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    文件: {result.filename}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={downloadTextFile}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    下载
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        复制
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                <pre className="text-gray-100 text-sm leading-relaxed whitespace-pre-wrap font-mono">
                  {result.markdown}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              关于此工具
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              完全免费，无任何限制，支持 PDF、DOCX、PPTX 文件转换。不缓存用户文件，上传文件转换后立刻销毁，安全放心
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
