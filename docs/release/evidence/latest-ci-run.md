# Latest CI Run

Generated: 2026-06-14  
Canonical deployment URL: https://vishvakarma-os.app  
Vercel fallback URL: https://vishvakarma-os.vercel.app  

## Workflow Run

**PENDING** — attach green GitHub Actions run URL after canonical-domain auth cleanup commit is pushed to `main`.

```
<attach after push>
```

## Command Parity

Local verification completed before push (canonical `.app` auth proof):

| Command | Result |
|---------|--------|
| `pnpm run auth:gates` | PASS |
| `pnpm run production:verify-env --strict` | PASS |
| `pnpm run lint:types` | PASS |
| `PRODUCTION_URL=https://vishvakarma-os.app pnpm run test:supabase-auth:full` | PASS |
| `PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth pnpm run verify:production-auth-flow` | PASS (15/15) |
| `npx supabase config push --yes` | PASS — remote auth `site_url` → `.app` |
| `pnpm run test:e2e:auth` | PASS (22/22) |

## Deployment URL

- Canonical: https://vishvakarma-os.app
- Vercel fallback: https://vishvakarma-os.vercel.app
