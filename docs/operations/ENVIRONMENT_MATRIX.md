# Environment Matrix

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** operator  

Environment-specific notes for local, preview, and production.

**Authoritative env inventory:** [handoff/appendices/B-environment-variables.md](../handoff/appendices/B-environment-variables.md)  
**Vercel matrix:** [release/VERCEL_ENV.md](../release/VERCEL_ENV.md)

---

## Local development

| Setting | Value |
|---------|-------|
| URL | http://127.0.0.1:5173 |
| Config file | `.env.local` (from `.env.example`) |
| Demo without auth | `VITE_ALLOW_LOCAL_DEMO=true` (dev only) |
| Supabase | Optional — use project anon key or local demo mode |
| Stripe | Test keys; `pnpm run setup:stripe` for test prices |
| AI | Optional `GEMINI_API_KEY` in `.env.local` |

```bash
pnpm run dev
```

---

## Vercel preview

| Setting | Notes |
|---------|-------|
| URL | `*.vercel.app` per branch |
| Auth redirects | Add preview URL to Supabase authorized redirects if testing OAuth |
| Stripe | Test mode keys recommended |
| Protection | Enable Vercel Deployment Protection for sensitive previews |

Do **not** use preview URLs in operator or valuation documentation as canonical production.

---

## Production

| Setting | Value |
|---------|-------|
| Canonical URL | https://vishvakarma-os.app |
| Fallback | https://vishvakarma-os.vercel.app |
| `VITE_AUTH_REDIRECT_ORIGIN` | `https://vishvakarma-os.app` |
| `APP_URL` | `https://vishvakarma-os.app` |
| Stripe | Live keys; live webhook endpoint |
| Supabase | Production project `jyocvwipthswfcmvqgqe` |

Remove deprecated: `VITE_FIREBASE_*`, `BACKEND_PROVIDER`.

---

## Verify per environment

```bash
# Local
pnpm run verify:ci

# Production (from operator machine)
pnpm run production:verify-env --strict
pnpm run verify:supabase-schema:live
pnpm run verify:production-auth-flow
```

---

## Related

- [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md)
- [release/SUPABASE_AUTH_SETUP.md](../release/SUPABASE_AUTH_SETUP.md)
