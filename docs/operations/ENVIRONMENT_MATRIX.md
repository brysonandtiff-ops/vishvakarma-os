# Environment Matrix

**Product version:** v1.5.0

**Hosting configuration checked:** 2026-11-19

**Audience:** operator


Environment-specific notes for local, preview, and production.

**Authoritative env inventory:** [handoff/appendices/B-environment-variables.md](../handoff/appendices/B-environment-variables.md)

**Cloudflare matrix and service bindings:** [deployment guide](../release/DEPLOYMENT.md)

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

## Cloudflare Pages preview

| Setting | Notes |
|---------|-------|
| URL | Immutable deployment under `vishvakarma-os.pages.dev` |
| Auth redirects | Verify the exact approved test origin with the Supabase operator |
| Stripe | Test mode keys recommended |
| Source provenance | Match the Pages deployment ID and SHA to the candidate under test |

Do **not** use preview URLs in operator or valuation documentation as canonical production.

---

## Production

| Setting | Value |
|---------|-------|
| Canonical URL | https://vishvakarmaos.app |
| Pages origin | https://vishvakarma-os.pages.dev |
| `VITE_AUTH_REDIRECT_ORIGIN` | `https://vishvakarmaos.app` |
| `APP_URL` | `https://vishvakarmaos.app` |
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
