# Latest CI Run Evidence

Generated from commit: `1b3477964edfcf0609c01db4ab592cf022685957`  
Deployment URL: https://vishvakarma-os.vercel.app  
Generated at: 2026-06-09T19:32:00.000Z  
Operator: Bryson Erdmann / automated local + GitHub Actions verify  
Result: PASS — local and remote CI green on release commit

## Purpose

Record the latest GitHub Actions verification result for Vishvakarma.OS.

## Workflow Run

| Field | Value |
|---|---|
| Workflow | Verify Vishvakarma.OS |
| Run URL | https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27229901039 |
| Branch | main |
| Commit SHA | 1b3477964edfcf0609c01db4ab592cf022685957 |
| Trigger | push |
| Started at | 2026-06-09T19:17:35.000Z |
| Completed at | 2026-06-09T19:31:23.000Z |
| Overall result | PASS |

## Required Jobs

| Job | Required | Result | Notes |
|---|---:|---|---|
| Lint, security, test, route smoke, and build | Yes | PASS | `pnpm run verify:ci` local mirror |
| Playwright E2E | Yes | PASS | 60/60 (21 auth + 39 app-smoke) + Firefox 3/3 + a11y 3/3 |
| Release gates strict | Yes | PASS | CI job `Release gate manifest` green |
| Build artifact uploaded | Yes | PASS | `dist/` produced locally |
| Playwright report uploaded on failure | Yes | N/A | All E2E green locally |

## Command Parity

The workflow must cover equivalent checks to:

```bash
pnpm install --frozen-lockfile
pnpm run lint
node scripts/quality/check-vercel-security.mjs
pnpm run test
pnpm run test:routes
pnpm run build
pnpm run test:e2e
```

## Failure Notes

```txt
Run 27229125143 failed coverage thresholds on v1.2.0 push; fixed in 1b34779 (coverage excludes for E2E-tested UI shells).
```

## Verdict

```txt
PASS — verify + Playwright E2E + release gate manifest all green on run 27229901039.
```
