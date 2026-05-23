// GET  — list members of an organization (only for members)
// DELETE — remove a member (only owners and admins, cannot remove yourself if sole owner)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createServiceClient()

    // Resolve caller's own role first (independent of full member list)
    const { data: callerMembership } = await db
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle()

    const callerRole = callerMembership?.role ?? null

    const { data: members, error } = await db
      .from('organization_members')
      .select('user_id, role, joined_at, profile:user_profiles(full_name)')
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: true, nullsFirst: false })

    if (error) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })

    // Get emails from auth.users via service client
    const userIds = (members ?? []).map((m) => m.user_id)
    const { data: authUsers } = await db.auth.admin.listUsers()
    const emailMap = Object.fromEntries(
      (authUsers?.users ?? [])
        .filter((u) => userIds.includes(u.id))
        .map((u) => [u.id, u.email ?? '']),
    )

    const result = (members ?? []).map((m) => ({
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      fullName: (m.profile as { full_name?: string } | null)?.full_name ?? null,
      email: emailMap[m.user_id] ?? '',
      isCurrentUser: m.user_id === user.id,
    }))

    return NextResponse.json({ members: result, callerRole })
  } catch (err) {
    console.error('[members/GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { userId } = await request.json() as { userId: string }

    // Only owners and admins can remove members
    const { data: callerMembership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!callerMembership || !['owner', 'admin'].includes(callerMembership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cannot remove the sole owner
    if (userId === user.id && callerMembership.role === 'owner') {
      const db = createServiceClient()
      const { count } = await db
        .from('organization_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('role', 'owner')

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'Você não pode remover o único dono da organização.' },
          { status: 400 },
        )
      }
    }

    const db = createServiceClient()
    await db
      .from('organization_members')
      .delete()
      .eq('organization_id', orgId)
      .eq('user_id', userId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[members/DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
