# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Current end-of-day commit | (see git log after production polish commit) |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-05-31 Australia/Perth |
| Final status | PRODUCTION POLISH — `pnpm run verify:ci` passed (428 unit tests, lint, build). UI truthfulness + auth hardening shipped. Vercel Supabase env + E2E attach still operator tasks. |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | PASS — LOCAL 2026-05-31 | `pnpm run verify:ci` — 428 tests, lint, build OK |
| Build artifact | `vishvakarma-os-dist` uploaded | PARTIAL | Local `dist/` built; attach GitHub artifact link after workflow run |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | PARTIAL | Playwright scaffold in `.github/workflows/e2e.yml`; attach report after green run |
| Playwright report | `playwright-auth-gate-report` uploaded | PARTIAL | Run `pnpm run test:e2e` locally or attach CI artifact |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Vercel deployment | Preview or production URL opens | PASS — PARTIAL | https://vishvakarma-os.vercel.app |
| `/auth` screenshot | Signed-out auth page visible | PASS — PARTIAL | Prior screenshot; refresh after Firebase env configured |
| Logo correctness | App uses user-supplied logo | PASS — CODE | `src/brand/officialLogo.ts` |
| Private route redirect | Signed-out `/releases` redirects to `/auth` | PARTIAL | E2E spec covers; live proof pending Firebase on Vercel |
| Authenticated editor | `/` opens after sign-in | PARTIAL | Requires Firebase production env on Vercel |
| Governance routes | All private governance routes render | PARTIAL | Route smoke tests pass locally |

## Backend Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Firebase env template | 6 vars in `.env.example` | PASS | [`firebase-production-check.md`](firebase-production-check.md) |
| Supabase env template | URL + anon key in `.env.example` | PASS | [`supabase-production-check.md`](supabase-production-check.md) |
| Firebase live auth | Email-link sign-in smoke | PARTIAL | Operator: configure Vercel Firebase vars, run auth smoke |
| Supabase migrations | Migrations applied + RLS | PARTIAL | Operator: reactivate project, apply `supabase/migrations/`, run [`SUPABASE_RLS_EVIDENCE.md`](../SUPABASE_RLS_EVIDENCE.md) |
| Profile creation | Auth creates profile row | NOT RUN | Requires active Supabase + Firebase |

## Manual Device Evidence

| Device | Route / flow | Status | Notes |
|---|---|---|---|
| Desktop Chrome | Save/load determinism | PARTIAL | [`save-load-proof.md`](save-load-proof.md) — import/export unit tests pass |
| Desktop Chrome | 2D/3D parity | PASS | [`2d-3d-parity-proof.md`](2d-3d-parity-proof.md) — sample counts verified |
| iPad / tablet | Touch target audit | PARTIAL | [`ipad-touch-audit.md`](ipad-touch-audit.md) — Playwright tablet viewports |
| Performance | Build size + runtime | PASS | [`performance-notes.md`](performance-notes.md) |
| Security headers | CSP/HSTS on live deploy | PASS — CONFIG | [`security-headers.md`](security-headers.md) — vercel.json verified |

## World Record Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Gate manifest | 12 metric gates + 13 total in `gate-manifest.json` | PASS — CODE | [`src/governance/gates/gate-manifest.json`](../../src/governance/gates/gate-manifest.json) |
| Measurement artifact | `pnpm run record:measure` output | PASS — LOCAL | [`docs/world-record/latest-measurement.json`](../../world-record/latest-measurement.json) |
| Claim document | Honest status + metric definition | PASS | [`docs/world-record/WORLD_RECORD_CLAIM.md`](../../world-record/WORLD_RECORD_CLAIM.md) |
| Competitor baseline | Point-in-time survey | PASS — SURVEY | [`docs/world-record/COMPETITOR_BASELINE.md`](../../world-record/COMPETITOR_BASELINE.md) |
| Witness attestation | Independent witness signature | PENDING | [`docs/world-record/WITNESS_ATTESTATION.md`](../../world-record/WITNESS_ATTESTATION.md) |
| Guinness application | Official GWR certificate | NOT SUBMITTED | [`docs/world-record/GUINNESS_APPLICATION.md`](../../world-record/GUINNESS_APPLICATION.md) |
| In-app registry | `/world-records` route | PASS — CODE | Self-Verified Candidate badge until GWR certificate attached |

## Stop-Ship Review

- [x] No failing automated lint gate locally.
- [x] Unit tests green locally (`pnpm run verify:ci` — 428 passed 2026-05-31).
- [ ] No failing GitHub CI gate attached. — attach workflow URL after push.
- [ ] No failing E2E gate attached. — attach Playwright report after push.
- [ ] No exposed private route while signed out (live). — requires Firebase on Vercel.
- [ ] No missing Supabase/Firebase production env on Vercel. — operator task.
- [ ] No unapplied migration (live Supabase). — operator task.
- [x] No unresolved Supabase advisor warning (prior run).
- [x] Evidence templates filled (no Pending placeholders in manual bundle).

## Final Decision

| Decision | Reviewer | Date | Notes |
|---|---|---|---|
| PRODUCTION POLISH SHIPPED | Automated completion pass | 2026-05-31 | Production mode, honest Release Center snapshot, working editor undo/material, NotFound route, ToolRail trimmed. Deploy: https://vishvakarma-os.vercel.app — set Vercel env per VERCEL_ENV.md. |

## Operator Checklist (External)

1. Reactivate or recreate Supabase project; apply migrations from `supabase/migrations/`.
2. Configure Vercel env: Firebase (4 required) + Supabase (2 required).
3. Run live auth smoke: sign-in → editor → governance → sign-out.
4. Push branch; attach green GitHub Actions run URL to `latest-ci-run.md`.
5. Run `pnpm run production:evidence` and commit updated evidence files.
