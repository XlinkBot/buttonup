'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Upload, FileText, ImageIcon, Video, Download, Trash2, Calendar, Eye, FileIcon, Loader2 } from 'lucide-react'
// 使用 API 路由，不需要直接导入 Supabase 客户端
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface FileData {
  name: string
  id: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: Record<string, unknown>
  publicUrl: string
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [urlUploading, setUrlUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState('')

  // 获取文件列表
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/files/list')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '获取文件列表失败')
      }
      
      setFiles(data.files)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取文件列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      Array.from(selectedFiles).forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '文件上传失败')
      }

      // 检查是否有部分文件上传失败
      const failedUploads = data.results.filter((r: { error?: string }) => r.error)
      if (failedUploads.length > 0) {
        setError(`${failedUploads.length} 个文件上传失败`)
      }

      await fetchFiles() // 重新获取文件列表
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件上传失败')
    } finally {
      setUploading(false)
      // 清空input
      event.target.value = ''
    }
  }

  // 处理 URL 上传
  const handleUrlUpload = async () => {
    if (!urlInput.trim()) return

    // 支持多行 URL 输入
    const urls = urlInput.split('\n').map(url => url.trim()).filter(url => url)
    if (urls.length === 0) return

    setUrlUploading(true)
    setError(null)

    try {
      const response = await fetch('/api/files/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urls })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'URL 文件上传失败')
      }

      // 检查是否有部分 URL 上传失败
      const failedUploads = data.results.filter((r: { error?: string }) => r.error)
      if (failedUploads.length > 0) {
        setError(`${failedUploads.length} 个 URL 上传失败`)
      }

      await fetchFiles() // 重新获取文件列表
      setUrlInput('') // 清空输入
    } catch (err) {
      setError(err instanceof Error ? err.message : 'URL 文件上传失败')
    } finally {
      setUrlUploading(false)
    }
  }

  // 处理文件删除
  const handleFileDelete = async (fileName: string) => {
    if (!confirm('确定要删除这个文件吗？此操作不可撤销。')) return

    try {
      const response = await fetch(`/api/files/delete?fileName=${encodeURIComponent(fileName)}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '删除文件失败')
      }

      await fetchFiles() // 重新获取文件列表
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除文件失败')
    }
  }

  // 获取文件图标
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-5 h-5" />
    } else if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('xml')) {
      return <FileText className="w-5 h-5" />
    }
    return <FileIcon className="w-5 h-5" />
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 获取文件预览URL（如果是图片）
  const getPreviewUrl = (file: FileData, mimeType: string | undefined) => {
    if (mimeType && mimeType.startsWith('image/')) {
      return file.publicUrl
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                文件管理
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                上传、管理和预览您的文件
              </p>
            </div>
            
            {/* 上传模式选择 */}
            <div className="flex items-center space-x-4">
              {/* 模式切换按钮 */}
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setUploadMode('file')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    uploadMode === 'file'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  本地文件
                </button>
                <button
                  onClick={() => setUploadMode('url')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    uploadMode === 'url'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  URL 链接
                </button>
              </div>

              {/* 上传按钮 */}
              {uploadMode === 'file' ? (
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  <button
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    {uploading ? '上传中...' : '选择文件'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleUrlUpload}
                  disabled={urlUploading || !urlInput.trim()}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {urlUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {urlUploading ? '下载中...' : '从 URL 上传'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* URL 输入区域 */}
        {uploadMode === 'url' && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              文件 URL 地址
            </label>
            <textarea
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="输入文件 URL 地址，每行一个&#10;例如:&#10;https://example.com/image.jpg&#10;https://example.com/document.pdf"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              rows={4}
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              支持多个 URL，每行一个。支持常见的图片、文档、音视频格式。文件大小限制：50MB
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 文件统计 */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <FileIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总文件数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{files.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ImageIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">图片文件</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {files.filter(f => typeof f.metadata?.mimetype === 'string' && f.metadata.mimetype.startsWith('image/')).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Video className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">视频文件</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {files.filter(f => typeof f.metadata?.mimetype === 'string' && f.metadata.mimetype.startsWith('video/')).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 文件列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              还没有文件
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              点击上方的&ldquo;上传文件&rdquo;按钮开始上传您的第一个文件
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
              {files.map((file) => {
                const mimeType = typeof file.metadata?.mimetype === 'string' ? file.metadata.mimetype : ''
                const previewUrl = getPreviewUrl(file, mimeType)
                
                return (
                  <div key={file.name} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* 文件预览或图标 */}
                    <div className="mb-3">
                      {previewUrl ? (
                        <div className="relative w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                          <Image
                            src={previewUrl}
                            alt={`预览 ${file.name}`}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center">
                          <div className="text-gray-400 dark:text-gray-500">
                            {getFileIcon(mimeType)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 文件信息 */}
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate" title={file.name}>
                        {file.name}
                      </h3>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDistanceToNow(new Date(file.created_at), { 
                            addSuffix: true, 
                            locale: zhCN 
                          })}
                        </div>
                        
                        {typeof file.metadata?.size === 'number' && (
                          <div>
                            大小: {formatFileSize(file.metadata.size)}
                          </div>
                        )}
                        
                        {mimeType && (
                          <div>
                            类型: {mimeType}
                          </div>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2 pt-2">
                        <a
                          href={file.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          预览
                        </a>
                        
                        <a
                          href={file.publicUrl}
                          download={file.name}
                          className="flex items-center px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          下载
                        </a>
                        
                        <button
                          onClick={() => handleFileDelete(file.name)}
                          className="flex items-center px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
