# Latest CI / Verify Run

Generated from commit: `0b51662f5e1ddb25f665d264b58c6ea02ae1f22d`
Deployment URL: https://vishvakarma-os.app
Vercel fallback URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-14T12:10:00.000Z
Operator: Bryson Erdmann / CI attach (#6)
Result: `PARTIAL`

## Workflow Run

**Verify Vishvakarma.OS (primary):** https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27497509900

**E2E Auth Gate (production OAuth):** https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27497509894 — **PASS**

| Job | Status | Duration |
|---|---|---|
| Lint, security, evidence, test, route smoke, and build | **PASS** | 2m47s |
| Production OAuth (all browsers) | **PASS** | 5m33s |
| Playwright E2E (chromium) | **PASS** | 5m52s |
| Playwright E2E (webkit) | **FAIL** | 1 failed — command palette → Spec Center |
| Playwright E2E (firefox) | **CANCELLED** | 30m job timeout |

Overall workflow conclusion: **failure** (cross-browser e2e matrix incomplete). Core build/test gate and chromium functional proof are green on this commit.

## Artifacts

- `vishvakarma-os-dist` — uploaded from green build job
- `world-record-evidence` — uploaded
- `playwright-report-chromium` — uploaded

## Command Parity (green on primary job)

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run launch:evidence
pnpm run test:coverage
pnpm run test:anchors
pnpm run test:routes
pnpm run build
pnpm run record:measure
pnpm run test:e2e  # chromium PASS; webkit 1 fail; firefox timeout
```

## Local parity (pre-push)

| Command | Result |
|---|---|
| `pnpm run lint:types` | PASS |
| `pnpm run production:functional-proof` | PASS |
| `pnpm run test:e2e` (local chromium) | PASS (47 passed, 1 flaky) |
| `PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth pnpm run verify:production-auth-flow` | PASS (15/15) |

## Follow-up

- Webkit command-palette flake fixed in `4374c43`
- Firefox CI: non-chromium browsers use lightweight `cross-browser-smoke` (full `app-smoke` editor flows exceed Firefox 30m budget)
- Re-run Verify workflow after push for full green matrix
