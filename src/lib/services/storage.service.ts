import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface UploadResult {
  path: string
  url: string
  size: number
}

/**
 * Storage Service — file upload/download management.
 * Wraps Supabase Storage with progress tracking and cleanup.
 */
export const StorageService = {
  /**
   * Upload a file to Supabase Storage.
   */
  async upload(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<UploadResult> {
    const supabase = getSupabase()
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: options?.contentType || file.type,
        upsert: options?.upsert || false,
      })

    if (error) throw error

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      path: data.path,
      url: urlData.publicUrl,
      size: file.size,
    }
  },

  /**
   * Delete a file from Supabase Storage.
   */
  async remove(bucket: string, paths: string[]): Promise<void> {
    const supabase = getSupabase()
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
  },

  /**
   * Get a signed URL for private files.
   */
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const supabase = getSupabase()
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  },

  /**
   * Get storage usage for an org.
   */
  async getUsage(bucket: string, prefix: string): Promise<{ fileCount: number; totalSize: number }> {
    const supabase = getSupabase()
    const { data, error } = await supabase.storage.from(bucket).list(prefix)

    if (error || !data) return { fileCount: 0, totalSize: 0 }

    const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0)
    return { fileCount: data.length, totalSize }
  },
}
