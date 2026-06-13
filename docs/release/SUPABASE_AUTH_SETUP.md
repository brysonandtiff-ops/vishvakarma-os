# Supabase Auth Setup (Production)

Vishvakarma.OS uses **Supabase Auth + Postgres** as the production backend (hardcoded in `src/backend/backendConfig.ts`).

## Supabase Dashboard

Project ref: `jyocvwipthswfcmvqgqe` (or your linked project).

1. **Authentication → Providers**: Enable **Google** (OAuth client ID + secret from Google Cloud Console).
2. **Authentication → Providers**: Enable **Email** (magic link / OTP).
3. **Authentication → URL Configuration**:
   - Site URL: `https://vishvakarma-os.vercel.app`
   - Redirect URLs:
     - `https://vishvakarma-os.vercel.app/auth`
     - `https://*.vercel.app/auth` (preview)
     - `http://127.0.0.1:5173/auth`
4. Apply migrations and enable providers:

```bash
npx supabase login
npx supabase link --project-ref jyocvwipthswfcmvqgqe
npx supabase db push
node scripts/setup-supabase-auth-providers.mjs
pnpm run verify:supabase-schema:live
```

5. **Google Cloud Console** — add authorized redirect URI to your Supabase Google OAuth client:
   `https://jyocvwipthswfcmvqgqe.supabase.co/auth/v1/callback`

6. Push env to Vercel (after copying keys to `.env.supabase.local`):

```bash
pnpm run push:supabase-env-vercel
vercel --prod
```

## Vercel environment (Production)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | Project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_URL` | Server mirror of project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — Stripe webhooks, JWT verify |
| `VITE_AUTH_REDIRECT_ORIGIN` | Production origin for OAuth callbacks |

Remove legacy `VITE_FIREBASE_*` and `VITE_BACKEND_PROVIDER` vars if still present from older deploys.

## Verify

```bash
pnpm run test:supabase-auth
pnpm run verify:supabase-login-data
pnpm run verify:production-auth-flow
```

See [VERCEL_ENV.md](./VERCEL_ENV.md) and [MIGRATION.md](../../MIGRATION.md) for the full env matrix.
