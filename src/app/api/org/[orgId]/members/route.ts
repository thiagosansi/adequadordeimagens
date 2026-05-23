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

    // No direct FK between organization_members and user_profiles —
    // fetch member rows without join, then enrich with profiles and emails separately.
    const { data: members, error } = await db
      .from('organization_members')
      .select('user_id, role, joined_at')
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: true })

    if (error) return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })

    const userIds = (members ?? []).map((m) => m.user_id)

    // Fetch full names from user_profiles
    const { data: profiles } = await db
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

    const nameMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.full_name ?? null]),
    )

    // Fetch emails from auth.users
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
      fullName: nameMap[m.user_id] ?? null,
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
