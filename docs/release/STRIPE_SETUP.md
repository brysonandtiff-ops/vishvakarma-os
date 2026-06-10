# Stripe Billing Setup

Vishvakarma.OS uses **Stripe Checkout** for paid subscriptions:

| Plan | Price | Checkout |
|------|-------|----------|
| Starter | Free | N/A |
| Studio | **$499/mo** | Self-serve + 14-day trial |
| Enterprise | **$1,000/mo** | Self-serve (no trial) |

Subscription state is stored in Firestore `billing/{uid}` (server-written via webhooks).

## Prerequisites

- Stripe account (test mode for development)
- Firebase project with Firestore enabled
- Firebase service account JSON (for webhook → Firestore writes)
- Vercel deployment (or `vercel dev` for local API routes)

## 1. Create product and price

```bash
export STRIPE_SECRET_KEY=sk_test_...
pnpm run setup:stripe
```

Copy the printed `STRIPE_PRICE_STUDIO_MONTHLY` and `STRIPE_PRICE_ENTERPRISE_MONTHLY` values.

**Live production:** run with `sk_live_...`, update Vercel env vars, then **archive** any old $99 / $249 price IDs in Stripe Dashboard so new checkouts use the updated amounts.

## 2. Environment variables

### Vercel (Production / Preview)

| Variable | Notes |
|----------|-------|
| `VITE_STRIPE_BILLING_ENABLED` | `true` to enable checkout UI |
| `STRIPE_SECRET_KEY` | Test or live secret key |
| `STRIPE_WEBHOOK_SECRET` | From step 3 |
| `STRIPE_PRICE_STUDIO_MONTHLY` | From `setup:stripe` ($499/mo) |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | From `setup:stripe` ($1,000/mo) |
| `FIREBASE_PROJECT_ID` | Same as `VITE_FIREBASE_PROJECT_ID` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON string (single line in Vercel) |
| `APP_URL` | e.g. `https://vishvakarma-os.vercel.app` |

See also [VERCEL_ENV.md](./VERCEL_ENV.md).

### Local (`.env.local`)

```bash
VITE_STRIPE_BILLING_ENABLED=true
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_STUDIO_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
APP_URL=http://127.0.0.1:5173
```

Redeploy or restart after changing `VITE_*` variables (build-time inlining).

## 3. Register webhook

In [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks):

**Endpoint URL:** `https://<your-domain>/api/stripe/webhook`

**Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`.

## 4. Deploy Firestore rules

The `billing/{userId}` collection allows read-only client access:

```bash
firebase deploy --only firestore:rules
```

## 5. Local webhook testing

API routes require a Vercel runtime. Use either:

**Option A — Stripe CLI + Vercel dev**

```bash
# Terminal 1
vercel dev

# Terminal 2
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Use the `whsec_...` secret from `stripe listen` as `STRIPE_WEBHOOK_SECRET` locally.

**Option B — Forward to preview deploy**

```bash
stripe listen --forward-to https://your-preview-url.vercel.app/api/stripe/webhook
```

## 6. Smoke test

1. Set `VITE_STRIPE_BILLING_ENABLED=true` and all server Stripe/Firebase vars.
2. Sign in → open `/pricing`.
3. Click **Start 14-Day Free Trial** on Studio.
4. Complete Checkout with test card `4242 4242 4242 4242`, any future expiry, any CVC.
5. After redirect to `/profile?checkout=success`, confirm plan shows **Studio (trial)**.
6. In Firestore, confirm `billing/{firebaseUid}` has `plan: studio`, `status: trialing`, `stripeCustomerId`, `stripeSubscriptionId`.

## 7. Customer portal

Signed-in Studio users can open **Manage billing** on `/profile` or `/pricing`, which calls `/api/stripe/create-portal-session`.

Enable the Customer Portal in Stripe Dashboard → Settings → Billing → Customer portal.

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Checkout button does nothing | `VITE_STRIPE_BILLING_ENABLED`, network tab on `/api/stripe/create-checkout-session` |
| 401 on checkout API | Firebase ID token in `Authorization: Bearer` header |
| Webhook 400 invalid signature | Raw body parsing; confirm `STRIPE_WEBHOOK_SECRET` matches endpoint |
| Profile still shows Starter after checkout | Webhook delivery logs in Stripe; Firestore rules deployed; service account has Firestore write access |
| Portal 400 no customer | Complete checkout once so `billing/{uid}.stripeCustomerId` exists |

## Related

- [VERCEL_ENV.md](./VERCEL_ENV.md)
- [VERIFY_COMMANDS.md](./VERIFY_COMMANDS.md)
