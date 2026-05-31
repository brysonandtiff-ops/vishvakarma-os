# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Current end-of-day commit | `515adc0` (Lovable disconnect + Vercel Supabase env) |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-05-31 Australia/Perth |
| Final status | Lovable disconnected (documented); Vercel sole deploy with Supabase env; live auth gate PASS. Supabase migrations pending dashboard apply — see [`SUPABASE_MIGRATIONS_APPLY.md`](../SUPABASE_MIGRATIONS_APPLY.md). |

## Lovable Disconnect (2026-05-31)

| Step | Status | Notes |
|---|---|---|
| Lovable GitHub disconnect | DOCUMENTED | Manual checklist in [`VERCEL_ENV.md`](../VERCEL_ENV.md) — operator completes in Lovable + GitHub UI |
| Revoke Lovable GitHub App / webhooks | DOCUMENTED | Same checklist |
| Remove Lovable workspace paths from code | PASS | `specValidation.ts` uses `join(process.cwd(), 'docs', ...)` |
| Remove unused `VITE_APP_ID` | PASS | Removed from `.env.local`; not referenced in `src/` |
| Vercel-only deploy path | PASS | `vercel.json` install/build/output explicit; Git → Vercel on `main` |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | PASS — LOCAL 2026-05-31 | `pnpm run verify:ci` — 448 tests, lint, build OK |
| Build artifact | `vishvakarma-os-dist` uploaded | PARTIAL | Local `dist/` built; attach GitHub artifact link after workflow run |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | PASS — LOCAL 2026-05-31 | `pnpm run test:e2e` — 37/37 passed |
| Playwright report | `playwright-auth-gate-report` uploaded | PARTIAL | Local run green; attach CI artifact after push |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Vercel deployment | Preview or production URL opens | PASS — 2026-05-31 | https://vishvakarma-os.vercel.app (deploy `dpl_3SXwGBCDxWoikHui5kBcZz5gzxk2`) |
| Vercel Supabase env | `VITE_BACKEND_PROVIDER`, URL, anon key on Production | PASS — 2026-05-31 | Set via Vercel CLI; redeploy required after change |
| `/auth` screenshot | Signed-out auth page visible | PASS — PARTIAL | Live site serves auth; refresh screenshot optional |
| Logo correctness | App uses user-supplied logo | PASS — CODE | `src/brand/officialLogo.ts` |
| Private route redirect (live) | Signed-out `/editor` → `/auth` | PASS — LIVE 2026-05-31 | Playwright: `PLAYWRIGHT_BASE_URL=https://vishvakarma-os.vercel.app` — 2.9s |
| Private route redirect (local E2E) | Signed-out private routes redirect | PASS — LOCAL | `e2e/auth-private-routes.spec.ts` |
| Authenticated editor | `/` opens after sign-in | PARTIAL | Requires Supabase magic-link sign-in + migrations for cloud save |
| Governance routes | All private governance routes render | PARTIAL | Route smoke tests pass locally |

## Backend Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Firebase env template | 6 vars in `.env.example` | PASS | [`firebase-production-check.md`](firebase-production-check.md) |
| Supabase env template | URL + anon key in `.env.example` | PASS | [`supabase-production-check.md`](supabase-production-check.md) |
| Supabase production env (Vercel) | 3 vars set + redeploy | PASS — 2026-05-31 | `VITE_BACKEND_PROVIDER=supabase` + URL + anon key |
| Supabase migrations | Migrations applied + RLS | BLOCKED — OPERATOR | CLI/MCP lack access to `amjlqwcauqeggrmkntlw`; apply via [`SUPABASE_MIGRATIONS_APPLY.md`](../SUPABASE_MIGRATIONS_APPLY.md) |
| Profile creation | Auth creates profile row | NOT RUN | Requires migrations on live project |
| Firebase live auth | Email-link sign-in smoke | N/A | Production uses Supabase backend |

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
- [x] Unit tests green locally (`pnpm run verify:ci` — 448 passed 2026-05-31).
- [ ] No failing GitHub CI gate attached. — attach workflow URL after push.
- [x] No failing E2E gate attached locally (37/37 Playwright 2026-05-31).
- [x] No exposed private route while signed out (live `/editor` → `/auth`).
- [x] Supabase production env on Vercel configured and redeployed.
- [ ] No unapplied migration (live Supabase). — operator: SQL Editor per `SUPABASE_MIGRATIONS_APPLY.md`.
- [ ] Lovable fully disconnected in GitHub UI. — operator: checklist in `VERCEL_ENV.md`.
- [x] No unresolved Supabase advisor warning (prior run).
- [x] Evidence templates filled (no Pending placeholders in manual bundle).

## Final Decision

| Decision | Reviewer | Date | Notes |
|---|---|---|---|
| LOVABLE DISCONNECT + VERCEL DEPLOY | Automated completion pass | 2026-05-31 | Code cleanup, Vercel Supabase env, production redeploy `dpl_3SXwGBCDxWoikHui5kBcZz5gzxk2`, live auth redirect PASS. Apply Supabase migrations in dashboard; complete Lovable GitHub revoke in browser. |

## Operator Checklist (External)

1. Complete Lovable disconnect in Lovable + GitHub (see [`VERCEL_ENV.md`](../VERCEL_ENV.md)).
2. Apply Supabase migrations in dashboard for project `amjlqwcauqeggrmkntlw` (see [`SUPABASE_MIGRATIONS_APPLY.md`](../SUPABASE_MIGRATIONS_APPLY.md)).
3. Run live auth smoke: sign-in → editor → governance → sign-out.
4. Push branch; attach green GitHub Actions run URL to `latest-ci-run.md`.
5. Run `pnpm run production:evidence` and commit updated evidence files after migrations PASS.
