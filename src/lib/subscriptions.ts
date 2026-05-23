// Public subscription API — used throughout the application.
// Read operations use the user's Supabase session (RLS enforced).
// Write helpers (getOrCreateStripeCustomer) use the service client.

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getStripe } from '@/lib/stripe/client'
import type { ActiveSubscription, EntityType, PlanFeatures } from '@/lib/stripe/types'

// Returns the single active or trialing subscription for an entity, with plan data.
export async function getActiveSubscription(
  entityType: EntityType,
  entityId: string,
): Promise<ActiveSubscription | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, plan:plans(*)')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  if (error || !data) return null
  return data as ActiveSubscription
}

export async function getUserSubscription(userId: string): Promise<ActiveSubscription | null> {
  return getActiveSubscription('user', userId)
}

export async function getOrgSubscription(orgId: string): Promise<ActiveSubscription | null> {
  return getActiveSubscription('organization', orgId)
}

// Returns plan features for the given plan ID.
// Useful for quick feature checks without a full subscription query.
export async function getPlanFeatures(planId: string): Promise<PlanFeatures | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plans')
    .select('features')
    .eq('id', planId)
    .maybeSingle()

  if (error || !data) return null
  return data.features as PlanFeatures
}

// Looks up the Stripe customer ID for an entity across all subscription records.
// If none exists, creates a new Stripe customer and returns its ID.
export async function getOrCreateStripeCustomer(
  entityType: EntityType,
  entityId: string,
  email: string,
): Promise<string> {
  const db = createServiceClient()

  const { data } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .not('stripe_customer_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (data?.stripe_customer_id) return data.stripe_customer_id

  const customer = await getStripe().customers.create({
    email,
    metadata: { entity_type: entityType, entity_id: entityId },
  })

  return customer.id
}

// Returns true if the entity's active plan includes the requested feature.
export async function hasFeature(
  entityType: EntityType,
  entityId: string,
  feature: keyof PlanFeatures,
): Promise<boolean> {
  const sub = await getActiveSubscription(entityType, entityId)
  if (!sub) return false
  const value = sub.plan.features[feature]
  return typeof value === 'boolean' ? value : (value as number) !== 0
}
