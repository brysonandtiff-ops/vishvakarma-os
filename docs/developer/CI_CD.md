# CI/CD and Verification

**Product version:** v1.5.0  
**Last verified:** 2026-06-15  
**Audience:** developer  

GitHub Actions workflows and local verify scripts.

Command cheat sheet: [release/VERIFY_COMMANDS.md](../release/VERIFY_COMMANDS.md)

---

## GitHub Actions workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **Verify** | `.github/workflows/verify.yml` | push/PR to `main` | Lint, security headers, auth gates, Supabase schema, unit tests, route smoke, build, bundle budget, world record measure |
| **E2E** | `.github/workflows/e2e.yml` | (matrix) | Playwright cross-browser after verify job |
| **Lighthouse** | `.github/workflows/lighthouse.yml` | scheduled/manual | Performance audits |

### Verify job (main gate)

Runs on every push/PR to `main`:

1. `pnpm run lint`
2. Security header check
3. `auth:gates`, `flawless:gates`, `contract:gates`, `stability:gates`
4. Supabase auth/schema verification
5. `pnpm run test:coverage`
6. `pnpm run test:routes`
7. `pnpm run build`
8. `pnpm run perf:gates`
9. `pnpm run record:measure`

Downstream jobs: production OAuth verification, Playwright E2E matrix, release gates.

---

## Key npm scripts

| Script | Purpose |
|--------|---------|
| `verify:ci` | Local CI-style verification bundle |
| `release:gates` | 13-gate release manifest |
| `handoff:generate` | Regenerate appendices A–H |
| `handoff:verify` | Handoff pack completeness |
| `docs:verify` | Documentation link and stale checks |
| `lint:types` | TypeScript check (tsgo) |
| `hardening:gates` | Security hardening checks |
| `auth:gates` | Auth configuration guards |

Full script list: [appendix C](../handoff/appendices/C-npm-scripts.md)

---

## Pre-merge checklist

```bash
pnpm run handoff:generate   # if routes/api/schema/scripts changed
pnpm run handoff:verify
pnpm run docs:verify        # if docs changed
pnpm run lint:types
pnpm run verify:ci
pnpm run test:e2e           # for UI/auth changes
```

---

## Deploy pipeline

Production deploy uses Vercel. The `deploy:vercel` script runs `verify:ci` and requires a clean git tree.

Runbook: [operations/DEPLOYMENT_RUNBOOK.md](../operations/DEPLOYMENT_RUNBOOK.md)

---

## Documentation in CI

Add `pnpm run docs:verify` to local pre-merge flow. Wire into CI verify job when documentation changes are frequent.

---

## Related

- [TESTING.md](./TESTING.md) — test pyramid
- [CONTRIBUTING_EXTENDED.md](./CONTRIBUTING_EXTENDED.md) — PR protocol
