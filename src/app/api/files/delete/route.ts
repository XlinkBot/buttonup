import { NextRequest, NextResponse } from 'next/server'
import { deleteFileServer } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileName = searchParams.get('fileName')

    if (!fileName) {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400 }
      )
    }

    await deleteFileServer(fileName)

    return NextResponse.json({
      message: 'File deleted successfully',
      fileName
    })

  } catch (error) {
    console.error('Delete file API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete file' },
      { status: 500 }
    )
  }
}
