# ARCHITECTURE_COPILOT_v2 — Specification

**Status**: approved  
**Version**: 2.0.0  
**Category**: feature  
**Last Updated**: 2026-06-10

## Purpose

Transform Vishvakarma.OS from a CAD editor into an **Autonomous Building Design Platform** via the Architecture Copilot: users upload site inputs, the system generates a complete building package, runs NCC stub compliance, and exports a permit-ready bundle.

## Inputs

| Input | Formats | Required |
|-------|---------|----------|
| Design brief | Text | Recommended |
| Site survey | PDF, PNG, JPG, TXT | Optional |
| Boundary plan | DXF, PDF, PNG, JPG | Optional |
| Council requirements | PDF, TXT, CSV | Optional |

## Pipeline stages

1. `ingesting` — parse uploaded documents
2. `extracting` — merge requirements into `BuildingRequest`
3. `constraints` — room program and zoning footprint
4. `concept` — style summary and adjacency rationale
5. `layout` / `floorplan` — geometry generation
6. `schedules` — room/wall/window schedules + material BOM
7. `compliance` — run 12 NCC/zoning stub rules
8. `complete` — deliverables ready

## Outputs

| Deliverable | Format |
|-------------|--------|
| Concept design | In-app panel |
| Floor plan | Manifest + PDF |
| 3D model | Manifest → Viewport3D |
| Material list | Table + PDF |
| Cost estimate | Summary + PDF |
| Compliance report | Panel + PDF |
| Permit package | ZIP (8 PDFs + manifest.json) |

## Compliance gate

Permit package export is **blocked** when `ComplianceAuditReport.blocked === true` (any `fail` finding).

Warnings do not block export.

## Manifest metadata

Copilot sessions persist under `manifest.metadata.copilot`:

```typescript
interface CopilotManifestMetadata {
  sessionId: string;
  designBrief: string;
  council: CouncilRequirements;
  siteSurvey?: SiteSurveyExtraction;
  boundary?: BoundaryPlanExtraction;
  uploadedDocuments: Array<{ id: string; kind: string; fileName: string }>;
  generatedAt: string;
}
```

## MVP boundaries

- Boundary extraction: DXF reliable; PDF/image best-effort via Gemini with manual review fallback
- Elevations in permit pack: placeholder PDF
- Compliance: automated NCC stubs — **not certified for council lodgement**
- Jurisdiction: Australia (NCC Vol 2 H-class dwelling stubs)

## UI entry points

- Editor menu → **Architecture Copilot**
- New Project dialog → **Start with Architecture Copilot**
- 4-step wizard: Upload → Review → Generate → Deliverables
- Review step → **Compare 5 designs** (navigates to `/optimization` without replacing single-design flow)

## Optimization extension (Phase 3)

Architecture Copilot remains the single-design path. The **Design Optimization Engine** is an additive layer:

- Generates 5 candidates via strategy profiles forked at `applyConstraints` / `solveLayout`
- Scores and ranks candidates with explainable metrics
- Stores `manifest.metadata.optimization` alongside `metadata.copilot`
- Does not change `runBuildingDesignerPipeline()` contract or permit export gate

See [`DESIGN_OPTIMIZATION_ENGINE.md`](DESIGN_OPTIMIZATION_ENGINE.md).

### Optimization manifest metadata

```typescript
interface OptimizationManifestMetadata {
  batchId: string;
  candidateId: string;
  objective: OptimizationObjective;
  overallScore: number;
  rank: number;
  generatedAt: string;
}
```

## Related modules

- `src/services/floorplan-generation/orchestrator.ts`
- `src/services/copilot/ingestion/`
- `src/modules/compliance/complianceModule.ts`
- `src/modules/permit/permitPackageExport.ts`
- `src/components/editor/ai-designer/AIDesignerDialog.tsx`
- `src/services/optimization/optimizationOrchestrator.ts`
- `src/pages/OptimizationPage.tsx`

## Registry

| ID | Type | Name |
|----|------|------|
| `feature-architecture-copilot` | feature | Architecture Copilot |
| `feature-permit-package-export` | feature | Permit Package Export |
| `feature-design-optimization` | feature | Design Optimization Engine |

## Stop-ship conditions

- Pipeline fails to produce valid manifest
- Compliance audit not attached to `GeneratedBuilding`
- Permit package missing required ZIP entries
- Export allowed when compliance status is `fail`
