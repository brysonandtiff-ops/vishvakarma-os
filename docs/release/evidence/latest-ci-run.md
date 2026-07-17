# Latest Verification Record

**Updated:** 2026-07-17  
**Release branch:** `agent/accelerated-v1.5.0-closeout-20260717`  
**Current closeout record:** [production-closeout-2026-07-16.md](./production-closeout-2026-07-16.md)

## Workflow Run

The repository has one allow-listed executable workflow: `.github/workflows/production-certification.yml`. It is configured to check out and verify the exact pull-request head SHA before running Supabase Auth hardening, Chromium/Firefox/WebKit E2E, accessibility, performance, production-auth, strict release, and strict launch-evidence commands.

GitHub accepted the workflow event for PR #123 but did not allocate jobs, returning `startup_failure` before any step executed. That event is recorded as infrastructure status only and is not treated as application evidence.

Current executable evidence is being produced through Vercel preview and isolated Sandbox runs against the release-candidate branch. Confirmed results include:

- 60/60 routed page and device checks passed.
- Supabase leaked-password protection and TOTP policy verified.
- Firefox auth and cross-browser smoke passed.
- WebKit auth and cross-browser smoke passed.
- Accessibility audit passed 3/3 routes.
- Normal Vercel unit, security, bundle-budget, PWA-precache, and production build gates passed on the accelerated code line before the final source deletions; the final head must repeat those gates before merge.

## Command Parity

The Vercel/Sandbox certification path uses the same repository commands as the allow-listed workflow. No relaxed substitute commands count as release proof.

```bash
pnpm install --frozen-lockfile
pnpm run setup:supabase-auth:hardening
pnpm run test:e2e
pnpm run test:e2e:cross-browser
pnpm run test:e2e:a11y
pnpm run test:e2e:perf
pnpm run verify:production-auth-flow
pnpm run release:gates:strict
pnpm run launch:evidence:strict
```

Focused reruns may execute a bounded subset of the same Playwright projects or strict gates to isolate a known failure. A focused PASS is retained only when the final release-candidate SHA also passes the normal unit/build gate and no later source change affects that contract.

## Historical evidence

The last older recorded GitHub Actions matrix PASS belongs to commit `cdfb49efcec0d7e6cebbd4f95703de66a7130a17`, generated on 2026-06-14. It remains historical evidence for that SHA only and is not carried forward as proof for the v1.5.0 candidate.

| Historical check | Status at `cdfb49e` |
|---|---:|
| Lint, security, evidence, tests, route smoke, build | PASS |
| Production OAuth | PASS |
| Chromium app smoke | PASS |
| Firefox cross-browser smoke | PASS |
| WebKit cross-browser smoke | PASS |
| Release gate manifest | PASS |

## Current verdict

`DATABASE SECURITY VERIFICATION: PASS`

`FULL CURRENT-SHA APPLICATION CERTIFICATION: IN PROGRESS — MERGE REMAINS BLOCKED`
