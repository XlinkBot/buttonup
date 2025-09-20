import { createClient } from '@supabase/supabase-js'

// 服务端配置 - 使用服务端密钥，不暴露到客户端
const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase configuration is missing. Please add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your environment variables.')
}

// 创建服务端客户端，仅在服务端使用
export const supabaseAdmin = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Storage bucket name - configurable via environment variable
export const STORAGE_BUCKET = process.env.SUPABASE_BUCKET || 'files'

// 服务端文件操作函数 - 仅在 API 路由中使用

// Helper function to upload file (服务端)
export async function uploadFileServer(buffer: Buffer, fileName: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }
  
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, buffer, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName)

  return {
    path: data.path,
    fullPath: data.fullPath,
    id: data.id,
    publicUrl: urlData.publicUrl
  }
}

// Helper function to list files (服务端)
export async function listFilesServer() {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }
  
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (error) {
    throw error
  }

  return data
}

// Helper function to delete file (服务端)
export async function deleteFileServer(path: string) {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured')
  }
  
  const { data, error } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .remove([path])

  if (error) {
    throw error
  }

  return data
}

// Helper function to get file URL (服务端)
export function getFileUrlServer(path: string) {
  if (!supabaseAdmin) {
    return ''
  }
  
  const { data } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)

  return data.publicUrl
}
