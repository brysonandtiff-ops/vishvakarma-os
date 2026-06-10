# Design Optimization Engine

**Version:** Phase 3 · **Status:** Implemented

## Overview

The Design Optimization Engine transforms Vishvakarma.OS from single-design generation into a multi-candidate optimization and decision system. Users provide block details, budget, and lifestyle goals; the engine generates five strategy-driven candidates, scores them with explainable metrics, ranks them, and recommends the optimal solution.

## Architecture

The optimization layer is **additive** — it does not modify `runBuildingDesignerPipeline()` behavior.

```
OptimizationBatchInput
  → resolveBuildingRequest (shared with copilot)
  → computeSiteFitness
  → for each of 5 StrategyProfiles:
      applyConstraints(strategy) → solveLayout(strategy) → buildGeneratedBuildingFromLayout
      → optional budgetOptimizer
  → scoringEngine (8 categories + overall)
  → rankCandidates → tradeoffAnalyzer → OptimizationReport
```

## Domain Types

Location: `src/domain/optimization/`

| Type | Description |
|------|-------------|
| `OptimizationObjective` | `family_focused`, `budget_optimized`, `energy_optimized`, `premium_lifestyle`, `resale_value` |
| `OptimizationStrategy` | Per-objective layout/constraint configuration |
| `OptimizationCandidate` | Scored design with rank |
| `OptimizationBatch` | Full batch with winner, runner-up, site fitness |
| `OptimizationReport` | Performance dashboard export payload |
| `SiteFitnessScore` | Site-level fitness (solar, slope, setbacks, open space) |

## Strategy Profiles

| ID | Label | Key levers |
|----|-------|------------|
| candidate-a | Family Focused | Living/Dining/Kitchen adjacency, larger bedrooms |
| candidate-b | Budget Optimized | Compact footprint, drop optional extras |
| candidate-c | Energy Optimized | Northern living bias, wet-area stacking |
| candidate-d | Premium Lifestyle | Larger master/ensuite, study/alfresco |
| candidate-e | Maximum Resale Value | Balanced program, garage prominence |

## Scoring Categories (0–100)

Each score includes an `OptimizationExplanation` with `summary` and `metrics`. No black-box scoring.

| Category | Signals |
|----------|---------|
| Compliance | Rule pass=100, warn=75, fail=0 |
| Construction Cost | vs batch median and target budget |
| Natural Light | Glazing ratio, living-zone windows, orientation |
| Energy | Thermal comfort (`analyzeThermal`) |
| Circulation | Hallway %, adjacency weight, cross-ventilation |
| Privacy | Bedroom/public zone separation |
| Resale | Bedroom/bath/garage balance |
| Buildability | Wall count, wet-area stacking |

Weighted overall score uses per-objective weight profiles.

## UI

- Route: `/optimization` (private)
- Components: `src/components/optimization/`
- Copilot integration: "Compare 5 designs" CTA on review step navigates to `/optimization`

### Actions

- **Compare** — side-by-side score breakdown
- **Favorite** — persisted in localStorage
- **Promote to Project** — loads manifest into editor

## Export

`downloadOptimizationReportPdf(batch)` — PDF with winner, runner-up, tradeoffs, risk areas, all candidates.

## Non-Regression Guarantees

1. `runBuildingDesignerPipeline()` unchanged contract
2. Permit export blocked on compliance fail
3. 12 compliance rules per candidate
4. Single-design copilot flow preserved

## Testing

- Unit: scorers, site fitness, tradeoffs, strategy profiles, budget optimizer
- Integration: `optimizationOrchestrator.test.ts` (5 candidates, 12 rules each)
- E2E: `e2e/optimization.spec.ts`
- Regression: `copilotPipeline.test.ts` unchanged

## Manifest Metadata

Optimization metadata stored at `manifest.metadata.optimization`:

```json
{
  "batchId": "uuid",
  "candidateId": "candidate-a",
  "objective": "family_focused",
  "overallScore": 89,
  "rank": 1,
  "generatedAt": "ISO-8601"
}
```
