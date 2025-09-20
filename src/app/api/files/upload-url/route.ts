import { NextRequest, NextResponse } from 'next/server'
import { uploadFileServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls } = body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'No URLs provided' },
        { status: 400 }
      )
    }

    const uploadResults = []

    for (const url of urls) {
      if (!url || typeof url !== 'string') {
        uploadResults.push({
          url,
          error: 'Invalid URL'
        })
        continue
      }

      try {
        // 验证 URL 格式
        const urlObj = new URL(url)
        
        // 发起网络请求下载文件
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        // 检查文件大小（限制为 50MB）
        const contentLength = response.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
          throw new Error('File too large (max 50MB)')
        }

        // 获取文件内容
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 从 URL 或 Content-Disposition 头部获取文件名
        let fileName = urlObj.pathname.split('/').pop() || 'download'
        
        // 如果没有扩展名，尝试从 Content-Type 推断
        if (!fileName.includes('.')) {
          const contentType = response.headers.get('content-type')
          if (contentType) {
            const ext = getExtensionFromMimeType(contentType)
            if (ext) {
              fileName += ext
            }
          }
        }

        // 添加时间戳避免重名
        const timestamp = Date.now()
        const fileExtension = fileName.includes('.') ? fileName.split('.').pop() : ''
        const baseName = fileName.includes('.') ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName
        const uniqueFileName = `${timestamp}-${baseName}${fileExtension ? '.' + fileExtension : ''}`

        // 上传到 Supabase
        const result = await uploadFileServer(buffer, uniqueFileName)
        
        uploadResults.push({
          url,
          originalName: fileName,
          fileName: uniqueFileName,
          size: buffer.length,
          type: response.headers.get('content-type') || 'application/octet-stream',
          ...result
        })

      } catch (error) {
        console.error('URL upload error for:', url, error)
        uploadResults.push({
          url,
          error: error instanceof Error ? error.message : 'Upload failed'
        })
      }
    }

    const successCount = uploadResults.filter(r => !r.error).length
    const totalCount = urls.length

    return NextResponse.json({
      message: `Uploaded ${successCount} of ${totalCount} files from URLs`,
      results: uploadResults
    })

  } catch (error) {
    console.error('URL upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 从 MIME 类型推断文件扩展名
function getExtensionFromMimeType(mimeType: string): string | null {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'text/html': '.html',
    'application/json': '.json',
    'application/xml': '.xml',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'video/quicktime': '.mov',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
  }

  return mimeToExt[mimeType.toLowerCase()] || null
}
