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

## Lovable disconnected — Vercel is sole deploy

Vishvakarma.OS no longer uses Lovable.ai for Git sync or hosting. Complete these steps once (browser):

### Disconnect in Lovable

1. Open the project in [Lovable](https://lovable.dev) → **Settings → Integrations → GitHub**
2. **Disconnect** the linked repo (`brysonandtiff-ops/vishvakarma-os`)
3. Confirm no further auto-commits from Lovable

### Revoke Lovable GitHub App

1. GitHub → **Settings → Applications → Installed GitHub Apps**
2. Find **Lovable** (legacy name: GPT Engineer) → **Configure**
3. Remove access to `brysonandtiff-ops/vishvakarma-os` or revoke the app
4. Repo **Settings → Webhooks** — delete any Lovable-related webhooks

### Confirm Vercel-only deploy

1. Vercel **Settings → Git** — connected repo: `brysonandtiff-ops/vishvakarma-os`, production branch: `main`
2. If Lovable served a custom domain, point DNS only to Vercel
3. Set production env vars below, then **Redeploy** (Vite inlines `VITE_*` at build time)

Legacy Lovable project ID `app-9nam5bayv401` and `/workspace/...` paths were removed from the codebase (2026-05-31).

## Build settings (vercel.json)

| Setting | Value |
|---------|-------|
| Install | `pnpm install --frozen-lockfile` |
| Build | `pnpm run build` |
| Output | `dist` |

## Local validation

```bash
pnpm run production:verify-env
```

Strict mode (fails if `.env.local` placeholders remain):

```bash
pnpm run production:verify-env --strict
```

## Operator checklist

1. Disconnect Lovable from GitHub (section above).
2. Apply Supabase migrations from `supabase/migrations/` before inviting users.
3. Set production env vars in Vercel (table above).
4. Redeploy after changing env vars — Vite inlines `VITE_*` at build time.
5. Smoke test: signed-out `/editor` redirects to `/auth`; sign-in lands in editor.
6. Run `pnpm run release:gates:strict` and attach CI artifact links to `docs/release/evidence/EVIDENCE_MANIFEST.md`.

## Related docs

- [Apply Supabase migrations (operator)](./SUPABASE_MIGRATIONS_APPLY.md)
- [Supabase RLS evidence runbook](./SUPABASE_RLS_EVIDENCE.md)
- [Production readiness](./PRODUCTION_READINESS.md)
- [Evidence manifest](./evidence/EVIDENCE_MANIFEST.md)
