# Annex 09 — Testing, Quality, and Release

[← Handoff index](./HANDOFF.md)

**Auto-generated inventories:** [Appendix E](./appendices/E-verify-scripts.md), [Appendix F](./appendices/F-test-inventory.md)

## Unit and integration tests (Vitest)

| Item | Detail |
|------|--------|
| Config | [`vitest.config.ts`](../../vitest.config.ts) |
| Setup | [`src/test/setup.ts`](../../src/test/setup.ts) |
| Run | `pnpm test`, `pnpm test:coverage` |
| Route smoke | `pnpm test:routes` — [`src/routes.production.test.tsx`](../../src/routes.production.test.tsx) |
| Regression anchors | `pnpm test:anchors` — [`src/test/regressionAnchors.test.ts`](../../src/test/regressionAnchors.test.ts) |

**~110 test files** under `src/` (see Appendix F).

Coverage thresholds (vitest.config): 50% lines/functions/statements, 40% branches. Pages/components/hooks largely excluded (E2E-covered).

### Coverage areas

| Area | Example tests |
|------|---------------|
| Editor/canvas | `canvasEngine.test.ts`, `editorWorkflow.test.ts`, `parity2d3d.test.ts` |
| Billing | `billingPlans.test.ts`, `billingBanner.test.ts` |
| Auth | `supabaseAuthRestore.test.ts`, `supabaseAuthCallback.test.ts` |
| Governance | `governanceLock.test.ts`, `multiUserGovernance.test.ts` |
| Copilot/optimization | `copilotPipeline.test.ts`, `optimizationOrchestrator.test.ts` |
| Architecture contracts | `core-contract/systemFlow.test.ts` |

## End-to-end tests (Playwright)

| Item | Detail |
|------|--------|
| Config | [`playwright.config.ts`](../../playwright.config.ts) |
| Specs | 19 files in [`e2e/`](../../e2e/) |
| Run | `pnpm run test:e2e`, `test:e2e:auth`, `test:e2e:cross-browser`, `test:e2e:a11y` |

| Project | Coverage |
|---------|----------|
| auth-gate | Unauthenticated redirect, iPad auth layout |
| app-smoke | Editor, governance, projects, optimization, AI designer, collaboration |
| accessibility-audit | axe-core violations |
| screenshot-pack | Marketing/release screenshots |

Runners: [`scripts/run-e2e-gates.mjs`](../../scripts/run-e2e-gates.mjs), [`scripts/run-auth-gate-playwright.mjs`](../../scripts/run-auth-gate-playwright.mjs)

## CI pipeline

[`.github/workflows/verify.yml`](../../.github/workflows/verify.yml):

1. **verify** — lint, Vercel security, auth gates, Supabase schema/login, launch evidence, contract gates, anchors, unit tests, route smoke, build
2. **e2e-production-auth** — production Google OAuth (Chromium/Firefox/WebKit)
3. **e2e** — Playwright matrix
4. **release-gates** — full `pnpm run release:gates`

Also: [`.github/workflows/e2e.yml`](../../.github/workflows/e2e.yml)

PR template: [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md)

## Release gates (13)

[`scripts/verify-all.js`](../../scripts/verify-all.js) — `pnpm run release:gates`

Includes: SPEC.md, REGISTRY.md, routes, sample JSON, vercel security, `.env.example`, unit tests, E2E gates, evidence files, world-record JSON.

Exit code `2` = manual evidence outstanding (not a broken build).

## Quality gate scripts

| Gate | Script |
|------|--------|
| System contract | `scripts/quality/check-system-contract.mjs` |
| Forbidden edges | `scripts/quality/check-forbidden-edges.mjs` |
| Auth config | `scripts/quality/check-auth-config-guard.mjs` |
| Production hardening | `scripts/quality/check-production-hardening.mjs` |
| Launch evidence | `scripts/quality/check-launch-evidence.mjs` |
| Flawless use | `scripts/quality/check-flawless-use-gates.mjs` |

Full list: Appendix E.

## Launch evidence pack

[`docs/release/evidence/`](../release/evidence/) — auth, save/load, 2D/3D parity, iPad touch, security headers, CI runs.

Requirements: [`docs/release/evidence/README.md`](../release/evidence/README.md)

Generate: `pnpm run production:evidence`

## World record bundle

[`docs/world-record/`](../world-record/) — self-verified gate-count evidence.

Measure: `pnpm run record:measure`

## Structural linting

- **ast-grep** — [`.rules/`](../../.rules/), `pnpm run lint:structure`
- **Biome** — [`biome.json`](../../biome.json), `pnpm run lint:deps`

## Editor workflow tests

[`docs/testing/EDITOR_WORKFLOWS.md`](../testing/EDITOR_WORKFLOWS.md)
