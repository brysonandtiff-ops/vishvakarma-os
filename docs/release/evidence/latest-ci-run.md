# Latest CI / Verify Run

Generated from commit: `cdfb49efcec0d7e6cebbd4f95703de66a7130a17`
Deployment URL: https://vishvakarma-os.app
Vercel fallback URL: https://vishvakarma-os.vercel.app
Generated at: 2026-06-14T13:05:00.000Z
Operator: Bryson Erdmann / CI attach (#6)
Result: `PASS`

## Workflow Run

**Verify Vishvakarma.OS (full matrix):** https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27499449564 — **PASS**

**E2E Auth Gate (production OAuth):** https://github.com/brysonandtiff-ops/vishvakarma-os/actions/runs/27499449583 — **PASS**

| Job | Status | Notes |
|---|---|---|
| Lint, security, evidence, test, route smoke, and build | **PASS** | Primary verify gate |
| Production OAuth (all browsers) | **PASS** | Live `.app` auth flow |
| Playwright E2E (chromium) | **PASS** | Full `app-smoke` suite |
| Playwright E2E (firefox) | **PASS** | `cross-browser-smoke` (3 tests) |
| Playwright E2E (webkit) | **PASS** | `cross-browser-smoke` (3 tests) |
| Release gate manifest | **PASS** | `pnpm run release:gates` |

Overall workflow conclusion: **success** — full CI matrix green on `cdfb49e`.

## Artifacts

- `vishvakarma-os-dist` — production build
- `world-record-evidence` — gate measurement
- `playwright-report-chromium` — full app-smoke report
- `playwright-report-firefox` — cross-browser smoke report
- `playwright-report-webkit` — cross-browser smoke report

## Command Parity

```bash
pnpm install --frozen-lockfile
pnpm run lint
pnpm run launch:evidence
pnpm run test:coverage
pnpm run test:anchors
pnpm run test:routes
pnpm run build
pnpm run record:measure
pnpm run test:e2e          # chromium: full app-smoke; firefox/webkit: cross-browser-smoke
pnpm run release:gates
```

## Cross-browser CI strategy (cdfb49e)

| Browser | Suite | Rationale |
|---|---|---|
| Chromium | Full `app-smoke` (~48 tests) | Primary functional proof |
| Firefox | `cross-browser-smoke` (3 tests) | Full editor flows exceed 30m job budget on Firefox |
| WebKit | `cross-browser-smoke` (3 tests) | Lightweight parity proof; auth-gate still full on WebKit |

## Local parity

| Command | Result |
|---|---|
| `pnpm run production:functional-proof` | PASS (#7) |
| `PRODUCTION_AUTH_URL=https://vishvakarma-os.app/auth pnpm run verify:production-auth-flow` | PASS (15/15) |
