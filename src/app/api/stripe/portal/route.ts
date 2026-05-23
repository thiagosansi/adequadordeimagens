// Creates a Stripe Customer Portal session for managing billing.
// The portal allows the user to: update payment method, view invoices,
// change or cancel their plan.
//
// POST body:
//   {}           — opens portal for the current user's individual subscription
//   { orgId: '' } — opens portal for the organization's subscription
//
// Returns: { url: string } — redirect the user to this Stripe Portal URL.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { stripe } from '@/lib/stripe/client'

interface PortalBody {
  orgId?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as PortalBody
    const { orgId } = body

    const entityType = orgId ? 'organization' : 'user'
    const entityId   = orgId ?? user.id

    // Look up the Stripe customer ID for this entity
    const db = createServiceClient()
    const { data } = await db
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    if (!data?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found. Please subscribe to a paid plan first.' },
        { status: 404 },
      )
    }

    const origin = new URL(request.url).origin
    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${origin}/app/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/portal]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
