'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { 
  Upload, 
  FileText, 
  ImageIcon, 
  Video, 
  Download, 
  Trash2, 
  Calendar, 
  Eye, 
  FileIcon, 
  Loader2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  List,
  Grid
} from 'lucide-react'
// 使用 API 路由，不需要直接导入 Supabase 客户端

// 文件数据接口
interface FileData {
  name: string
  id: string
  created_at: string
  updated_at: string
  last_accessed_at: string
  metadata: Record<string, unknown>
  publicUrl: string
  downloadUrl: string
}

// 日期分组数据接口
interface DateGroup {
  date: string
  displayDate: string
  files: FileData[]
  fileCount: number
  totalSize: number
}

// 组织文件数据接口
interface OrganizedData {
  dateGroups: DateGroup[]
  summary: {
    totalFiles: number
    totalSize: number
    dateRange: string
    groupCount: number
  }
}

export default function FilesPage() {
  const [organizedData, setOrganizedData] = useState<OrganizedData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [urlUploading, setUrlUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState('')
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // 获取文件列表（按日期组织）
  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/files/list?mode=organized')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '获取文件列表失败')
      }
      
      setOrganizedData(data)
      
      // 默认展开最新的3个日期分组
      if (data.dateGroups && data.dateGroups.length > 0) {
        const latestDates = data.dateGroups.slice(0, 3).map((group: DateGroup) => group.date)
        setExpandedDates(new Set(latestDates))
      }
      
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

  // 切换日期分组展开状态
  const toggleDateGroup = (date: string) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDates(newExpanded)
  }

  // 获取文件图标
  const getFileIcon = (fileName: string, mimeType?: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mime = mimeType?.toLowerCase()

    if (mime?.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    } else if (mime?.startsWith('video/')) {
      return <Video className="w-4 h-4" />
    } else if (extension === 'pdf') {
      return <FileText className="w-4 h-4 text-red-500" />
    } else {
      return <FileIcon className="w-4 h-4" />
    }
  }

  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  // 格式化时间显示
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return '未知时间'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <Folder className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                文件管理
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                按日期组织的文件管理系统
              </p>
            </div>
            
            {/* 视图控制 */}
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <List className="w-4 h-4 mr-1" />
                  列表
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  <Grid className="w-4 h-4 mr-1" />
                  网格
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 上传控制面板 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              文件上传
            </h2>
            
            {/* 上传模式切换 */}
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
          </div>

          {/* URL 输入区域 */}
          {uploadMode === 'url' && (
            <div className="mb-4">
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
            </div>
          )}

          {/* 上传按钮 */}
          <div className="flex items-center space-x-4">
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

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-600 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 统计面板 */}
        {organizedData?.summary && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Folder className="w-8 h-8 text-blue-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {organizedData.summary.groupCount}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">日期分组</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <FileIcon className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {organizedData.summary.totalFiles}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">文件总数</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-purple-500 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatFileSize(organizedData.summary.totalSize)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">总大小</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {organizedData.summary.dateRange}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">日期范围</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 文件列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        ) : !organizedData || organizedData.dateGroups.length === 0 ? (
          <div className="text-center py-12">
            <FileIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              还没有文件
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              上传您的第一个文件开始使用文件管理系统
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {organizedData.dateGroups.map((dateGroup) => (
              <div key={dateGroup.date} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* 日期分组头部 */}
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => toggleDateGroup(dateGroup.date)}
                >
                  <div className="flex items-center">
                    {expandedDates.has(dateGroup.date) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 mr-2" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 mr-2" />
                    )}
                    {expandedDates.has(dateGroup.date) ? (
                      <FolderOpen className="w-5 h-5 text-blue-500 mr-3" />
                    ) : (
                      <Folder className="w-5 h-5 text-blue-500 mr-3" />
                    )}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {dateGroup.displayDate}
                    </h3>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4">
                    <span>{dateGroup.fileCount} 个文件</span>
                    <span>{formatFileSize(dateGroup.totalSize)}</span>
                  </div>
                </div>

                {/* 文件列表 */}
                {expandedDates.has(dateGroup.date) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {viewMode === 'list' ? (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {dateGroup.files.map((file) => (
                          <div key={file.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1 min-w-0">
                                {getFileIcon(file.name, file.metadata?.mimetype as string)}
                                <div className="ml-3 flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                    {file.name}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatFileSize((file.metadata?.size as number) || 0)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTime(file.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2 ml-4">
                                <a
                                  href={file.publicUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                  title="查看文件"
                                >
                                  <Eye className="w-4 h-4" />
                                </a>
                                <a
                                  href={file.downloadUrl}
                                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                                  title="下载文件"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleFileDelete(file.name)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="删除文件"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* 图片预览 */}
                            {file.metadata?.mimetype && (file.metadata.mimetype as string).startsWith('image/') ? (
                              <div className="mt-3">
                                <Image
                                  src={file.publicUrl}
                                  alt={file.name}
                                  width={200}
                                  height={150}
                                  className="rounded-lg object-cover"
                                />
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {dateGroup.files.map((file) => (
                          <div key={file.id} className="group relative bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <div className="flex flex-col items-center">
                              {file.metadata?.mimetype && (file.metadata.mimetype as string).startsWith('image/') ? (
                                <Image
                                  src={file.publicUrl}
                                  alt={file.name}
                                  width={80}
                                  height={80}
                                  className="rounded-lg object-cover mb-2"
                                />
                              ) : (
                                <div className="w-20 h-20 flex items-center justify-center bg-white dark:bg-gray-600 rounded-lg mb-2">
                                  {getFileIcon(file.name, file.metadata?.mimetype as string)}
                                </div>
                              )}
                              
                              <p className="text-xs text-center text-gray-900 dark:text-gray-100 truncate w-full" title={file.name}>
                                {file.name}
                              </p>
                              
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex space-x-1">
                                  <a
                                    href={file.publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow text-gray-600 dark:text-gray-300 hover:text-blue-500"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </a>
                                  <button
                                    onClick={() => handleFileDelete(file.name)}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow text-gray-600 dark:text-gray-300 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
