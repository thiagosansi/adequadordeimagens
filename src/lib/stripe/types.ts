export type PlanId = 'free' | 'pro' | 'team' | 'enterprise'
export type PaidPlanId = 'pro' | 'team'
export type EntityType = 'user' | 'organization'
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'

export interface PlanFeatures {
  exports_monthly: number       // -1 = unlimited
  ai_requests_monthly: number   // -1 = unlimited
  platforms_limit: number       // -1 = all platforms
  batch_export: boolean
  video: boolean
  carousel: boolean
  ai_processing: boolean
  brand_kit: boolean
  approval_flow: boolean
  analytics: boolean
  max_team_members: number      // -1 = unlimited
}

export interface Plan {
  id: PlanId
  type: 'individual' | 'organization'
  name: string
  price_cents: number | null
  price_per_seat_cents: number | null
  trial_days: number
  features: PlanFeatures
}

export interface ActiveSubscription {
  id: string
  entity_type: EntityType
  entity_id: string
  plan_id: PlanId
  plan: Plan
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  seat_count: number
}

// Metadata attached to Stripe subscription and checkout session
export interface StripeMetadata {
  entity_type: EntityType
  entity_id: string
  plan_id: PlanId
}
