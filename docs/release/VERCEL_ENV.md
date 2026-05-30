# Vercel Production Environment Variables

Configure these in the Vercel project **Settings → Environment Variables** for the **Production** environment before deploying Vishvakarma.OS to https://vishvakarma-os.vercel.app.

## Required (Supabase backend — default)

| Variable | Value |
|----------|-------|
| `VITE_BACKEND_PROVIDER` | `supabase` |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |

## Optional (Firebase auth instead of Supabase magic link)

If you use Firebase email-link auth, set these per [`.env.example`](../../.env.example) and allowlist `vishvakarma-os.vercel.app` in Firebase Auth **Authorized domains**:

| Variable |
|----------|
| `VITE_FIREBASE_API_KEY` |
| `VITE_FIREBASE_AUTH_DOMAIN` |
| `VITE_FIREBASE_PROJECT_ID` |
| `VITE_FIREBASE_APP_ID` |

When using Firebase, also set `VITE_BACKEND_PROVIDER=firebase`.

## Local validation

```bash
pnpm run production:verify-env
```

Strict mode (fails if `.env.local` placeholders remain):

```bash
pnpm run production:verify-env --strict
```

## Operator checklist

1. Apply Supabase migrations from `supabase/migrations/` before inviting users.
2. Set production env vars in Vercel (table above).
3. Redeploy after changing env vars — Vite inlines `VITE_*` at build time.
4. Smoke test: signed-out `/` redirects to `/auth`; magic link sign-in lands in editor.
5. Run `pnpm run release:gates:strict` and attach CI artifact links to `docs/release/evidence/EVIDENCE_MANIFEST.md`.

## Related docs

- [Supabase RLS evidence runbook](./SUPABASE_RLS_EVIDENCE.md)
- [Production readiness](./PRODUCTION_READINESS.md)
- [Evidence manifest](./evidence/EVIDENCE_MANIFEST.md)
