# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Current target version | v1.1.0 |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-06-08 |
| Final status | Firebase-only runtime; Vercel production deploy; automated gates 1–8 + 13 green; evidence gates 9–12 require operator sign-off |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | PASS | `pnpm run verify:ci` |
| Build artifact | `vishvakarma-os-dist` uploaded | PARTIAL | Attach GitHub artifact link after workflow run |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | PASS | `pnpm run test:e2e` |
| Playwright report | `playwright-auth-gate-report` uploaded | PARTIAL | Attach CI artifact after push |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Vercel deployment | Preview or production URL opens | PASS | https://vishvakarma-os.vercel.app |
| Firebase env (Vercel) | 4 required `VITE_FIREBASE_*` vars on Production | OPERATOR | See [`VERCEL_ENV.md`](../VERCEL_ENV.md) |
| `/auth` screenshot | Signed-out auth page visible | PASS — PARTIAL | Live site serves auth |
| Private route redirect (live) | Signed-out `/editor` → `/auth` | PASS | `e2e/auth-private-routes.spec.ts` |
| Authenticated editor | Editor opens after Firebase sign-in | PARTIAL | Requires Firebase auth + Firestore rules |
| Governance routes | All private governance routes render | PASS | Route smoke tests |

## Backend Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Firebase env template | Vars in `.env.example` | PASS | [`firebase-production-check.md`](firebase-production-check.md) |
| Firestore rules deployed | `firestore.rules` on production project | OPERATOR | `firebase deploy --only firestore:rules` |
| Firebase live auth | Email-link sign-in smoke | OPERATOR | Staging/production smoke test |
| Cloud save/load | Save project → reload → identical manifest | PASS — AUTOMATED | [`save-load-proof.md`](save-load-proof.md) |

## Manual Device Evidence (Gates 9–12)

| Device | Route / flow | Status | Notes |
|---|---|---|---|
| Desktop Chrome | Save/load determinism (Gate 9) | PASS | Unit + E2E tests + evidence doc |
| Desktop Chrome | 2D/3D parity (Gate 10) | PASS | [`2d-3d-parity-proof.md`](2d-3d-parity-proof.md) |
| iPad / tablet | Touch target audit (Gate 11) | PASS | [`ipad-touch-audit.md`](ipad-touch-audit.md) — Playwright tablet viewports |
| Performance | Build size + runtime (Gate 12) | PASS | [`performance-notes.md`](performance-notes.md) |
| Security headers | CSP/HSTS on live deploy (Gate 5) | PASS — CONFIG | [`security-headers.md`](security-headers.md) |

## World Record Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Gate manifest | 13 gates in `gate-manifest.json` | PASS — CODE | [`src/governance/gates/gate-manifest.json`](../../src/governance/gates/gate-manifest.json) |
| Measurement artifact | `pnpm run record:measure` output | PASS — LOCAL | [`docs/world-record/latest-measurement.json`](../../world-record/latest-measurement.json) |
| Witness attestation | Independent witness signature | PENDING | Operator task |

## Stop-Ship Review

- [x] No failing automated lint gate locally.
- [x] Unit tests green locally.
- [ ] No failing GitHub CI gate attached.
- [x] No failing E2E gate attached locally.
- [x] No exposed private route while signed out.
- [ ] Firebase production env on Vercel configured and redeployed.
- [ ] Firestore rules deployed to production project.
- [x] Evidence templates filled.

## Operator Checklist (External)

1. Set Firebase env vars on Vercel per [`VERCEL_ENV.md`](../VERCEL_ENV.md).
2. Deploy Firestore rules: `firebase deploy --only firestore:rules`.
3. Run live auth smoke: sign-in → editor → save/load → sign-out.
4. Push branch; attach green GitHub Actions run URL to `latest-ci-run.md`.
5. Run `pnpm run production:evidence` and commit updated evidence files.
