# Construction Cost Intelligence

**Version:** Phase 6 · **Status:** Implemented

## Overview

Phase 6 adds an additive Construction Cost Intelligence layer on top of the existing flat-rate `costEstimate.ts` path. Copilot and Optimization pipelines produce priced BOM estimates with scenario bands, confidence scoring, risk analysis, and cost-specific moat signals.

## Architecture

```
materialList (with SKUs)
  → regionalCostIndex (AU-only v1)
  → materialDatabase + supplierPricingEngine
  → laborCostEngine
  → costIntelligenceOrchestrator
  → costConfidenceScorer + costRiskAnalyzer
  → CostSummary { total, items, intelligence }
```

Fast path (editor live recalc): `calculateProjectCostItems()` when no BOM context.

## AU Regional Index (v1)

| Region ID | Label |
|-----------|-------|
| `au-national` | Default baseline |
| `au-nsw-sydney` | NSW Sydney metro |
| `au-vic-melbourne` | VIC Melbourne metro |
| `au-qld-brisbane` | QLD Brisbane metro |
| `au-*-regional` | State regional tiers |

## Scenario Output

| Scenario | Strategy |
|----------|----------|
| Best case | Best supplier prices + 0.9x labor + 5% contingency |
| Expected | Balanced supplier median + baseline labor + 10% contingency |
| Median | Same as expected (single design) |
| Worst case | Premium supplier + 1.15x labor + volatility contingency |

## Cost Breakdown Categories

Materials, Labor, Openings, Site works, Contingency

## Moat Integration

`MoatGainReport` extended with:
- `compositeScore` — blends decision + cost signals
- `costMoat` — cost confidence, pricing defensibility, $5M–15M / $10M–25M bands

## Key Paths

| Component | Path |
|-----------|------|
| Domain types | `src/domain/cost/types.ts` |
| Catalogs | `src/data/cost/` |
| Engines | `src/services/cost-estimation/` |
| UI | `src/components/optimization/CostIntelligencePanel.tsx` |
| Orchestration | `src/services/floorplan-generation/buildFromLayout.ts` |

## Non-Regression

1. `CostSummary.total` = `scenarios.expected`
2. `costScorer` ranking unchanged
3. `budgetOptimizer` layout-shrink unchanged
4. Editor fast path preserved
