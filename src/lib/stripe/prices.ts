import type { PaidPlanId } from './types'

// Maps our internal plan IDs to Stripe Price IDs.
// Price IDs are created in the Stripe Dashboard and stored as env vars.
// See docs/stripe-setup.md for instructions.
const PRICE_MAP: Record<PaidPlanId, string | undefined> = {
  pro: process.env.STRIPE_PRICE_ID_PRO,
  team: process.env.STRIPE_PRICE_ID_TEAM,
}

export function getPriceId(planId: PaidPlanId): string {
  const priceId = PRICE_MAP[planId]
  if (!priceId) {
    throw new Error(
      `STRIPE_PRICE_ID_${planId.toUpperCase()} is not set. ` +
      `Create the price in the Stripe Dashboard and add the env var.`,
    )
  }
  return priceId
}
