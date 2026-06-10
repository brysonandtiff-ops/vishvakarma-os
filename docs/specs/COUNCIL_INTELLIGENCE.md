# Council Intelligence

**Version:** 1.0.0 · **Module:** `COUNCIL_INTELLIGENCE` · **Status:** Implemented

## Purpose

Scores council approval likelihood from measurable pipeline signals — setbacks, coverage, height, heritage overlay, special conditions, and compliance findings — without duplicating compliance rule logic.

## Inputs

| Signal | Source |
|--------|--------|
| Setback compliance | `ComplianceAuditReport` zoning-setback rule |
| Coverage ratio | `SitePlan` footprint vs parcel + `CouncilRequirements.maxCoverageRatio` |
| Height | Max wall height from manifest vs `CouncilRequirements.maxHeightM` |
| Heritage overlay | `CouncilRequirements.heritageOverlay` (−15) |
| Special conditions | Count from `CouncilRequirements.specialConditions` |
| Compliance blockers | `ComplianceAuditReport.blocked` + zoning findings |
| Setback utilization | Batch `siteFitness.setbackUtilization` when available |

## Scoring

- Start at **100**, apply explainable deductions (same pattern as optimization scorers).
- **Likelihood bands:** high ≥ 80, medium 50–79, low < 50.
- Output: `CouncilAssessment` with `approvalScore`, `likelihood`, `blockers`, `warnings`, `recommendedAdjustments`, `explanation.metrics`.

## Pipeline

1. `buildFromLayout.ts` runs compliance audit, then `assessCouncilCompliance()` when `council` is present.
2. Result attached to `GeneratedBuilding.councilAssessment` and `manifest.metadata.copilot.councilAssessment`.
3. Optimization report exposes `approvalConfidence`; moat gain blends council approval into `permitConfidence`.

## System graph edges

```
ARCHITECTURE_COPILOT → COUNCIL_INTELLIGENCE
OPTIMIZATION_ENGINE → COUNCIL_INTELLIGENCE
COUNCIL_INTELLIGENCE → OPTIMIZATION_ENGINE
```

## UI

- **CandidateCard** — Approval % pill by likelihood
- **WinnerHeroPanel** — headline approval metric
- **OptimizationReportPanel** — approval confidence pill
- PDF export includes approval score and recommended adjustments

## Non-regression

- Does not change `runBuildingDesignerPipeline()` signature
- Does not replace compliance pass/fail — approval is semantic council readiness
- Permit export still gated on `complianceReport.blocked === true`

## Verification

```bash
pnpm exec vitest run src/services/council-intelligence/councilEngine.test.ts
pnpm run test:anchors
```
