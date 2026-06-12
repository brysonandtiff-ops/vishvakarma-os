# Supabase Auth Setup (Production)

Vishvakarma.OS uses **Supabase Auth + Postgres** when `VITE_BACKEND_PROVIDER=supabase`.

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
4. Apply migrations:

```bash
supabase link --project-ref jyocvwipthswfcmvqgqe
supabase db push
pnpm run verify:supabase-schema:live
```

## Vercel environment (Production)

| Variable | Purpose |
|----------|---------|
| `VITE_BACKEND_PROVIDER` | Set to `supabase` |
| `VITE_SUPABASE_URL` | Project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — Stripe webhooks, JWT verify fallback |
| `SUPABASE_JWT_SECRET` | Optional — local JWT verify for API routes |

Remove runtime `VITE_FIREBASE_*` after cutover (keep only if rolling back).

## Verify

```bash
pnpm run test:supabase-auth
pnpm run verify:supabase-login-data
pnpm run verify:production-auth-flow
```

Rollback: set `VITE_BACKEND_PROVIDER=firebase` and restore Firebase env vars.
