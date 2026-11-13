# Annex 09 — Testing, Quality, and Release

[← Handoff index](./HANDOFF.md)

**Auto-generated inventories:** [Appendix E](./appendices/E-verify-scripts.md), [Appendix F](./appendices/F-test-inventory.md)

## Unit and integration tests (Vitest)

| Item | Detail |
|------|--------|
| Config | [`vitest.config.ts`](../../vitest.config.ts) |
| Setup | [`src/test/setup.ts`](../../src/test/setup.ts) |
| Run | `pnpm run test`, `pnpm run test:coverage` |
| Route smoke | `pnpm test:routes` — [`src/routes.production.test.tsx`](../../src/routes.production.test.tsx) |
| Regression anchors | `pnpm test:anchors` — [`src/test/regressionAnchors.test.ts`](../../src/test/regressionAnchors.test.ts) |

Use Appendix F for the generated test inventory; file counts are not evidence of a passing run.

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
| Specs | [`e2e/`](../../e2e/); current inventory in Appendix F |
| Run | `pnpm run test:e2e`, `test:e2e:auth`, `test:e2e:cross-browser`, `test:e2e:a11y` |

| Project | Coverage |
|---------|----------|
| auth-gate | Unauthenticated redirect, iPad auth layout |
| app-smoke | Editor, governance, projects, optimization, AI designer, collaboration |
| accessibility-audit | axe-core violations |
| screenshot-pack | Marketing/release screenshots |

Runners: [`scripts/run-e2e-gates.mjs`](../../scripts/run-e2e-gates.mjs), [`scripts/run-auth-gate-playwright.mjs`](../../scripts/run-auth-gate-playwright.mjs)

## CI pipeline

[`.github/workflows/production-certification.yml`](../../.github/workflows/production-certification.yml) defines two jobs:

1. **Supabase Auth platform hardening** — exact checkout, locked install, mandatory management credential, and hosted hardening checks. This job can change provider configuration; run it only within the authorized recovery/release scope.
2. **Cross-browser and strict release certification** — exact checkout, Chromium/Firefox/WebKit E2E, accessibility and performance browser audits, production-auth route checks, strict release gates and strict launch-evidence checks.

Cloudflare Pages builds run [`scripts/cloudflare-build.mjs`](../../scripts/cloudflare-build.mjs): tracked-secret guard, hosting-authority guard, Cloudflare configuration, typecheck, focused regression tests, production build, artifact security and performance budgets. A passing build does not prove live authentication, physical devices or independent release approval.

PR template: [`.github/PULL_REQUEST_TEMPLATE.md`](../../.github/PULL_REQUEST_TEMPLATE.md)

## Release gates

[`scripts/verify-all.js`](../../scripts/verify-all.js) — `pnpm run release:gates`

Includes the original 13 gates plus gates 14–18: SPEC.md, REGISTRY.md, routes, sample JSON, Cloudflare headers, `.env.example`, unit tests, E2E gates, evidence files, world-record JSON and extended model/compliance checks.

Use `pnpm run release:gates:strict` for release review. Gate 9 requires genuine signed-in browser save/reload/export/import evidence at the current exact SHA; API-only receipts do not qualify. Gate 11 does not accept PARTIAL device evidence as PASS. [`certify-cloudflare-release.mjs`](../../scripts/deployment/certify-cloudflare-release.mjs) also checks live incident #153 status before expensive checks and requires an explicit Cloudflare origin.

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
