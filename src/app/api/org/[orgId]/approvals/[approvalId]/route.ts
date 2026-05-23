// PATCH — approve or reject a pending approval request
// Only org owners and admins can review.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

interface ReviewBody {
  decision: 'approved' | 'rejected'
  comment?: string
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orgId: string; approvalId: string }> },
) {
  try {
    const { orgId, approvalId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json() as ReviewBody
    const { decision, comment } = body

    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json({ error: 'decision must be "approved" or "rejected"' }, { status: 400 })
    }

    // Verify caller is owner or admin
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db = createServiceClient()
    const now = new Date().toISOString()

    // Fetch approval to get project_id
    const { data: approval } = await db
      .from('approval_requests')
      .select('id, project_id, status')
      .eq('id', approvalId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    if (approval.status !== 'pending') {
      return NextResponse.json({ error: 'This request is no longer pending.' }, { status: 409 })
    }

    // Update approval request
    await db
      .from('approval_requests')
      .update({ status: decision, reviewer_id: user.id, comment: comment ?? null, updated_at: now })
      .eq('id', approvalId)

    // Sync project status
    const projectStatus = decision === 'approved' ? 'approved' : 'rejected'
    await db
      .from('projects')
      .update({ status: projectStatus })
      .eq('id', approval.project_id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[approvals/PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
