# Annex 07 — Integrations and Accounts

[← Handoff index](./HANDOFF.md)

**No secrets in this document.** Live credentials belong in Cloudflare Pages environment bindings/secrets and operator secure storage. See [Operator Annex template](./templates/OPERATOR_ANNEX.template.md).

**Env var inventory:** [Appendix B](./appendices/B-environment-variables.md), [`.env.example`](../../.env.example). Configure production and preview environments separately in Cloudflare Pages; public `VITE_*` values are embedded at build time.

## Third-party service registry

| Service | Role | Identifiers / URLs |
|---------|------|-------------------|
| **Cloudflare Pages** | Static hosting, Pages Functions API, security headers | Project: `vishvakarma-os`; Pages origin: https://vishvakarma-os.pages.dev; intended custom origin: https://vishvakarma-os.app (domain acceptance requires live proof) |
| **Supabase** | Auth, Postgres, RLS, Storage | Project ref: `jyocvwipthswfcmvqgqe`; URL: `https://jyocvwipthswfcmvqgqe.supabase.co` |
| **Stripe** | Checkout, Customer Portal, webhooks | Products: Studio $499/mo, Enterprise $1,000/mo |
| **GitHub** | Source control, CI | https://github.com/brysonandtiff-ops/vishvakarma-os |
| **Google Cloud** | OAuth (via Supabase Auth), Gemini API | Gemini model default: `gemini-2.0-flash` |
| **Firebase** | **Legacy only** — migration/operator scripts | Project ID in scripts: `gen-lang-client-0690161780` — **not production runtime** |

## Integration file map

### Supabase

| Purpose | Path |
|---------|------|
| Client gateways | [`src/backend/supabase/`](../../src/backend/supabase/) |
| Server billing writes | [`api/_lib/billingSupabase.ts`](../../api/_lib/billingSupabase.ts) |
| Setup script | [`scripts/setup-supabase-auth-providers.mjs`](../../scripts/setup-supabase-auth-providers.mjs) |
| Pages runtime configuration | [`wrangler.jsonc`](../../wrangler.jsonc); configure environment values privately in Cloudflare Pages |

### Stripe

| Purpose | Path |
|---------|------|
| API routes | [`api/stripe/`](../../api/stripe/) |
| Client checkout | [`src/services/billing/stripeCheckout.ts`](../../src/services/billing/stripeCheckout.ts) |
| Product setup | [`scripts/setup-stripe-products.mjs`](../../scripts/setup-stripe-products.mjs) |
| Verification | [`scripts/verify-stripe-billing.mjs`](../../scripts/verify-stripe-billing.mjs) |
| Setup guide | [`docs/release/STRIPE_SETUP.md`](../release/STRIPE_SETUP.md) |

Webhook events handled: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

### Gemini (AI)

| Route | Path |
|-------|------|
| Parse site documents | [`api/ai/parse-site-documents.ts`](../../api/ai/parse-site-documents.ts) |
| Extract requirements | [`api/ai/extract-requirements.ts`](../../api/ai/extract-requirements.ts) |

Env: `GEMINI_API_KEY`, optional `GEMINI_MODEL`.

### Collaboration (optional)

| Component | Path |
|-----------|------|
| WebSocket server | [`server/collab/presenceServer.ts`](../../server/collab/presenceServer.ts) |
| Env | `VITE_COLLAB_WS_URL`, `COLLAB_WS_PORT`, `ALLOWED_ORIGINS` |

### Monitoring (scaffold)

[`src/lib/monitoring.ts`](../../src/lib/monitoring.ts) — reads `VITE_SENTRY_DSN`; no `@sentry/react` dependency bundled.

## Required production environment variables

**Client (VITE_*):**

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_REDIRECT_ORIGIN`
- `VITE_PRICING_PAGE_ENABLED`, optional `VITE_STRIPE_BILLING_ENABLED`
- Optional: `VITE_COLLAB_WS_URL`, `VITE_SENTRY_DSN`

**Server-only:**

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STUDIO_MONTHLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY`
- `APP_URL`, `GEMINI_API_KEY`

**Deprecated — remove from active Cloudflare environments if present:**

- All `VITE_FIREBASE_*`, `VITE_BACKEND_PROVIDER`, `BACKEND_PROVIDER`, `FIREBASE_*`

## Account transfer checklist

Use when transferring ownership for valuation/acquisition:

1. **GitHub** — transfer repo or add acquirer as admin; confirm CI secrets if any
2. **Cloudflare** — transfer or grant authorized account/project access; inventory Pages environments and binding names without exporting secrets into Git or chat
3. **Supabase** — transfer organization/project; rotate `SUPABASE_SERVICE_ROLE_KEY` and anon key after handover
4. **Stripe** — transfer account or create new products/prices; update webhook endpoint to production URL `/api/stripe/webhook`
5. **Google Cloud** — transfer OAuth client or reconfigure in Supabase Auth providers
6. **Domain/DNS** — if a custom domain is used, coordinate registrar, DNS and Cloudflare Pages domain settings; verify HTTPS and auth redirects after an approved change
7. **Gemini** — rotate `GEMINI_API_KEY`; confirm billing on Google Cloud project
8. **Operator annex** — complete [`templates/OPERATOR_ANNEX.template.md`](./templates/OPERATOR_ANNEX.template.md); deliver via secure channel (not git)
9. **Co-owner emails** — update [`src/config/coOwners.ts`](../../src/config/coOwners.ts) if allowlist changes
10. **Verify** — run `pnpm run production:verify-env --strict`, `verify:supabase-schema:live`, `verify:stripe-billing`, `verify:production-auth-flow`

Admin/co-owner configuration: [`MIGRATION.md`](../../MIGRATION.md) and [`src/config/coOwners.ts`](../../src/config/coOwners.ts). Account access and entitlements require separate verification.
