import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const PLANS = ['free', 'pro', 'team', 'enterprise'] as const
type PlanId = (typeof PLANS)[number]

interface Body {
  entityType: 'user' | 'organization'
  entityId: string
  planId: PlanId
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim()).filter(Boolean)
    if (!adminEmails.includes(user.email ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as Body
    const { entityType, entityId, planId } = body

    if (!['user', 'organization'].includes(entityType) || !PLANS.includes(planId) || !entityId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const db = createServiceClient()

    if (planId === 'free') {
      // Remove active subscription — free is the default
      await db.from('subscriptions')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .in('status', ['active', 'trialing'])
      return NextResponse.json({ ok: true })
    }

    // Upsert active subscription
    const { data: existing } = await db.from('subscriptions')
      .select('id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (existing) {
      await db.from('subscriptions')
        .update({ plan_id: planId, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await db.from('subscriptions').insert({
        entity_type: entityType,
        entity_id: entityId,
        plan_id: planId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/set-plan]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
