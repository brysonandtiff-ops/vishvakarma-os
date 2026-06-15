# ADR-005: Stripe entitlement model

**Status:** Accepted  
**Date:** 2026-05-15  

## Context

The product monetizes through tiered SaaS plans with feature gating (project limits, export formats, cloud save, intelligence modules). Billing state must sync reliably between Stripe and the application.

## Decision

Three tiers managed via Stripe subscriptions:

| Tier | Price | Self-serve checkout |
|------|-------|---------------------|
| Starter | Free | No |
| Studio | $499/mo | Yes (14-day trial) |
| Enterprise | $1,000/mo | Yes |

Stripe Checkout and Customer Portal handle payment UI. Webhooks at `POST /api/stripe/webhook` update Supabase `billing` rows. Client feature gates read plan via `src/config/billingPlans.ts`.

Enterprise SSO/API features are listed but not all implemented — see [PRODUCT_CAPABILITIES.md](../PRODUCT_CAPABILITIES.md).

## Consequences

- Positive: Standard SaaS billing flow with webhook-driven entitlements
- Positive: Co-owner allowlist can grant Studio access without Stripe
- Negative: Webhook failures desync entitlements until replay/fix
- Neutral: Enterprise collaboration remains planned on tier marketing copy

## References

- [release/STRIPE_SETUP.md](../release/STRIPE_SETUP.md)
- [user/BILLING_AND_PLANS.md](../user/BILLING_AND_PLANS.md)
- `src/config/billingPlans.ts`
