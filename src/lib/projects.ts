import { createClient } from '@/lib/supabase/client'
import type { MetaFormat } from '@/shared/types/image'

export type Project = {
  id: string
  user_id: string
  name: string
  format_id: string
  format_label: string
  width: number
  height: number
  storage_path: string
  created_at: string
}

export async function saveProject(params: {
  name: string
  format: MetaFormat
  storagePath: string
}): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('projects').insert({
    user_id: user.id,
    name: params.name,
    format_id: params.format.id,
    format_label: params.format.label,
    width: params.format.width,
    height: params.format.height,
    storage_path: params.storagePath,
  })

  if (error) throw error
}

export async function listProjects(): Promise<Project[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function deleteProject(id: string, storagePath: string): Promise<void> {
  const supabase = createClient()

  const { error: storageError } = await supabase.storage
    .from('exports')
    .remove([storagePath])

  if (storageError) throw storageError

  const { error: dbError } = await supabase.from('projects').delete().eq('id', id)
  if (dbError) throw dbError
}
