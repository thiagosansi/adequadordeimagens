// Stripe webhook handler.
//
// IMPORTANT: Stripe requires the raw (unparsed) request body for signature
// verification. Do NOT call request.json() before constructEvent().
//
// Register this URL in the Stripe Dashboard:
//   https://dashboard.stripe.com/webhooks
//   URL: https://yourdomain.com/api/stripe/webhook
//
// Events to enable:
//   - checkout.session.completed
//   - customer.subscription.updated
//   - customer.subscription.deleted
//   - invoice.payment_failed
//   - customer.subscription.trial_will_end

import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/client'
import { syncSubscription, cancelSubscriptionByStripeId, updateSubscriptionStatus } from '@/lib/stripe/sync'
import type { EntityType, PlanId } from '@/lib/stripe/types'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ── Checkout completed: a user paid and the subscription was created ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription' || !session.subscription) break

        const entityType = session.metadata?.entity_type as EntityType | undefined
        const entityId   = session.metadata?.entity_id
        const planId     = session.metadata?.plan_id as PlanId | undefined

        if (!entityType || !entityId || !planId) {
          console.error('[stripe/webhook] checkout.session.completed: missing metadata', { id: session.id })
          break
        }

        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id

        const stripeSub = await getStripe().subscriptions.retrieve(subId)
        await syncSubscription(stripeSub, entityType, entityId, planId)
        break
      }

      // ── Subscription updated: status change, renewal, plan change, seat change ──
      case 'customer.subscription.updated': {
        const stripeSub = event.data.object as Stripe.Subscription

        const entityType = stripeSub.metadata?.entity_type as EntityType | undefined
        const entityId   = stripeSub.metadata?.entity_id
        const planId     = stripeSub.metadata?.plan_id as PlanId | undefined

        if (!entityType || !entityId || !planId) {
          console.error('[stripe/webhook] customer.subscription.updated: missing metadata', { id: stripeSub.id })
          break
        }

        await syncSubscription(stripeSub, entityType, entityId, planId)
        break
      }

      // ── Subscription deleted: canceled at end of period or immediately ──
      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object as Stripe.Subscription

        const entityType = stripeSub.metadata?.entity_type as EntityType | undefined
        const entityId   = stripeSub.metadata?.entity_id

        if (!entityType || !entityId) {
          console.error('[stripe/webhook] customer.subscription.deleted: missing metadata', { id: stripeSub.id })
          break
        }

        await cancelSubscriptionByStripeId(stripeSub.id, entityType, entityId)
        break
      }

      // ── Payment failed: mark subscription as past_due ──
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        // In Stripe API 2026-04-22.dahlia, subscription reference moved to
        // invoice.parent.subscription_details.subscription
        const subRef = invoice.parent?.subscription_details?.subscription
        const subscriptionId = subRef
          ? typeof subRef === 'string' ? subRef : subRef.id
          : null

        if (!subscriptionId) break

        await updateSubscriptionStatus(subscriptionId, 'past_due')
        break
      }

      // ── Trial ending soon: log for now — emails handled in a future phase ──
      case 'customer.subscription.trial_will_end': {
        const stripeSub = event.data.object as Stripe.Subscription
        console.log('[stripe/webhook] trial_will_end:', {
          id: stripeSub.id,
          entity_id: stripeSub.metadata?.entity_id,
          trial_end: stripeSub.trial_end,
        })
        break
      }

      default:
        // Silently ignore unhandled event types
        break
    }
  } catch (err) {
    console.error('[stripe/webhook] handler error for event', event.type, err)
    // Return 500 so Stripe retries the event
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
