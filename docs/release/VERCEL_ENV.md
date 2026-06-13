# Vercel Production Environment Variables

Configure these in the Vercel project **Settings → Environment Variables** for **Production** (and Preview if you want auth on preview URLs) before deploying Vishvakarma.OS.

**Current production backend:** Supabase Auth + Postgres + Storage. The SPA hardcodes `provider: 'supabase'` in `src/backend/backendConfig.ts` — there is no runtime backend switch in current builds.

**Canonical production origin:** `https://vishvakarma-os.app`  
**Vercel fallback/debug alias:** `https://vishvakarma-os.vercel.app`

See [SUPABASE_AUTH_SETUP.md](./SUPABASE_AUTH_SETUP.md) for Supabase dashboard steps and [CURRENT_PRODUCTION_ARCHITECTURE.md](../CURRENT_PRODUCTION_ARCHITECTURE.md) for the architecture addendum.

## Required (Supabase — production)

| Variable | Where to find it |
|----------|------------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Same → anon public key |
| `SUPABASE_URL` | Same → Project URL (server mirror) |
| `SUPABASE_SERVICE_ROLE_KEY` | Same → service_role key (server only — Stripe webhooks, JWT verify) |
| `VITE_AUTH_REDIRECT_ORIGIN` | Set to canonical production origin: `https://vishvakarma-os.app` |

## Server-only (AI Building Designer — never prefix with `VITE_`)

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google AI Studio key for `/api/ai/extract-requirements` |
| `GEMINI_MODEL` | Optional model id (default `gemini-2.0-flash`) |

These are read by Vercel serverless functions only and are **not** bundled into the SPA.

## Stripe Billing (server-only — never prefix with `VITE_`)

Required when `VITE_STRIPE_BILLING_ENABLED=true`:

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from Stripe webhook endpoint |
| `STRIPE_PRICE_STUDIO_MONTHLY` | Price ID for Studio **$499/mo** — run `pnpm run setup:stripe` |
| `STRIPE_PRICE_ENTERPRISE_MONTHLY` | Price ID for Enterprise **$1,000/mo** — run `pnpm run setup:stripe` |
| `APP_URL` | Set to canonical production origin: `https://vishvakarma-os.app` |

See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for webhook registration and local testing.

## Recommended (optional but useful)

| Variable | Purpose |
|----------|---------|
| `VITE_PRICING_PAGE_ENABLED` | Set to `true` to expose `/pricing` and nav links |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for Studio checkout |
| `VITE_STRIPE_BILLING_ENABLED` | Set to `true` to show Stripe checkout / manage billing on `/pricing` and `/profile` |
| `VITE_AUTH_WINNER` | Optional override: `google`, `email`, or `none` — locks which sign-in method `/auth` displays |
| `VITE_COLLAB_WS_URL` | Optional WebSocket URL for collaboration preview server |

## Remove from Vercel (legacy Firebase vars)

If present from earlier deployments, delete unused Firebase client vars:

- `VITE_BACKEND_PROVIDER`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`

## Vercel redeploy (required after env changes)

Vite inlines `VITE_*` at **build time**. After adding or changing env vars:

1. Vercel → **Deployments** → **Redeploy** latest `main` (or push a commit)
2. Do not rely on a runtime-only env change without a new build

## Local development

```bash
cp .env.example .env.local
# Edit .env.local with real Supabase values (not placeholders)
pnpm run dev
```

Validate template:

```bash
pnpm run production:verify-env
pnpm run production:verify-env --strict   # also checks .env.local values
```

## Supabase auth setup

See [`SUPABASE_AUTH_SETUP.md`](./SUPABASE_AUTH_SETUP.md) for production OAuth redirect URLs, email templates, and provider configuration.

Setup helpers:

```bash
pnpm run setup:supabase-auth
pnpm run setup:supabase-auth:full
pnpm run push:supabase-env-vercel
```

## Post-deploy smoke test

1. Open `https://vishvakarma-os.app` in incognito.
2. `/auth` — Google OAuth or email link sign-in.
3. `/editor` — create project, save, reload, confirm cloud save badge shows **Supabase Cloud Save**.
4. `/registry`, `/releases`, `/audit` — governance pages load.
5. `/pricing` — loads when `VITE_PRICING_PAGE_ENABLED=true`; Studio checkout redirects to Stripe when Stripe env is set.
6. Complete a live Studio checkout and confirm Profile shows **Studio** with active/trialing subscription status.
7. Confirm Supabase Auth logs show `.app` as the referer after Google OAuth.

## Stripe billing verification

```bash
pnpm run verify:stripe-billing
pnpm run verify:stripe-billing --strict
```

After configuring live Stripe keys on Vercel, run one Studio checkout and confirm webhook delivery in Stripe Dashboard → Developers → Webhooks.

## Promote an admin user (Supabase)

After the user signs in once on production:

1. Supabase Dashboard → Table Editor → `profiles`
2. Set `role` to `admin` for their row

Alternatively use SQL in the Supabase SQL editor.

## Promote a co-owner

Co-owners need **admin** (governance writes) and **enterprise billing** (export tier + billing UI). The app also recognizes co-owner emails from `src/config/coOwners.ts` as a safety net on every login.

**Prerequisite:** the co-owner must sign in on production once so Supabase Auth creates their profile row.

1. Set `role = admin` on their `profiles` row
2. Ensure billing tier reflects Enterprise (via Stripe webhook or profile billing columns)
3. Ask them to **sign out and back in**

**Verify:**

1. Profile shows Enterprise plan
2. Editor → Export Package enables PDF and DXF
3. Spec Center / Registry / Releases allow create and edit

To add another co-owner later, add their email to `src/config/coOwners.ts` and deploy.

## Build settings (vercel.json)

| Setting | Value |
|---------|-------|
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm run build` |
| Output | `dist` |

## Related docs

- [Supabase auth setup](./SUPABASE_AUTH_SETUP.md)
- [Migration guide](../../MIGRATION.md)
- [Production readiness](./PRODUCTION_READINESS.md)
- [Evidence manifest](./evidence/EVIDENCE_MANIFEST.md)

---

## Archived: Firebase rollback path (not current production)

Earlier v1.2.x work supported Firebase Auth + Firestore as an alternate backend. Current production does **not** use this path. The following is retained for historical operator reference only.

Legacy Firebase env vars (if restoring an old branch):

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Project id |
| `VITE_FIREBASE_APP_ID` | App id |

Legacy admin promotion (Firebase Admin SDK — not used on Supabase production):

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
node scripts/production/setup-admin.mjs admin@example.com
node scripts/production/setup-co-owner.mjs coowner@example.com
```

Firebase CLI deploy artifacts (`firebase.json`, `firestore.rules`) are not required for the Supabase production path.
