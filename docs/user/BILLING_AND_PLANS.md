# Billing and Plans

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** user  

Subscription tiers and feature access for Vishvakarma.OS.

Source: `src/config/billingPlans.ts`

---

## Plan comparison

| Feature | Starter | Studio | Enterprise |
|---------|---------|--------|------------|
| Price | Free forever | $499/month | $1,000/month |
| Active projects | 1 | Unlimited | Unlimited |
| 2D drafting | Yes | Yes | Yes |
| Sacred 3D View | Standard mode | Full | Full |
| Export | PNG (+ more in Studio) | Full export package | Full export package |
| Cloud save | Local draft only | Supabase cloud | Supabase cloud |
| Project Proof governance | — | Yes | Yes |
| Vastu Harmony + Panchatattva | — | Yes | Yes |
| India NBC pre-check + INR cost | — | Yes | Yes |
| SSO / SAML | — | — | Yes (planned rollout) |
| API access | — | — | Yes (planned rollout) |
| Collaboration | — | — | Planned |
| Trial | — | 14-day free trial | Contact sales |

---

## Upgrading

1. Sign in at https://vishvakarma-os.app/auth
2. Visit **Profile** (`/profile`) or **Pricing** (`/pricing` when enabled)
3. Select **Studio** or **Enterprise**
4. Complete Stripe Checkout
5. Plan activates when webhook processes (usually seconds)

Manage payment method and invoices via **Stripe Customer Portal** on Profile.

---

## Starter limitations

- One active cloud project
- PNG export primary format
- Local draft recovery when offline

Upgrade to Studio for unlimited projects and full export package.

---

## Enterprise

Enterprise includes everything in Studio plus SSO, API access, dedicated onboarding, custom template library, and Indian residential sample library.

Some Enterprise features are **planned** — see [PRODUCT_CAPABILITIES.md](../PRODUCT_CAPABILITIES.md) for current production status.

Contact sales via plan configuration if self-serve checkout is unavailable.

---

## Billing issues

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) and [FAQ.md](./FAQ.md).

Operator setup: [release/STRIPE_SETUP.md](../release/STRIPE_SETUP.md)
