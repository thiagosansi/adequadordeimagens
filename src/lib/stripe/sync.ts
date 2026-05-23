// Stripe → Database sync operations.
// Called exclusively from the webhook handler — uses service role to bypass RLS.

import type Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import type { EntityType, PlanId, SubscriptionStatus } from './types'

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'trialing':  return 'trialing'
    case 'active':    return 'active'
    case 'past_due':  return 'past_due'
    case 'canceled':  return 'canceled'
    default:          return 'incomplete'
  }
}

function toCustomerId(customer: Stripe.Subscription['customer']): string {
  return typeof customer === 'string' ? customer : customer.id
}

function toTimestamp(ts: number): string {
  return new Date(ts * 1000).toISOString()
}

// Syncs a Stripe subscription to our DB (upsert by stripe_subscription_id).
// Also cancels any previously active subscription for the same entity that has
// a different stripe ID (e.g. the free placeholder plan).
export async function syncSubscription(
  stripeSub: Stripe.Subscription,
  entityType: EntityType,
  entityId: string,
  planId: PlanId,
): Promise<void> {
  const db = createServiceClient()
  const now = new Date().toISOString()
  const status = mapStripeStatus(stripeSub.status)
  const seatCount = stripeSub.items.data[0]?.quantity ?? 1

  // Cancel any OTHER active subscription for this entity (e.g. free plan row)
  await db
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: now })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .in('status', ['active', 'trialing'])
    .neq('stripe_subscription_id', stripeSub.id)

  // In Stripe API 2026-04-22.dahlia, period dates moved from Subscription
  // to SubscriptionItem. Fall back to null if the item is not present.
  const firstItem = stripeSub.items.data[0]

  const payload = {
    entity_type: entityType,
    entity_id: entityId,
    plan_id: planId,
    stripe_subscription_id: stripeSub.id,
    stripe_customer_id: toCustomerId(stripeSub.customer),
    status,
    trial_ends_at: stripeSub.trial_end ? toTimestamp(stripeSub.trial_end) : null,
    current_period_start: firstItem ? toTimestamp(firstItem.current_period_start) : null,
    current_period_end: firstItem ? toTimestamp(firstItem.current_period_end) : null,
    seat_count: seatCount,
    updated_at: now,
  }

  // Check if our DB already has a record for this Stripe subscription
  const { data: existing } = await db
    .from('subscriptions')
    .select('id')
    .eq('stripe_subscription_id', stripeSub.id)
    .maybeSingle()

  if (existing) {
    await db
      .from('subscriptions')
      .update(payload)
      .eq('stripe_subscription_id', stripeSub.id)
  } else {
    await db
      .from('subscriptions')
      .insert({ ...payload, created_at: now })
  }
}

// Marks a Stripe subscription as canceled and creates a free plan fallback
// if the entity has no other active subscription.
export async function cancelSubscriptionByStripeId(
  stripeSubId: string,
  entityType: EntityType,
  entityId: string,
): Promise<void> {
  const db = createServiceClient()
  const now = new Date().toISOString()

  await db
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: now })
    .eq('stripe_subscription_id', stripeSubId)

  // Check if the entity has another active subscription before inserting free
  const { data: stillActive } = await db
    .from('subscriptions')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (!stillActive) {
    await db.from('subscriptions').insert({
      entity_type: entityType,
      entity_id: entityId,
      plan_id: 'free',
      status: 'active',
      seat_count: 1,
      created_at: now,
      updated_at: now,
    })
  }
}

// Updates only the status of a subscription (e.g. payment failed → past_due).
export async function updateSubscriptionStatus(
  stripeSubId: string,
  status: SubscriptionStatus,
): Promise<void> {
  const db = createServiceClient()
  await db
    .from('subscriptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', stripeSubId)
}
