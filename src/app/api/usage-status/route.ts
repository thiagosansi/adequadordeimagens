import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { ActiveSubscription } from '@/lib/stripe/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const period = new Date().toISOString().slice(0, 7)

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('entity_type', 'user')
    .eq('entity_id', user.id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  const subscription = sub as ActiveSubscription | null
  const plan = subscription?.plan
  const planId = plan?.id ?? 'free'

  const db = createServiceClient()
  const { data: usageRows } = await db
    .from('usage_counters')
    .select('action, count')
    .eq('entity_type', 'user')
    .eq('entity_id', user.id)
    .eq('user_id', user.id)
    .eq('period', period)

  const usageMap = Object.fromEntries(
    (usageRows ?? []).map((r) => [r.action, r.count as number]),
  )

  // null/undefined features_monthly means unlimited (paid plan with no cap)
  // Only fall back to free-tier defaults when there is no subscription at all
  const exportsLimit = subscription
    ? ((plan?.features?.exports_monthly as number | null) ?? 0)
    : 15
  const aiLimit = subscription
    ? ((plan?.features?.ai_requests_monthly as number | null) ?? 0)
    : 3

  return NextResponse.json({
    planId,
    exportsUsed: usageMap['export'] ?? 0,
    exportsLimit,
    aiUsed: usageMap['ai_request'] ?? 0,
    aiLimit,
  })
}
