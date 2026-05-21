# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. Replace every `PENDING` value before marking the build production ready.

## Release Identity

| Field | Value |
|---|---|
| Release candidate commit | PENDING |
| Release owner | PENDING |
| Review date | PENDING |
| Final status | PENDING |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | PENDING | PENDING |
| Build artifact | `vishvakarma-os-dist` uploaded | PENDING | PENDING |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | PENDING | PENDING |
| Playwright report | `playwright-auth-gate-report` uploaded | PENDING | PENDING |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Vercel deployment | Preview or production URL opens | PENDING | PENDING |
| `/auth` screenshot | Signed-out auth page visible | PENDING | PENDING |
| Private route redirect | Signed-out `/releases` redirects to `/auth` | PENDING | PENDING |
| Authenticated editor | `/` opens after sign-in | PENDING | PENDING |
| Governance routes | All private governance routes render | PENDING | PENDING |

## Supabase Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Environment variables | Host has Supabase URL and anon key | PENDING | PENDING |
| Auth provider | Email-link / OTP enabled | PENDING | PENDING |
| Redirect URLs | Production URL allowlisted | PENDING | PENDING |
| Migrations | Latest migrations applied | PENDING | PENDING |
| RLS | Protected tables have RLS enabled | PENDING | PENDING |
| Policies | Owner policies exist | PENDING | PENDING |
| Profile creation | `/auth` account creates profile row | PENDING | PENDING |
| Advisor output | No unresolved critical RLS warning | PENDING | PENDING |

## Manual Device Evidence

| Device | Route / flow | Status | Notes |
|---|---|---|---|
| Desktop Chrome | Full auth and editor smoke | PENDING | PENDING |
| iPad / tablet | Editor and 3D fallback smoke | PENDING | PENDING |
| Mobile width | Auth and nav smoke | PENDING | PENDING |

## Stop-Ship Review

- [ ] No failing CI gate.
- [ ] No failing E2E gate.
- [ ] No exposed private route while signed out.
- [ ] No missing Supabase production env value.
- [ ] No unapplied migration.
- [ ] No unresolved Supabase RLS/security advisor warning.
- [ ] No blank page on any production route.
- [ ] No WebGL crash that takes down the full app.

## Final Decision

| Decision | Reviewer | Date | Notes |
|---|---|---|---|
| PENDING | PENDING | PENDING | PENDING |
