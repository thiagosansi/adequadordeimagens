// POST — re-inserts the owner membership if it's missing.
// Safe: only the org's owner_id can trigger this, verified against the organizations table.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createServiceClient()

    // Verify the caller is the org's owner
    const { data: org } = await db
      .from('organizations')
      .select('owner_id')
      .eq('id', orgId)
      .maybeSingle()

    if (!org) return NextResponse.json({ error: 'Org not found' }, { status: 404 })
    if (org.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Upsert the owner membership
    const { error } = await db
      .from('organization_members')
      .upsert(
        { organization_id: orgId, user_id: user.id, role: 'owner', joined_at: new Date().toISOString() },
        { onConflict: 'organization_id,user_id' },
      )

    if (error) {
      console.error('[recover-owner] upsert failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[recover-owner]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
