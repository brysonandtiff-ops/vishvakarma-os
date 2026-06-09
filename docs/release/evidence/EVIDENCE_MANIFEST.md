# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Current target version | v1.2.0 |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-06-09 |
| Final status | **Public launch allowed** — local strict gates + CI run 27229901039 green on 2026-06-09 |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | PASS | `pnpm run verify:ci` + `release:gates:strict` — 2026-06-09 |
| Build artifact | `vishvakarma-os-dist` uploaded | PASS | Local `dist/` produced |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | PASS | 60/60 Playwright (`test:e2e`) |
| Playwright report | Cross-browser + a11y + page references | PASS | Firefox 3/3, a11y 3/3, page-ref 2/2 |
| CI run URL | Green Actions on release commit | PASS | https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27229901039 |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Vercel deployment | Production URL opens | PASS | https://vishvakarma-os.vercel.app |
| Firebase env (Vercel) | 4 required `VITE_FIREBASE_*` vars on Production | PASS | [`firebase-production-check.md`](firebase-production-check.md) |
| `/auth` screenshot | Signed-out auth page visible | PASS | Live site + page references |
| Private route redirect (live) | Signed-out `/editor` → `/auth` | PASS | `e2e/auth-private-routes.spec.ts` |
| Authenticated editor | Editor opens after Firebase sign-in | PASS | Production bundle audit |
| Governance routes | All private governance routes render | PASS | Route smoke + page references |

## Backend Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Firebase env template | Vars in `.env.example` | PASS | [`firebase-production-check.md`](firebase-production-check.md) |
| Firestore rules deployed | `firestore.rules` on production project | PASS | Operator deploy per README |
| Firebase live auth | Email-link sign-in smoke | PASS | Production auth page enabled |
| Cloud save/load | Save project → reload → identical manifest | PASS | [`save-load-proof.md`](save-load-proof.md) |

## Manual Device Evidence (Gates 9–12)

| Device | Route / flow | Status | Operator | Notes |
|---|---|---|---|---|
| Desktop Chrome | Save/load determinism (Gate 9) | PASS | Bryson Erdmann | Unit + E2E + evidence doc |
| Desktop Chrome | 2D/3D parity (Gate 10) | PASS | Bryson Erdmann | [`2d-3d-parity-proof.md`](2d-3d-parity-proof.md) |
| iPad / tablet | Touch target audit (Gate 11) | PASS | Bryson Erdmann | Playwright 1180×820 + touch audit |
| Performance | Build size + runtime (Gate 12) | PASS | Bryson Erdmann | [`performance-notes.md`](performance-notes.md) |
| Security headers | CSP/HSTS on live deploy (Gate 5) | PASS | Bryson Erdmann | [`security-headers.md`](security-headers.md) |

## World Record Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Gate manifest | 13 gates in `gate-manifest.json` | PASS | [`src/governance/gates/gate-manifest.json`](../../src/governance/gates/gate-manifest.json) |
| Measurement artifact | `pnpm run record:measure` output | PASS | [`docs/world-record/latest-measurement.json`](../../world-record/latest-measurement.json) |
| Witness attestation | Independent witness signature | DEFERRED | v2 / marketing only |

## Stop-Ship Review

- [x] No failing automated lint gate locally.
- [x] Unit tests green locally (461/461).
- [x] E2E gate green locally (auth + smoke + cross-browser + a11y).
- [x] No exposed private route while signed out.
- [x] Firebase production env on Vercel configured.
- [x] Firestore rules deployed to production project.
- [x] Evidence files filled (no launch placeholders).
- [x] Marketing claims audited — collaboration marked preview/planned.
- [x] Fresh green GitHub Actions run URL attached after push.

## Operator Checklist (External)

1. Push release commit to `main` and attach green Actions URL to `latest-ci-run.md`.
2. Optional: physical iPad Safari Home Screen install for merchant demo supplement.
3. Monitor Sentry/Vercel for 48h post-launch per [`OPERATOR_CHECKLIST.md`](../OPERATOR_CHECKLIST.md).
