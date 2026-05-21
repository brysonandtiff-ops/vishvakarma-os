# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Release candidate commit | `d65c686e38b96bcb8d50fa9424ea166614dd1712` |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-05-22 Australia/Perth |
| Final status | BLOCKED — proof gates are built, but CI, deployment, live migration/RLS, and manual screenshots are not fully proven yet |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | UNPROVEN | GitHub returned no combined status and no workflow runs for commit `d65c686e38b96bcb8d50fa9424ea166614dd1712` |
| Build artifact | `vishvakarma-os-dist` uploaded | UNPROVEN | No workflow run/artifact returned for release candidate commit |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | UNPROVEN | No workflow run returned for release candidate commit |
| Playwright report | `playwright-auth-gate-report` uploaded | UNPROVEN | No workflow run/artifact returned for release candidate commit |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Vercel deployment | Preview or production URL opens | BLOCKED | Vercel team `TYRASIC CREATIONS` is connected, but no `vishvakarma-os` project was listed. Existing projects found: `dentalstudio-os`, `skysentinel-os`, `vibe-coder-tycoon` |
| `/auth` screenshot | Signed-out auth page visible | NOT RUN | Requires Vercel/local preview capture |
| Private route redirect | Signed-out `/releases` redirects to `/auth` | NOT RUN | Playwright test exists, but workflow evidence not returned |
| Authenticated editor | `/` opens after sign-in | NOT RUN | Requires live Supabase Auth email-link proof |
| Governance routes | All private governance routes render | NOT RUN | Requires authenticated preview smoke test |

## Supabase Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Environment variables | Host has Supabase URL and anon key | UNPROVEN | Vercel `vishvakarma-os` project not found, so host env values could not be checked |
| Auth provider | Email-link / OTP enabled | UNPROVEN | Supabase Auth provider settings not directly proven in this run |
| Redirect URLs | Production URL allowlisted | UNPROVEN | No Vercel deployment URL found for allowlist verification |
| Migrations | Latest migrations applied | BLOCKED | Supabase project `Vishvakarma.OS` / `jyocvwipthswfcmvqgqe` exists but is `INACTIVE`; migration listing timed out |
| RLS | Protected tables have RLS enabled | BLOCKED | Supabase table inspection timed out for project `jyocvwipthswfcmvqgqe` |
| Policies | Owner policies exist | BLOCKED | Supabase table/policy inspection could not be completed because database query timed out |
| Profile creation | `/auth` account creates profile row | NOT RUN | Requires active Supabase project and live auth email-link test |
| Advisor output | No unresolved critical RLS warning | PASS — PARTIAL | Supabase security advisor returned `lints: []`; performance advisor returned `lints: []`. This does not replace table/RLS proof because database inspection timed out |

## Manual Device Evidence

| Device | Route / flow | Status | Notes |
|---|---|---|---|
| Desktop Chrome | Full auth and editor smoke | NOT RUN | Requires preview/deployment URL |
| iPad / tablet | Editor and 3D fallback smoke | NOT RUN | Requires preview/deployment URL and physical/simulator check |
| Mobile width | Auth and nav smoke | NOT RUN | Requires preview/deployment URL |

## Stop-Ship Review

- [ ] No failing CI gate. — UNPROVEN, no workflow run returned.
- [ ] No failing E2E gate. — UNPROVEN, no workflow run returned.
- [ ] No exposed private route while signed out. — UNPROVEN in live browser; E2E spec exists but has not returned green workflow proof.
- [ ] No missing Supabase production env value. — UNPROVEN, Vercel project not found.
- [ ] No unapplied migration. — BLOCKED, Supabase project inactive and migration query timed out.
- [x] No unresolved Supabase advisor warning. — PARTIAL PASS, security/performance advisors returned empty lint lists.
- [ ] No blank page on any production route. — NOT RUN, no deployment/preview smoke evidence attached.
- [ ] No WebGL crash that takes down the full app. — NOT RUN in this proof pass.

## Final Decision

| Decision | Reviewer | Date | Notes |
|---|---|---|---|
| BLOCKED | Bryson Erdmann / evidence execution pass | 2026-05-22 Australia/Perth | Do not mark production ready until GitHub workflows are visible and green, Vercel deployment exists, Supabase project is active, migrations/RLS are proven, and screenshots/manual smoke evidence are attached |
