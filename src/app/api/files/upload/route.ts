import { NextRequest, NextResponse } from 'next/server'
import { uploadFileServer } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadResults = []

    for (const file of files) {
      if (!file.name) continue

      // 转换 File 为 Buffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 生成唯一文件名
      const fileName = `${Date.now()}-${file.name}`

      try {
        const result = await uploadFileServer(buffer, fileName)
        uploadResults.push({
          originalName: file.name,
          fileName,
          size: file.size,
          type: file.type,
          ...result
        })
      } catch (error) {
        console.error('Upload error for file:', file.name, error)
        uploadResults.push({
          originalName: file.name,
          error: error instanceof Error ? error.message : 'Upload failed'
        })
      }
    }

    return NextResponse.json({
      message: `Uploaded ${uploadResults.filter(r => !r.error).length} of ${files.length} files`,
      results: uploadResults
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
