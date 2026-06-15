# Deployment Runbook

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** operator  

Condensed production deploy flow. Full guide: [release/DEPLOYMENT.md](../release/DEPLOYMENT.md)

---

## Pre-deploy checklist

- [ ] Migrations applied: `npx supabase link --project-ref jyocvwipthswfcmvqgqe && npx supabase db push`
- [ ] Vercel env vars match [VERCEL_ENV.md](../release/VERCEL_ENV.md)
- [ ] `VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app`
- [ ] `APP_URL=https://vishvakarma-os.app`
- [ ] Stripe webhook endpoint registered for production URL
- [ ] No legacy `VITE_FIREBASE_*` or `BACKEND_PROVIDER` in production env
- [ ] Local verification green:

```bash
pnpm run verify:ci
pnpm run release:gates
pnpm run handoff:verify
pnpm run docs:verify
```

---

## Deploy

### Option A — Git push (recommended)

Push to `main`. Vercel auto-deploys from GitHub integration.

### Option B — CLI

```bash
pnpm run deploy:vercel
```

Requires clean git tree; runs `verify:ci` first.

Build: `pnpm run build` → output `dist/` per `vercel.json`.

---

## Post-deploy verification

```bash
pnpm run production:verify-env --strict
pnpm run verify:supabase-schema:live
pnpm run verify:production-auth-flow
PLAYWRIGHT_BASE_URL=https://vishvakarma-os.app pnpm run test:e2e:auth
```

### Manual smoke (5 minutes)

1. https://vishvakarma-os.app loads
2. `/auth` — Google OAuth completes → `/editor`
3. `/projects` — list loads for signed-in user
4. `/editor` — 2D + 3D surfaces render
5. `/profile` — billing section loads; Stripe portal link works (Studio user)
6. Security headers present (see [evidence/security-headers.md](../release/evidence/security-headers.md))

---

## Canonical URLs

| Purpose | URL |
|---------|-----|
| Production | https://vishvakarma-os.app |
| Vercel fallback | https://vishvakarma-os.vercel.app |

Use `.app` for auth redirects, Stripe return URLs, and operator documentation.

---

## Rollback

If deploy fails smoke tests: [ROLLBACK.md](./ROLLBACK.md)

---

## Related

- [ENVIRONMENT_MATRIX.md](./ENVIRONMENT_MATRIX.md)
- [handoff/08-operations-and-deployment.md](../handoff/08-operations-and-deployment.md)
