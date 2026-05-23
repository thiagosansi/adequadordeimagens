// Accepts a pending invitation and adds the current user to the organization.
// Token must be valid, not expired, and not yet accepted.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createServiceClient()

    // Fetch invitation
    const { data: invitation } = await db
      .from('organization_invitations')
      .select('id, organization_id, email, role, expires_at, accepted_at')
      .eq('token', token)
      .maybeSingle()

    if (!invitation) {
      return NextResponse.json({ error: 'Convite não encontrado ou inválido.' }, { status: 404 })
    }

    if (invitation.accepted_at) {
      return NextResponse.json({ error: 'Este convite já foi aceito.' }, { status: 409 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Este convite expirou.' }, { status: 410 })
    }

    // Check if user is already a member
    const { data: existing } = await db
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      // Already a member — just mark invitation as accepted and succeed
      await db
        .from('organization_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      return NextResponse.json({ ok: true, orgId: invitation.organization_id })
    }

    // Add to org
    await db.from('organization_members').insert({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
      invited_by: null,
    })

    // Mark invitation accepted
    await db
      .from('organization_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return NextResponse.json({ ok: true, orgId: invitation.organization_id })
  } catch (err) {
    console.error('[invite/accept]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
