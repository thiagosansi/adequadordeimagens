import Stripe from 'stripe'

// Returns a Stripe client instance. Called inside request handlers, never at
// module level — this prevents the Stripe constructor from running during
// Next.js build when STRIPE_SECRET_KEY is not available.
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. ' +
      'Add it to .env.local for local dev and to Vercel Environment Variables for production.',
    )
  }
  return new Stripe(key, { apiVersion: '2026-04-22.dahlia' })
}
