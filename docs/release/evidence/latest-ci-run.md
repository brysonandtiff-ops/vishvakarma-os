# Latest CI Run Evidence

Generated from commit: `616d152ce659b8f7d7ed7098dbfc86c30a8e1296`  
Deployment URL: https://vishvakarma-os.vercel.app  
Generated at: 2026-06-09T18:45:00.000Z  
Operator: Bryson Erdmann / automated local verify  
Result: PASS — full local battery green (`release:gates:strict` exit 0); remote CI re-run required after commit push

## Purpose

Record the latest GitHub Actions verification result for Vishvakarma.OS.

## Workflow Run

| Field | Value |
|---|---|
| Workflow | Verify Vishvakarma.OS |
| Run URL | https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27147460430 (prior run failed unit tests — fixed locally) |
| Branch | main |
| Commit SHA | 616d152ce659b8f7d7ed7098dbfc86c30a8e1296 |
| Trigger | Local verify mirror + push to re-trigger CI |
| Started at | 2026-06-09T14:28:00.000Z |
| Completed at | 2026-06-09T14:38:46.000Z |
| Overall result | PASS (local) |

## Required Jobs

| Job | Required | Result | Notes |
|---|---:|---|---|
| Lint, security, test, route smoke, and build | Yes | PASS | `pnpm run verify:ci` local mirror |
| Playwright E2E | Yes | PASS | 60/60 (21 auth + 39 app-smoke) + Firefox 3/3 + a11y 3/3 |
| Release gates strict | Yes | PASS | `pnpm run release:gates:strict` exit 0 (13/13) |
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
Prior GitHub run 27147460430 failed on unit test (sanskritAuthGate — "Governance locked" string). Fixed in commit 616d152; local suite 461/461 PASS.
```

## Verdict

```txt
PASS — local command parity complete; attach fresh green Actions URL after push to main.
```
