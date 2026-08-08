# Vishvakarma.OS Launch Evidence Index

## Accelerated v1.5.0 Candidate

| Field | State |
|---|---|
| Release PR | `#123` |
| Candidate branch | `agent/accelerated-v1.5.0-closeout-20260717` |
| Candidate code SHA before evidence refresh | `5822cb04d12238d30c3695d6f6e98579aa6977ba` |
| Production `main` base | `fdc0f61b8f2632bb30ec852f79c06f43959631ff` |
| Route/device matrix | **PASS — 60/60** |
| Firefox auth + smoke | **PASS** |
| WebKit auth + smoke | **PASS** |
| Supabase leaked-password protection | **PASS — enabled** |
| Supabase TOTP MFA | **PASS — enabled** |
| Accessibility audit | **PASS — 3/3 routes** |
| Chromium shared failures | Batched and fixed on candidate |
| Blocking session boot screen | **REMOVED** — visual component and `boot` layout path deleted |
| Startup splash and iOS launch screens | **REMOVED** |
| Rage-click frustration detector and Shunya Reset overlay | **REMOVED** |
| Removal regressions | Enforced by unit and E2E release guards |
| Workflow policy blocker | Fixed — unauthorized `final-certification-v1.5.0.yml` deleted |
| Approved certification path | Sole allow-listed `.github/workflows/production-certification.yml` on PR #123 |
| Freeze/tag | Blocked only until exact PR-head certification is green |

## Accelerated Fix Batch

The release candidate resolves the shared causes captured by the Chromium certification evidence:

- current landing, CTA, 404, pricing-off and reset-password contracts,
- visible-only mobile and workspace navigation controls,
- first-run overlay exclusivity on tablet and phone,
- actual menu/dialog surfaces instead of Radix positioning wrappers,
- deterministic touch and Pencil wall drawing plus eraser verification,
- stable project, export and Copilot dialog activation,
- local project persistence and profile sign-out contracts,
- reset-password-unavailable notice on the Google SSO auth page,
- removal of the full-screen secure-session boot/mandala experience while retaining fail-closed route protection,
- removal of startup splash/launch-image interruptions,
- deletion of the rapid-click frustration detector, bell and Shunya Reset blocking overlay.

## Evidence Rules

- Evidence must reference the exact commit SHA and deployment URL it came from.
- A route-matrix pass does not replace Chromium, accessibility, performance, production-auth or strict release certification.
- Temporary certification branches, workflows, Vercel configs and draft PRs must never be merged into production.
- The `v1.5.0` tag must point to the exact verified production `main` SHA.
- **Do not mark production ready** while any required launch evidence or strict gate remains incomplete.
- Do not claim 100% until the approved certification evidence is green for the final production-safe candidate.

## Minimum Public Launch Bundle

The minimum public launch bundle contains:

1. a green unit/security/production build,
2. the 60/60 route and device matrix,
3. Chromium, Firefox and WebKit browser evidence,
4. accessibility and editor-performance evidence,
5. production authentication verification,
6. strict release and launch-evidence gates,
7. an exact production deployment SHA,
8. a frozen release branch and `v1.5.0` tag pointing to that SHA.

## Remaining Release Sequence

1. Complete the approved certification evidence for PR #123.
2. Squash-merge only the verified production-safe candidate.
3. Verify the exact merged `main` production deployment.
4. Create the frozen release branch and `v1.5.0` tag on that same SHA.
