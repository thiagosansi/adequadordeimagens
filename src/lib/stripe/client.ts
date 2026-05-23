import Stripe from 'stripe'

// Singleton Stripe client — server-side only.
// The API version is pinned to match the installed stripe@22 package.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2026-04-22.dahlia',
})
