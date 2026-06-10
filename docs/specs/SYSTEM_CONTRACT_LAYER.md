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
| Contract CI | `pnpm run contract:gates` |
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
```

## Rules

1. **Contract-first** — modules declare inputs/outputs in `src/core-contract/`
2. **Frozen graph** — only edges in `system-map.json` `allowed_edges` or `explicit_routes`
3. **Cost read-only** — `COST_INTELLIGENCE` must not import layout solvers
4. **Explicit budget route** — `BUDGET_OPTIMIZATION` in `budgetOptimizer.ts` (experimental)
5. **Version lock** — `SYSTEM_VERSIONS` must match `system-map.json` and anchors
6. **Drift definition** — behavior change without contract/anchor/version update is drift

## Module versions

| Module | Version |
|--------|---------|
| ARCHITECTURE_COPILOT | 2.0.0 |
| OPTIMIZATION_ENGINE | 1.3.0 |
| COST_INTELLIGENCE | 0.9.0 |
| COMPLIANCE_GATE | 1.0.0 |

## Verification

```bash
pnpm run contract:gates
pnpm run test:anchors
```
