import { createClient } from '@/lib/supabase/client'
import type { MetaFormat } from '@/shared/types/image'

export type ProjectStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected'

export type Project = {
  id: string
  user_id: string
  name: string
  format_id: string
  format_label: string
  width: number
  height: number
  storage_path: string
  organization_id: string | null
  status: ProjectStatus
  created_at: string
  creator_name?: string | null  // populated when listing org projects
}

export async function saveProject(params: {
  name: string
  format: MetaFormat
  storagePath: string
  organizationId?: string | null
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
    organization_id: params.organizationId ?? null,
  })

  if (error) throw error
}

// Lists projects scoped to a context:
//   organizationId = null  → personal projects only (organization_id IS NULL)
//   organizationId = id    → org projects, with creator name from user_profiles
export async function listProjects(organizationId?: string | null): Promise<Project[]> {
  const supabase = createClient()

  let query = supabase
    .from('projects')
    .select('*, creator:user_profiles!projects_user_id_fkey(full_name)')
    .order('created_at', { ascending: false })

  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  } else {
    query = query.is('organization_id', null)
  }

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).map((row) => ({
    ...row,
    creator_name: (row.creator as { full_name?: string } | null)?.full_name ?? null,
  }))
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
