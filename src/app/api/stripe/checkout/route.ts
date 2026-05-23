// Creates a Stripe Checkout session for upgrading to Pro or Team plan.
//
// POST body:
//   { planId: 'pro' }                       — individual upgrade
//   { planId: 'team', seats: 3, orgId: '' } — team upgrade (orgId required)
//
// Returns: { url: string } — redirect the user to this Stripe Checkout URL.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/client'
import { getPriceId } from '@/lib/stripe/prices'
import { getOrCreateStripeCustomer } from '@/lib/subscriptions'
import type { EntityType, PaidPlanId } from '@/lib/stripe/types'

interface CheckoutBody {
  planId: PaidPlanId
  seats?: number
  orgId?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CheckoutBody
    const { planId, seats = 1, orgId } = body

    if (planId !== 'pro' && planId !== 'team') {
      return NextResponse.json({ error: 'Invalid plan. Must be "pro" or "team".' }, { status: 400 })
    }

    if (planId === 'team' && !orgId) {
      return NextResponse.json({ error: 'orgId is required for the team plan.' }, { status: 400 })
    }

    const entityType: EntityType = planId === 'team' ? 'organization' : 'user'
    const entityId = planId === 'team' ? orgId! : user.id

    const customerId = await getOrCreateStripeCustomer(entityType, entityId, user.email)
    const priceId = getPriceId(planId)
    const origin = new URL(request.url).origin
    const quantity = planId === 'team' ? Math.max(1, seats) : 1

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity,
          ...(planId === 'team' && {
            adjustable_quantity: { enabled: true, minimum: 1, maximum: 200 },
          }),
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        // Metadata is stored on the subscription so the webhook can identify
        // which entity to update when Stripe events arrive.
        metadata: {
          entity_type: entityType,
          entity_id: entityId,
          plan_id: planId,
        },
      },
      // Also store on session so checkout.session.completed has immediate access
      metadata: {
        entity_type: entityType,
        entity_id: entityId,
        plan_id: planId,
      },
      success_url: `${origin}/app/billing?checkout=success`,
      cancel_url:  `${origin}/app/billing?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      locale: 'pt-BR',
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
