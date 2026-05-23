// Quota checking and usage tracking for the AdFrame billing system.
//
// Enforcement flow for every gated action:
//   1. Resolve active entity (personal or org) from the adframe-workspace cookie
//   2. Get the entity's active subscription + plan limits
//   3. Compare current period usage against the limit
//   4. If org quota is exhausted → fallback to user's personal Pro (Team→Pro chain)
//   5. Increment counter only when the action is allowed
//
// All DB writes go through the service client to bypass RLS.
// The increment_usage() function is atomic (INSERT … ON CONFLICT DO UPDATE).

import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import type { EntityType, PlanFeatures } from '@/lib/stripe/types'

export type QuotaAction = 'export' | 'ai_request'

export interface QuotaResult {
  allowed: boolean
  remaining: number        // -1 = unlimited
  limit: number            // -1 = unlimited
  entityType: EntityType
  entityId: string
  upgradeRequired: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7) // 'YYYY-MM'
}

// Reads the active workspace cookie to determine the billing entity.
export async function resolveActiveEntity(
  userId: string,
): Promise<{ entityType: EntityType; entityId: string }> {
  const cookieStore = await cookies()
  const raw = cookieStore.get('adframe-workspace')?.value ?? ''
  const orgId = raw ? decodeURIComponent(raw) : null
  if (orgId) return { entityType: 'organization', entityId: orgId }
  return { entityType: 'user', entityId: userId }
}

// Returns the effective monthly limit for an entity/action.
// -1 = unlimited. For org plans, limit is multiplied by seat_count.
async function getEffectiveLimit(
  entityType: EntityType,
  entityId: string,
  action: QuotaAction,
): Promise<number> {
  const db = createServiceClient()

  const { data: sub } = await db
    .from('subscriptions')
    .select('seat_count, plan:plans(features)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  // No subscription → free plan defaults
  if (!sub) {
    return action === 'ai_request' ? 3 : 15
  }

  const features = (sub.plan as unknown as { features: PlanFeatures }).features
  const base = action === 'ai_request'
    ? features.ai_requests_monthly
    : features.exports_monthly

  if (base === -1) return -1

  // Team org: limit is per seat
  if (entityType === 'organization') {
    return base * (sub.seat_count ?? 1)
  }

  return base
}

// Returns total usage count for an entity/action/period.
// For organizations: sums all members' individual counters.
// For users: returns only that user's counter.
async function getTotalUsage(
  entityType: EntityType,
  entityId: string,
  userId: string,
  action: QuotaAction,
  period: string,
): Promise<number> {
  const db = createServiceClient()

  if (entityType === 'organization') {
    const { data } = await db
      .from('usage_counters')
      .select('count')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('action', action)
      .eq('period', period)

    return (data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0)
  }

  const { data } = await db.rpc('get_usage', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_user_id: userId,
    p_action: action,
    p_period: period,
  })

  return (data as number) ?? 0
}

// Atomically increments the usage counter for a user within an entity.
async function incrementUsage(
  entityType: EntityType,
  entityId: string,
  userId: string,
  action: QuotaAction,
  period: string,
): Promise<void> {
  const db = createServiceClient()

  await db.rpc('increment_usage', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_user_id: userId,
    p_action: action,
    p_period: period,
  })
}

// ── Main entry point ──────────────────────────────────────────────────────────

// Checks quota for an action and, if allowed, atomically increments the counter.
// Implements the Team→Pro fallback: if org quota is exhausted, the user's
// personal subscription is checked as a last resort.
export async function checkAndConsumeQuota(
  userId: string,
  entityType: EntityType,
  entityId: string,
  action: QuotaAction,
): Promise<QuotaResult> {
  const period = currentPeriod()
  const limit = await getEffectiveLimit(entityType, entityId, action)

  // Unlimited plan
  if (limit === -1) {
    await incrementUsage(entityType, entityId, userId, action, period)
    return { allowed: true, remaining: -1, limit: -1, entityType, entityId, upgradeRequired: false }
  }

  const current = await getTotalUsage(entityType, entityId, userId, action, period)

  if (current < limit) {
    await incrementUsage(entityType, entityId, userId, action, period)
    return {
      allowed: true,
      remaining: limit - current - 1,
      limit,
      entityType,
      entityId,
      upgradeRequired: false,
    }
  }

  // Org quota exhausted → try personal Pro fallback (transparent to the user)
  if (entityType === 'organization') {
    const fallback = await checkAndConsumeQuota(userId, 'user', userId, action)
    if (fallback.allowed) return fallback
  }

  return {
    allowed: false,
    remaining: 0,
    limit,
    entityType,
    entityId,
    upgradeRequired: true,
  }
}
