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

  return NextResponse.json({
    planId,
    exportsUsed: usageMap['export'] ?? 0,
    exportsLimit: (plan?.features?.exports_monthly ?? 15) as number,
    aiUsed: usageMap['ai_request'] ?? 0,
    aiLimit: (plan?.features?.ai_requests_monthly ?? 3) as number,
  })
}
