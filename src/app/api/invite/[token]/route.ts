// GET — public endpoint, returns invite metadata without requiring auth.
// Used by the login page to pre-fill email and show the org name.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params
    const db = createServiceClient()

    const { data: invitation } = await db
      .from('organization_invitations')
      .select('email, role, expires_at, accepted_at, organization_id')
      .eq('token', token)
      .maybeSingle()

    if (!invitation) {
      return NextResponse.json({ error: 'Convite não encontrado.' }, { status: 404 })
    }

    const { data: org } = await db
      .from('organizations')
      .select('name')
      .eq('id', invitation.organization_id)
      .maybeSingle()

    return NextResponse.json({
      email: invitation.email,
      orgName: org?.name ?? null,
      role: invitation.role,
      expired: new Date(invitation.expires_at) < new Date(),
      accepted: !!invitation.accepted_at,
    })
  } catch (err) {
    console.error('[invite/GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
