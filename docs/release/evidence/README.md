# Vishvakarma.OS Launch Evidence Index

## Accelerated v1.5.0 Candidate

| Field | State |
|---|---|
| Candidate branch | `agent/accelerated-v1.5.0-closeout-20260717` |
| Candidate source head | `fcd412baaf915a090635cdbd11596f6c80b20949` |
| Production `main` | `b57b946bdc41142ceacdd9fa08569373394d7a36` — unchanged |
| Route/device matrix | **PASS — 60/60** |
| Firefox auth + smoke | **PASS** |
| WebKit auth + smoke | **PASS** |
| Supabase leaked-password protection | **PASS — enabled** |
| Supabase TOTP MFA | **PASS — enabled** |
| Accessibility stale locator | Fixed on candidate |
| Chromium shared failures | Batched and fixed on candidate |
| Deployment blocker | Vercel project currently reports `live: false`; new preview deployments are not being created |
| Freeze/tag | Blocked until focused exact-candidate phases execute and pass |

## Accelerated Chromium Fix Batch

The accelerated candidate resolves the shared failure causes captured by the saved Chromium certification snapshot:

- current landing, CTA, 404, pricing-off and reset-password contracts,
- visible-only mobile and workspace navigation controls,
- first-run overlay exclusivity on tablet and phone,
- actual menu/dialog surfaces instead of Radix positioning wrappers,
- deterministic touch and Pencil wall drawing plus eraser verification,
- stable project, export and Copilot dialog activation,
- local project persistence and profile sign-out contracts,
- reset-password-unavailable notice on the Google SSO auth page.

## Evidence Rules

- Evidence must reference the exact commit SHA and deployment URL it came from.
- A route-matrix pass does not replace Chromium, accessibility, performance, production-auth or strict release certification.
- Temporary certification branches, workflows, Vercel configs and draft PRs must never be merged into production.
- The `v1.5.0` tag must point to the exact verified production `main` SHA.
- Do not claim 100% while Vercel remains unable to execute the final focused phases.

## Remaining Release Sequence

1. Resume Vercel project deployments.
2. Run focused exact-candidate Chromium, accessibility, performance/auth, release and evidence phases.
3. Merge only the verified production-safe candidate.
4. Verify the exact production `main` deployment.
5. Create the frozen release branch and `v1.5.0` tag on that same SHA.
