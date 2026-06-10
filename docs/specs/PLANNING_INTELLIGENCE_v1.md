# Planning Intelligence v1

**Feature ID:** `feature-planning-intelligence`  
**Status:** active  
**Parent:** Architecture Copilot v2.1

## Overview

Planning Intelligence evolves Architecture Copilot from single-plan generation to multi-candidate planning: generate many layout variants, score them on compliance, adjacency, zoning margin, program fit, cost, and circulation, select the best plan, and explain the decision with structured evidence.

## Pipeline

```
constraints (once)
  → generate N layout candidates (Web Worker when N ≥ 50)
  → fast score all candidates (layout + site plan)
  → full build + compliance audit on top K
  → select winner + structured explanation
  → attach planning metadata to GeneratedBuilding
```

## Modules

| Module | Path | Role |
|--------|------|------|
| Types | `src/planning/types.ts` | `LayoutSolverOptions`, `PlanScore`, `PlanExplanation`, `PlanningMetadata` |
| Candidate generator | `src/planning/candidateGenerator.ts` | N variants via seed, packing strategy, origin offset, rotation |
| Scoring engine | `src/planning/planScoringEngine.ts` | Weighted multi-dimensional scoring |
| Scoring weights | `src/planning/scoringWeights.ts` | Configurable dimension weights |
| Plan selector | `src/planning/planSelector.ts` | Winner selection + explanation bullets |
| Pipeline | `src/planning/planningPipeline.ts` | `runPlanningIntelligencePipeline` |
| Worker | `src/planning/planning.worker.ts` | Batch layout generation off main thread |

## Layout solver options

`layoutSolver.ts` accepts `LayoutSolverOptions`:

- `seed` — placement order perturbation
- `packingStrategy` — `row`, `column`, `clusterPublic`, `clusterPrivate`
- `originOffsetX/Y` — footprint shift within envelope
- `rotationDeg` — `0` or `90` (corner lots)
- `attemptBudget` — local placement attempts per room

## Scoring dimensions

| Dimension | Weight (default) | Notes |
|-----------|------------------|-------|
| Compliance | 0.35 | Hard gate on setback/coverage fail |
| Adjacency | 0.20 | Global sum of realized adjacency rules |
| Zoning margin | 0.15 | Headroom under coverage limit |
| Program fit | 0.10 | NCC minimum room sizes |
| Cost efficiency | 0.10 | Refined after full build on top K |
| Circulation | 0.10 | Hallway connectivity |

## Copilot UX

- Progress: `Evaluating option N of M…`
- Shortlist panel: top 3 site plan thumbnails + scores
- **Why this plan** tab with dimension scores and trade-offs
- User override: select runner-up before opening editor

## Defaults

| Setting | MVP | Target |
|---------|-----|--------|
| `candidateCount` | 20 | 100 |
| `fullBuildTopK` | 10 | 10 |
| `shortlistSize` | 3 | 3 |
| Worker | off in tests | on when count ≥ 50 |

## Persistence

Planning metadata is stored on:

- `GeneratedBuilding.planning`
- `manifest.metadata.copilot.planning`

## Tests

- `src/planning/candidateGenerator.test.ts`
- `src/planning/planScoringEngine.test.ts`
- `src/planning/planningPipeline.test.ts`
- E2E: `e2e/ai-designer.spec.ts` — Why this plan tab + runner-up

## Success criteria

- At least 20 distinct layout candidates per Copilot session
- Multi-dimensional scores with ranked output
- Auto-selected winner with structured explanation
- Selected plan passes compliance gate for permit export
