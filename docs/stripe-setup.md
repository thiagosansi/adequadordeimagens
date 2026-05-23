# Stripe Setup Guide

## Required environment variables

Add these to `.env.local` (local) and to Vercel Environment Variables (production):

```env
# Stripe keys — get from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_...           # or sk_test_... for development
STRIPE_WEBHOOK_SECRET=whsec_...         # see webhook setup below
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Price IDs — created in step 2 below
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_TEAM=price_...
```

---

## Step 1 — Create Products and Prices in Stripe Dashboard

Go to: https://dashboard.stripe.com/products

### Product: AdFrame Pro

- Name: `AdFrame Pro`
- Pricing model: **Standard**
- Price: `R$ 29,90` / month (recurring)
- Currency: BRL
- Copy the **Price ID** → set as `STRIPE_PRICE_ID_PRO`

### Product: AdFrame Team

- Name: `AdFrame Team`
- Pricing model: **Standard** (per seat)
- Price: `R$ 49,90` / month / unit (recurring)
- Currency: BRL
- Copy the **Price ID** → set as `STRIPE_PRICE_ID_TEAM`

> Note: The team plan uses Stripe's `quantity` field to represent seats.
> The user can adjust the number of seats during checkout (min 1, max 200).

---

## Step 2 — Set up the Webhook

Go to: https://dashboard.stripe.com/webhooks → **Add endpoint**

**Endpoint URL:**
- Local: use [Stripe CLI](https://stripe.com/docs/stripe-cli) (see below)
- Production: `https://adframe.com.br/api/stripe/webhook`

**Events to listen to:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `customer.subscription.trial_will_end`

After creating the endpoint, copy the **Signing Secret** → set as `STRIPE_WEBHOOK_SECRET`

---

## Step 3 — Configure Customer Portal

Go to: https://dashboard.stripe.com/settings/billing/portal

Enable features:
- [x] Update payment method
- [x] View invoice history
- [x] Cancel subscription
- [x] Update subscriptions (plan/quantity changes)

Set **Return URL**: `https://adframe.com.br/app/billing`

---

## Local development with Stripe CLI

Install the Stripe CLI and forward events to your local server:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This prints a webhook signing secret (`whsec_...`). Use it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

To trigger test events manually:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

---

## Test card numbers (Stripe test mode)

| Scenario | Card number |
|---|---|
| Success | `4242 4242 4242 4242` |
| Payment declined | `4000 0000 0000 0002` |
| Requires authentication | `4000 0025 0000 3155` |
| Insufficient funds | `4000 0000 0000 9995` |

Expiry: any future date. CVV: any 3 digits.
