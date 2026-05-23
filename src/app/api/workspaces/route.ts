// Returns the list of organizations the current user belongs to,
// along with their role in each. Used by the workspace switcher.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('organization_members')
      .select('role, organization:organizations(id, name, slug)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('[workspaces]', error)
      return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
    }

    const workspaces = (data ?? []).flatMap((m) => {
      const org = m.organization as unknown as { id: string; name: string; slug: string } | null
      if (!org) return []
      return [{ id: org.id, name: org.name, role: m.role }]
    })

    return NextResponse.json({ workspaces })
  } catch (err) {
    console.error('[workspaces]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
