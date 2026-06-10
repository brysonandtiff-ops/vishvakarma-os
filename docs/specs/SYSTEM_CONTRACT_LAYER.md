# System Contract Layer

**Version:** 1.0.0 · **Status:** Implemented

## Purpose

Single truth contract layer preventing silent drift between Copilot, Optimization, Compliance, and Cost Intelligence.

## Components

| Asset | Path |
|-------|------|
| Contract schemas | `src/core-contract/` |
| System graph | `system-map.json` |
| Regression anchors | `tests/anchors/` |
| Anchor tests | `src/test/regressionAnchors.test.ts` |
| Contract CI | `pnpm run contract:gates` (includes build-gate check) |
| Build gate manifest | `src/core-contract/build-gate.manifest.ts` |
| Runtime flow guard | `src/core-contract/systemFlow.ts` |
| Anchor runner | `src/core-contract/anchorRunner.ts` |
| Forbidden edges | `.rules/forbidden-cost-layout-edges.yml` |

## Canonical system graph

```
INPUT
  ↓
ARCHITECTURE_COPILOT@2.0.0
  ↓
OPTIMIZATION_ENGINE@1.3.0
  ↓
COMPLIANCE_GATE@1.0.0
  ↓
PERMIT_PACKAGE_EXPORT
  ↓
COST_INTELLIGENCE@0.9.0 (read-only evaluation)
COUNCIL_INTELLIGENCE@1.0.0 (approval scoring)
```

## Rules

1. **Contract-first** — modules declare inputs/outputs in `src/core-contract/`
2. **Frozen graph** — only edges in `system-map.json` `allowed_edges` or `explicit_routes`
3. **Runtime guard** — `assertAllowedFlow()` at orchestration boundaries throws `[SYSTEM_DRIFT_BLOCKED]`
4. **Cost read-only** — `COST_INTELLIGENCE` must not import layout solvers
5. **Explicit budget route** — `BUDGET_OPTIMIZATION` in `budgetOptimizer.ts` (experimental)
6. **Version lock** — `SYSTEM_VERSIONS` must match `system-map.json` and anchors
7. **Build gate** — core-touching PRs require valid `build-gate.manifest.ts` with `requiresRevalidation: true`
8. **Drift definition** — behavior change without contract/anchor/version update is drift

## CI enforcement

GitHub `verify.yml` runs:

```bash
pnpm run contract:gates
pnpm run test:anchors
```

`contract:gates` chains: `check-system-contract.mjs` → `check-forbidden-edges.mjs` → `check-build-gate.mjs`

## Module versions

| Module | Version |
|--------|---------|
| ARCHITECTURE_COPILOT | 2.0.0 |
| OPTIMIZATION_ENGINE | 1.3.0 |
| COST_INTELLIGENCE | 0.9.0 |
| COMPLIANCE_GATE | 1.0.0 |
| COUNCIL_INTELLIGENCE | 1.0.0 |

## Verification

```bash
pnpm run contract:gates
pnpm run test:anchors
```
