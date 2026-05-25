# Latest CI Run Evidence

Generated from commit: `<sha>`  
Deployment URL: `<url>`  
Generated at: `<timestamp>`  
Operator: `<name>`  
Result: `PASS / FAIL / PARTIAL`

## Purpose

Record the latest GitHub Actions verification result for Vishvakarma.OS.

## Workflow Run

| Field | Value |
|---|---|
| Workflow | Verify Vishvakarma.OS |
| Run URL |  |
| Branch |  |
| Commit SHA |  |
| Trigger | Pull request / push / workflow_dispatch |
| Started at |  |
| Completed at |  |
| Overall result | PASS / FAIL / PARTIAL |

## Required Jobs

| Job | Required | Result | Notes |
|---|---:|---|---|
| Lint, security, test, route smoke, and build | Yes | Pending |  |
| Playwright E2E | Yes | Pending |  |
| Build artifact uploaded | Yes | Pending |  |
| Playwright report uploaded on failure | Yes | Pending |  |

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
<none / paste failing job summary>
```

## Verdict

```txt
PASS / FAIL / PARTIAL — explain why.
```
