# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Current target version | v1.2.0 |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-06-14 |
| Final status | **Launch evidence pack attached (#6, PARTIAL)** — core CI green; webkit/firefox e2e follow-up |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | PASS | [Actions run 27497509900](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27497509900) — primary job green |
| Build artifact | `vishvakarma-os-dist` uploaded | PASS | Same run — artifact uploaded |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | PASS | [Actions run 27497509894](https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27497509894) |
| Playwright report | Cross-browser + a11y + page references | PARTIAL | Chromium PASS; webkit 1 fail; firefox timeout on 27497509900 |
| CI run URL | Green Actions on release commit | PARTIAL | Attached — full matrix not yet green |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Canonical deployment | Production URL opens | PASS | https://vishvakarma-os.app |
| Vercel fallback | Debug alias reachable | PASS | https://vishvakarma-os.vercel.app (fallback only) |
| Supabase auth (canonical) | `VITE_SUPABASE_*` + Site URL `.app` | PASS | [`auth-sign-in-proof.md`](auth-sign-in-proof.md) |
| `/auth` on `.app` | Signed-out auth page + Google OAuth start | PASS | Live + `verify:production-auth-flow` |
| Private route redirect (live) | Signed-out `/editor` → `/auth` | PASS | `e2e/auth-private-routes.spec.ts` |
| Authenticated editor | Editor opens after Supabase sign-in | PASS | Operator manual + production bundle |
| Governance routes | All private governance routes render | PASS | Route smoke + page references |

## Backend Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Supabase env template | Vars in `.env.example` | PASS | Canonical `APP_URL` + `VITE_AUTH_REDIRECT_ORIGIN` |
| Cloud save/load | Save project → reload → identical manifest | PARTIAL | [`save-load-proof.md`](save-load-proof.md) — refresh after CI |

## Manual Device Evidence (Gates 9–12)

| Device | Route / flow | Status | Operator | Notes |
|---|---|---|---|---|
| Desktop Chrome | Save/load determinism (Gate 9) | PARTIAL | Bryson Erdmann | Unit + E2E; cloud proof pending |
| Desktop Chrome | 2D/3D parity (Gate 10) | PASS | Bryson Erdmann | [`2d-3d-parity-proof.md`](2d-3d-parity-proof.md) |
| iPad / tablet | Touch target audit (Gate 11) | PARTIAL | Bryson Erdmann | Playwright coarse-pointer; physical iPad optional |
| Performance | Build size + runtime (Gate 12) | PASS | Bryson Erdmann | [`performance-notes.md`](performance-notes.md) |
| Security headers | CSP/HSTS on live deploy (Gate 5) | PASS | Bryson Erdmann | [`security-headers.md`](security-headers.md) — recapture from `.app` recommended |

## World Record Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Gate manifest | 13 gates in `gate-manifest.json` | PASS | [`src/governance/gates/gate-manifest.json`](../../src/governance/gates/gate-manifest.json) |
| Measurement artifact | `pnpm run record:measure` output | PASS | [`docs/world-record/latest-measurement.json`](../../world-record/latest-measurement.json) |
| Witness attestation | Independent witness signature | DEFERRED | v2 / marketing only |

## Stop-Ship Review

- [x] Canonical domain auth proof on `https://vishvakarma-os.app` (#32)
- [x] Supabase `site_url` and redirect URLs include `.app`
- [x] `public/auth-capabilities.json` regenerated with `customDomainAuthRetest: passed`
- [x] Google OAuth is documented production sign-in path; email OTP non-blocking
- [x] Fresh GitHub Actions run URL attached after push (#6, PARTIAL — core green)
- [x] Full functional workflow proof matrix attached (#7)
- [ ] No exposed private route while signed out (re-verify on CI)

## Operator Checklist (External)

1. Confirm Vercel Production env: `VITE_AUTH_REDIRECT_ORIGIN=https://vishvakarma-os.app`, `APP_URL=https://vishvakarma-os.app`, redeploy.
2. Push release commit to `main` and attach green Actions URL to `latest-ci-run.md`.
3. Close GitHub issues #32 (auth/domain), #6 (evidence pack), #7 (functional proof) when CI green.
4. Optional: physical iPad Safari Home Screen install for merchant demo supplement.
