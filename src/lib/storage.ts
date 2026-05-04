import { createClient } from '@/lib/supabase/client'

const BUCKET = 'exports'

export async function uploadExport(
  userId: string,
  blob: Blob,
  formatId: string,
): Promise<string> {
  const supabase = createClient()
  const timestamp = Date.now()
  const path = `${userId}/${timestamp}_${formatId}.jpg`

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })

  if (error) throw error
  return path
}

export async function getExportUrl(storagePath: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60) // 1 hora

  if (error) throw error
  return data.signedUrl
}

export async function deleteExport(storagePath: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (error) throw error
}
