# Vishvakarma.OS Production Evidence Pack

This folder stores release-proof artifacts for Vishvakarma.OS production readiness.

## Required evidence files

| Evidence | File / folder | Required before production |
|---|---|---|
| Main CI workflow result | `ci-verify.md` | Yes |
| Browser auth E2E result | `e2e-auth-gate.md` | Yes |
| Vercel deployment proof | `vercel-deployment.md` | Yes |
| Supabase RLS proof output | `supabase-rls-output.md` | Yes |
| Supabase Auth configuration proof | `supabase-auth-config.md` | Yes |
| Route screenshots | `screenshots/` | Yes |
| Manual iPad/tablet smoke notes | `manual-device-smoke.md` | Yes |

## Evidence quality rule

Evidence must include exact dates, commit SHA, URLs where applicable, pass/fail status, and reviewer initials.

Do not mark production ready if any required evidence file is missing or still contains placeholder values.
