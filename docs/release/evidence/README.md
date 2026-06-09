# Vishvakarma.OS Launch Evidence Index

This folder stores production-launch evidence generated from the current codebase and current deployment target.

## Required Evidence Files

| File | Purpose | Public Launch Required |
|---|---|---:|
| `latest-ci-run.md` | Records the latest GitHub Actions run and artifact status | Yes |
| `security-headers.md` | Records deployed response headers and CSP/HSTS proof | Yes |
| `firebase-production-check.md` | Proves Firebase env, auth URLs, and Firestore rules are configured | Yes |
| `save-load-proof.md` | Proves project save, reload, export, and import behaviour | Yes |
| `2d-3d-parity-proof.md` | Proves 2D wall/opening data matches 3D render expectations | Yes |
| `ipad-touch-audit.md` | Proves iPad/coarse-pointer touch safety | Yes |
| `performance-notes.md` | Records build size, load behaviour, and interaction performance | Yes |
| `screenshots/` | Stores route, iPad, parity, and deployment screenshots | Yes |

## Evidence Rules

- Evidence must reference the commit SHA and deployment URL it came from.
- Screenshots or command logs must be current, not copied from older builds.
- Manual evidence cannot be marked complete without a human-readable result and reproduction steps.
- Public production launch remains blocked until every required file is filled.
- Do not mark production ready if any required evidence file is missing or still contains placeholder values.

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
3. Firebase production proof,
4. save/load determinism proof,
5. 2D/3D parity proof,
6. iPad touch audit,
7. performance notes,
8. route screenshots.
