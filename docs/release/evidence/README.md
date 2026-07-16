# Vishvakarma.OS Launch Evidence Index

This folder stores production-launch evidence generated from the current codebase and current deployment target.

## Current Release Candidate

| Field | Verified state |
|---|---|
| Candidate branch | `agent/production-certification-closeout-20260716` |
| Candidate base | Current `main` at `b57b946bdc41142ceacdd9fa08569373394d7a36` |
| Branch drift | `0` commits behind `main` |
| Route matrix | **PASS — 60/60 unique checks** |
| Route devices | Desktop, iPad landscape, phone portrait |
| Supabase leaked-password protection | **PASS — enabled** |
| Supabase TOTP MFA | **PASS — enabled** |
| Overlay exclusivity | Welcome, analytics consent, and QA chrome cannot stack |
| Cast touch target | **PASS — 44px minimum enforced** |
| Marketing contract | Current landing hero and responsive route assertions aligned |
| Final release state | **CANDIDATE — exact-SHA browser/release ladder must pass before merge, freeze, or tag** |

The 60-check route audit covered every routed page for server errors, crash surfaces, visible page identity, browser exceptions, console errors, and horizontal overflow. The final release ladder additionally covers Chromium application workflows, Firefox, WebKit, accessibility, performance, production authentication, strict release gates, and strict evidence validation.

## Required Evidence Files

| File | Purpose | Public Launch Required |
|---|---|---:|
| `latest-ci-run.md` | Records the latest GitHub Actions run and artifact status | Yes |
| `security-headers.md` | Records deployed response headers and CSP/HSTS proof | Yes |
| `auth-sign-in-proof.md` | Proves production auth gate, OAuth redirect, and sign-in evidence | Yes |
| `save-load-proof.md` | Proves project save, reload, export, and import behaviour | Yes |
| `2d-3d-parity-proof.md` | Proves 2D wall/opening data matches 3D render expectations | Yes |
| `ipad-touch-audit.md` | Proves iPad/coarse-pointer touch safety | Yes |
| `performance-notes.md` | Records build size, load behaviour, and interaction performance | Yes |
| `functional-workflow-proof.md` | Proves core app workflows end-to-end | Yes |
| `screenshots/` | Stores route, iPad, parity, and deployment screenshots | Yes |

## Evidence Rules

- Evidence must reference the commit SHA and deployment URL it came from.
- Screenshots or command logs must be current, not copied from older builds.
- Manual evidence cannot be marked complete without a human-readable result and reproduction steps.
- Public production launch remains blocked until every required file is filled.
- Do not mark production ready if any required evidence file is missing or still contains placeholder values.
- A route matrix pass does not replace cross-browser, accessibility, performance, production-auth, or strict release certification.
- The release tag must point to the exact verified production `main` SHA, never a preview or temporary certification branch.

## Evidence Header Template

Use this header in every evidence file:

```txt
Generated from commit: {git commit SHA}
Deployment URL: {production URL}
Generated at: {ISO-8601 timestamp}
Operator: {operator name}
Result: PASS / FAIL / PARTIAL
```

## Launch Gate Interpretation

- `PASS` means the evidence is complete and reproducible.
- `PARTIAL` means the feature may work, but the launch claim is still blocked.
- `FAIL` means public production launch is blocked until fixed and retested.

## Minimum Public Launch Bundle

Before public release, attach:

1. latest green CI run,
2. deployed security header proof,
3. Supabase production auth proof,
4. save/load determinism proof,
5. 2D/3D parity proof,
6. iPad touch audit,
7. performance notes,
8. route screenshots,
9. exact-SHA full certification result,
10. frozen production tag.
