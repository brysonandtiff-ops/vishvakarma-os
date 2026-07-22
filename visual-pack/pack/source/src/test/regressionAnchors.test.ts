import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { validateManifest } from '@/core/manifestSchema';
import {
  COMPLIANCE_RULE_IDS,
  SYSTEM_MAP_VERSION,
  SYSTEM_VERSIONS,
  assertSystemVersionsMatchMap,
  clearRecordedSystemFlows,
  loadAnchor,
  type SystemMapContract,
} from '@/core-contract';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import type { MaterialListRow } from '@/domain/copilot/materialList';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';
import { buildCostIntelligence } from '@/services/cost-estimation/costIntelligenceOrchestrator';
import { parseCouncilText } from '@/services/copilot/ingestion/documentParsers';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';
import { runOptimizationBatch } from '@/services/optimization/optimizationOrchestrator';
import type { ProjectManifest } from '@/types';

describe('regression anchors', () => {
  afterEach(() => {
    clearRecordedSystemFlows();
  });

  it('locks system-map.json against SYSTEM_VERSIONS', () => {
    const map = JSON.parse(
      readFileSync(join(process.cwd(), 'system-map.json'), 'utf8'),
    ) as SystemMapContract;
    const anchor = loadAnchor<{ systemMapVersion: string; modules: Record<string, string> }>(
      'system-versions.json',
    );

    expect(map.version).toBe(anchor.systemMapVersion);
    expect(map.version).toBe(SYSTEM_MAP_VERSION);
    assertSystemVersionsMatchMap(map);

    for (const [moduleId, version] of Object.entries(anchor.modules)) {
      expect(SYSTEM_VERSIONS[moduleId as keyof typeof SYSTEM_VERSIONS]).toBe(version);
    }
  });

  it('copilot gold standard — structural output class', async () => {
    const anchor = loadAnchor<{
      input: { prompt: string };
      structuralExpectations: {
        bedroomsMin: number;
        garageRequired: boolean;
        minWallCount: number;
        minScheduleRooms: number;
        minMaterialListRows: number;
        complianceRuleCount: number;
        manifestValid: boolean;
        costTotalMin: number;
      };
    }>('copilot-gold-standard.json');

    const building = await runBuildingDesignerPipeline({ prompt: anchor.input.prompt });
    const exp = anchor.structuralExpectations;

    const bedroomCount = building.floorPlan.rooms.filter(
      (r) => r.type === 'Bedroom' || r.type === 'MasterBedroom',
    ).length;
    expect(bedroomCount).toBeGreaterThanOrEqual(exp.bedroomsMin);
    if (exp.garageRequired) {
      expect(building.floorPlan.rooms.some((r) => r.type === 'Garage')).toBe(true);
    }
    expect(building.floorPlan.walls.length).toBeGreaterThanOrEqual(exp.minWallCount);
    expect(building.schedules.rooms.length).toBeGreaterThanOrEqual(exp.minScheduleRooms);
    expect(building.materialList.length).toBeGreaterThanOrEqual(exp.minMaterialListRows);
    expect([12, 15]).toContain(building.complianceReport.results.length);
    expect(building.costSummary.total).toBeGreaterThanOrEqual(exp.costTotalMin);
    if (exp.manifestValid) {
      expect(validateManifest(building.manifest).valid).toBe(true);
    }
    expect(building.manifest.metadata.systemVersions?.ARCHITECTURE_COPILOT).toBe('2.0.0');
  }, 60_000);

  it('compliance gold standard — rule set and category rollup', async () => {
    const anchor = loadAnchor<{
      ruleIds: string[];
      categoryCount: number;
      overallStatusClasses: string[];
    }>('compliance-gold-standard.json');

    expect([...COMPLIANCE_RULE_IDS].sort()).toEqual([...anchor.ruleIds].sort());

    const building = await runBuildingDesignerPipeline({
      prompt: '4-bedroom modern home on 600m² corner block with double garage',
    });
    const report = runComplianceAuditFromManifest(building.manifest, {
      id: 'anchor',
      name: building.manifest.name,
    });

    expect(report.results.map((r) => r.ruleId).sort()).toEqual([...anchor.ruleIds].sort());
    expect(report.categories.length).toBe(anchor.categoryCount);
    expect(anchor.overallStatusClasses).toContain(report.overall);
  }, 60_000);

  it('cost gold standard — scenario bands and region', () => {
    const anchor = loadAnchor<{
      input: { councilText: string; regionId: string };
      structuralExpectations: {
        breakdownLineCount: number;
        confidenceScoreMin: number;
        riskLevels: string[];
      };
    }>('cost-gold-standard.json');

    const sampleBom: MaterialListRow[] = [
      {
        id: 'm1',
        category: 'structure',
        item: 'Timber wall framing',
        quantity: 120,
        unit: 'lm',
        sku: 'SKU-TIMBER-FRAMING',
      },
      {
        id: 'm2',
        category: 'structure',
        item: 'Concrete slab (100mm)',
        quantity: 85,
        unit: 'm²',
        sku: 'SKU-CONCRETE-SLAB-100',
      },
      {
        id: 'm3',
        category: 'openings',
        item: 'External doors',
        quantity: 3,
        unit: 'ea',
        sku: 'SKU-EXTERNAL-DOOR',
      },
      {
        id: 'm4',
        category: 'openings',
        item: 'Aluminium windows',
        quantity: 8,
        unit: 'ea',
        sku: 'SKU-ALU-WINDOW',
      },
      {
        id: 'm5',
        category: 'finish',
        item: 'Internal plasterboard',
        quantity: 200,
        unit: 'm²',
        sku: 'SKU-PLASTERBOARD',
      },
      {
        id: 'm6',
        category: 'roof',
        item: 'Colorbond roofing',
        quantity: 95,
        unit: 'm²',
        sku: 'SKU-COLORBOND-ROOF',
      },
      {
        id: 'm7',
        category: 'site',
        item: 'Driveway concrete',
        quantity: 18,
        unit: 'm²',
        sku: 'SKU-DRIVEWAY-CONCRETE',
      },
    ];

    const manifest: ProjectManifest = {
      name: 'Anchor Home',
      walls: [],
      openings: [],
      materials: [],
      labels: [],
      gridSize: 20,
    };

    const report = buildCostIntelligence({
      manifest,
      materialList: sampleBom,
      schedules: { rooms: [{ id: 'r1' } as never], walls: [{ id: 'w1' } as never], windows: [] },
      request: DEFAULT_BUILDING_REQUEST,
      council: {
        rawText: anchor.input.councilText,
        setbacks: { front: 6, side: 1.5, rear: 3 },
        maxCoverageRatio: 0.4,
        specialConditions: [],
      },
    });

    const exp = anchor.structuralExpectations;
    expect(report.scenarios.breakdown.length).toBe(exp.breakdownLineCount);
    expect(report.scenarios.bestCase).toBeLessThan(report.scenarios.expected);
    expect(report.scenarios.expected).toBeLessThan(report.scenarios.worstCase);
    expect(report.scenarios.median).toBe(report.scenarios.expected);
    expect(report.confidence.score).toBeGreaterThanOrEqual(exp.confidenceScoreMin);
    expect(exp.riskLevels).toContain(report.risk.level);
    expect(report.regionId).toBe(anchor.input.regionId);
  });

  it('optimization gold standard — batch structure and moat', async () => {
    const anchor = loadAnchor<{
      input: { prompt: string; targetBudget: number; councilText: string };
      structuralExpectations: {
        candidateCount: number;
        ranks: number[];
        scoreCategoriesPerCandidate: number;
        complianceRuleCountPerCandidate: number;
        tradeoffDimensionCount: number;
        moatGainScoreMin: number;
        winnerHasCostIntelligence: boolean;
      };
    }>('optimization-gold-standard.json');

    const batch = await runOptimizationBatch({
      prompt: anchor.input.prompt,
      targetBudget: anchor.input.targetBudget,
      ingestion: {
        mergedPrompt: anchor.input.prompt,
        council: parseCouncilText(anchor.input.councilText),
      },
      sessionId: 'anchor-opt',
    });

    const exp = anchor.structuralExpectations;
    expect(batch.candidates).toHaveLength(exp.candidateCount);
    expect(batch.candidates.map((c) => c.rank).sort()).toEqual(exp.ranks);

    for (const candidate of batch.candidates) {
      expect(candidate.scores.length).toBe(exp.scoreCategoriesPerCandidate);
      expect([12, 15]).toContain(candidate.building.complianceReport.results.length);
    }

    expect(batch.report.tradeoffs.length).toBe(exp.tradeoffDimensionCount);
    expect(batch.report.moatGain.score).toBeGreaterThanOrEqual(exp.moatGainScoreMin);

    const winner = batch.candidates.find((c) => c.id === batch.winnerId);
    if (exp.winnerHasCostIntelligence) {
      expect(winner?.building.costSummary.intelligence).toBeDefined();
    }
  }, 90_000);

  it('council gold standard — approval assessment on batch candidates', async () => {
    const anchor = loadAnchor<{
      input: { prompt: string; targetBudget: number; councilText: string };
      structuralExpectations: {
        candidateCount: number;
        approvalScoreMin: number;
        approvalScoreMax: number;
        likelihoodClasses: string[];
        hasExplanationMetrics: boolean;
        winnerHasCouncilAssessment: boolean;
        minCandidatesWithBlockers: number;
      };
    }>('council-gold-standard.json');

    const batch = await runOptimizationBatch({
      prompt: anchor.input.prompt,
      targetBudget: anchor.input.targetBudget,
      ingestion: {
        mergedPrompt: anchor.input.prompt,
        council: parseCouncilText(anchor.input.councilText),
      },
      sessionId: 'anchor-council',
    });

    const exp = anchor.structuralExpectations;
    expect(batch.candidates).toHaveLength(exp.candidateCount);

    for (const candidate of batch.candidates) {
      const assessment = candidate.building.councilAssessment;
      expect(assessment).toBeDefined();
      expect(assessment!.approvalScore).toBeGreaterThanOrEqual(exp.approvalScoreMin);
      expect(assessment!.approvalScore).toBeLessThanOrEqual(exp.approvalScoreMax);
      expect(exp.likelihoodClasses).toContain(assessment!.likelihood);
      if (exp.hasExplanationMetrics) {
        expect(Object.keys(assessment!.explanation.metrics).length).toBeGreaterThan(0);
      }
    }

    const candidatesWithBlockers = batch.candidates.filter(
      (c) => (c.building.councilAssessment?.blockers.length ?? 0) > 0,
    ).length;
    expect(candidatesWithBlockers).toBeGreaterThanOrEqual(exp.minCandidatesWithBlockers);

    const winner = batch.candidates.find((c) => c.id === batch.winnerId);
    if (exp.winnerHasCouncilAssessment) {
      expect(winner?.building.councilAssessment).toBeDefined();
    }
    expect(batch.report.approvalConfidence).toBe(winner?.building.councilAssessment?.approvalScore);
  }, 90_000);
});
