// GET  — list approval requests for an org (pending first, then others)
// POST — submit a project for approval

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

    const { data, error } = await supabase
      .from('approval_requests')
      .select(`
        id, status, comment, created_at, updated_at,
        project:projects(id, name, format_label, width, height),
        requester:user_profiles!approval_requests_requester_id_fkey(full_name),
        reviewer:user_profiles!approval_requests_reviewer_id_fkey(full_name)
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[approvals/GET]', error)
      return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 })
    }

    return NextResponse.json({ approvals: data ?? [] })
  } catch (err) {
    console.error('[approvals/GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const { orgId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { projectId } = await request.json() as { projectId: string }
    if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

    // Verify project belongs to this org
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, status, organization_id')
      .eq('id', projectId)
      .eq('organization_id', orgId)
      .maybeSingle()

    if (!project) {
      return NextResponse.json({ error: 'Project not found in this organization.' }, { status: 404 })
    }

    if (project.status === 'pending_approval') {
      return NextResponse.json({ error: 'Already pending approval.' }, { status: 409 })
    }

    const db = createServiceClient()

    // Cancel any previous open request for this project
    await db
      .from('approval_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('project_id', projectId)
      .eq('status', 'pending')

    // Create new approval request
    const { data: approval, error: approvalError } = await db
      .from('approval_requests')
      .insert({
        project_id: projectId,
        organization_id: orgId,
        requester_id: user.id,
        status: 'pending',
      })
      .select('id')
      .single()

    if (approvalError) {
      console.error('[approvals/POST] insert:', approvalError)
      return NextResponse.json({ error: 'Failed to create approval request' }, { status: 500 })
    }

    // Update project status
    await db
      .from('projects')
      .update({ status: 'pending_approval' })
      .eq('id', projectId)

    // Send email notification to org owners/admins if Resend is configured
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const { data: admins } = await db
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgId)
          .in('role', ['owner', 'admin'])

        if (admins && admins.length > 0) {
          const { data: authUsers } = await db.auth.admin.listUsers()
          const adminEmails = (authUsers?.users ?? [])
            .filter(u => admins.some(a => a.user_id === u.id))
            .map(u => u.email)
            .filter(Boolean) as string[]

          if (adminEmails.length > 0) {
            const { Resend } = await import('resend')
            const resend = new Resend(resendKey)
            const origin = new URL(request.url).origin
            const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'no-reply@adframe.com.br'

            await resend.emails.send({
              from: fromEmail,
              to: adminEmails,
              subject: `Aprovação solicitada: ${project.name}`,
              html: `
                <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
                  <h2 style="margin:0 0 8px;font-size:20px;color:#0f172a">Solicitação de aprovação</h2>
                  <p style="color:#64748b;font-size:14px;margin:0 0 24px">
                    O projeto <strong>${project.name}</strong> foi enviado para aprovação.
                  </p>
                  <a href="${origin}/app/org/${orgId}/approvals"
                     style="display:inline-block;background:#2563eb;color:#fff;font-size:14px;
                            font-weight:600;text-decoration:none;padding:12px 24px;border-radius:10px">
                    Ver inbox de aprovações
                  </a>
                </div>
              `,
            })
          }
        }
      } catch (emailErr) {
        console.error('[approvals/POST] email notification failed:', emailErr)
        // Non-fatal
      }
    }

    return NextResponse.json({ ok: true, approvalId: approval.id })
  } catch (err) {
    console.error('[approvals/POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
