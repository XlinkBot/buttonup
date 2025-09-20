import { NextResponse } from 'next/server'
import { listFilesServer, getFileUrlServer } from '@/lib/supabase'

export async function GET() {
  try {
    const files = await listFilesServer()
    
    // 为每个文件添加公共URL
    const filesWithUrls = files.map(file => ({
      ...file,
      publicUrl: getFileUrlServer(file.name)
    }))

    return NextResponse.json({
      files: filesWithUrls,
      count: filesWithUrls.length
    })

  } catch (error) {
    console.error('List files API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    )
  }
}
