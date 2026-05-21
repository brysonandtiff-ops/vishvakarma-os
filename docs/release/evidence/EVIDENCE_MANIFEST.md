# Vishvakarma.OS Evidence Manifest

This file is the production release evidence ledger. It must be updated whenever proof gates are re-run.

## Release Identity

| Field | Value |
|---|---|
| Current end-of-day commit | `721fa0c02feb007202b3d3f94ca195d96f073124` |
| Release owner | Bryson Erdmann / TYRASIC CREATIONS |
| Review date | 2026-05-22 Australia/Perth |
| Final status | BLOCKED FOR FULL PRODUCTION — latest Vercel deploy is green and logo cleanup is complete, but CI/E2E workflow proof, Supabase migration/RLS proof, authenticated route checks, and manual screenshots still need to be attached |

## CI Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Verify workflow | Install, lint, tests, route smoke, build | UNPROVEN | No green GitHub Actions workflow evidence attached to this manifest yet |
| Build artifact | `vishvakarma-os-dist` uploaded | UNPROVEN | No artifact link attached yet |
| E2E Auth Gate | Browser proof for `/auth` and private route redirect | UNPROVEN | E2E workflow/report not attached yet |
| Playwright report | `playwright-auth-gate-report` uploaded | UNPROVEN | No report link attached yet |

## Deployment Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Vercel deployment | Preview or production URL opens | PASS — PARTIAL | Latest checked commit `721fa0c02feb007202b3d3f94ca195d96f073124` has Vercel status `success`: `https://vercel.com/tyrasic-creations/vishvakarma-os/4Wi4qmsd5FjYeBXqP5r5vyqYmDgy` |
| `/auth` screenshot | Signed-out auth page visible | PASS — PARTIAL | User-provided browser screenshot showed `/auth` deployed at `https://vishvakarma-os.vercel.app/auth` with black/gold access screen. Logo mismatch was identified and fixed after that screenshot. |
| Logo correctness | App uses user-supplied logo, not generated SVG | PASS — CODE | Generated SVG asset deleted; React surfaces now use `src/brand/officialLogo.ts` / `OFFICIAL_LOGO_SRC`; reference sweep found no remaining `vishvakarma-official-logo.svg` references |
| Private route redirect | Signed-out `/releases` redirects to `/auth` | NOT RUN | Needs live route check or Playwright report |
| Authenticated editor | `/` opens after sign-in | NOT RUN | Requires live Supabase Auth email-link proof |
| Governance routes | All private governance routes render | NOT RUN | Requires authenticated preview smoke test |

## Supabase Evidence

| Gate | Required proof | Status | Link / artifact |
|---|---|---|---|
| Environment variables | Host has Supabase URL and anon key | UNPROVEN | Vercel env values not attached to this manifest yet |
| Auth provider | Email-link / OTP enabled | UNPROVEN | Supabase Auth provider settings not directly proven in this run |
| Redirect URLs | Production URL allowlisted | UNPROVEN | Production URL allowlist verification not attached yet |
| Migrations | Latest migrations applied | BLOCKED | Supabase project `Vishvakarma.OS` / `jyocvwipthswfcmvqgqe` previously existed but was `INACTIVE`; migration listing timed out |
| RLS | Protected tables have RLS enabled | BLOCKED | Supabase table inspection previously timed out for project `jyocvwipthswfcmvqgqe` |
| Policies | Owner policies exist | BLOCKED | Supabase table/policy inspection could not be completed because database query timed out |
| Profile creation | `/auth` account creates profile row | NOT RUN | Requires active Supabase project and live auth email-link test |
| Advisor output | No unresolved critical RLS warning | PASS — PARTIAL | Supabase security advisor returned `lints: []`; performance advisor returned `lints: []`. This does not replace table/RLS proof because database inspection timed out |

## Manual Device Evidence

| Device | Route / flow | Status | Notes |
|---|---|---|---|
| Desktop Chrome | `/auth` signed-out screen | PASS — PARTIAL | User screenshot confirms deployed `/auth` route before logo correction. Needs refreshed screenshot after logo correction deploy. |
| Desktop Chrome | Full auth and editor smoke | NOT RUN | Requires sign-in and private editor route check |
| iPad / tablet | Editor and 3D fallback smoke | NOT RUN | Requires physical/simulator check |
| Mobile width | Auth and nav smoke | NOT RUN | Requires mobile viewport check |

## Stop-Ship Review

- [ ] No failing CI gate. — UNPROVEN, no workflow run attached.
- [ ] No failing E2E gate. — UNPROVEN, no workflow run/report attached.
- [ ] No exposed private route while signed out. — UNPROVEN in live browser; check `/releases` while signed out.
- [ ] No missing Supabase production env value. — UNPROVEN, env screenshot/output not attached.
- [ ] No unapplied migration. — BLOCKED, Supabase project inactive/table checks not proven.
- [x] No unresolved Supabase advisor warning. — PARTIAL PASS, security/performance advisors returned empty lint lists.
- [ ] No blank page on any production route. — PARTIAL ONLY, `/auth` screenshot proves one route before final logo correction.
- [ ] No WebGL crash that takes down the full app. — NOT RUN.

## Final Decision

| Decision | Reviewer | Date | Notes |
|---|---|---|---|
| BLOCKED FOR FULL PRODUCTION | Bryson Erdmann / end-of-day hygiene pass | 2026-05-22 Australia/Perth | Repo is safe to continue tomorrow. Latest Vercel deploy is green and generated SVG logo cleanup is complete. Do not mark full production ready until CI/E2E, private-route redirect, Supabase Auth/RLS, editor smoke, and updated screenshots are attached |
