import { describe, expect, it } from 'vitest';
import { DEFAULT_BUILDING_REQUEST } from '@/domain/buildings/buildingRequest';
import { createCouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import { assessCouncilCompliance } from '@/services/council-intelligence/councilEngine';

function baseBuilding(overrides: Partial<GeneratedBuilding> = {}): GeneratedBuilding {
  const complianceReport: ComplianceAuditReport = {
    overall: 'pass',
    blocked: false,
    categories: [],
    results: [
      {
        ruleId: 'zoning-setback',
        category: 'zoning',
        status: 'pass',
        description: 'Setbacks',
        findings: [],
      },
      {
        ruleId: 'zoning-coverage',
        category: 'zoning',
        status: 'pass',
        description: 'Coverage',
        findings: [],
      },
    ],
  };

  return {
    request: DEFAULT_BUILDING_REQUEST,
    sitePlan: {
      parcelBoundary: [
        { x: 0, y: 0 },
        { x: 490, y: 0 },
        { x: 490, y: 490 },
        { x: 0, y: 490 },
      ],
      buildingFootprint: [
        { x: 80, y: 80 },
        { x: 350, y: 80 },
        { x: 350, y: 350 },
        { x: 80, y: 350 },
      ],
      setbacks: { front: 6, side: 1.5, rear: 3 },
      orientation: 'N',
    },
    floorPlan: { rooms: [], walls: [], openings: [], circulation: [] },
    schedules: { rooms: [], walls: [], windows: [] },
    architectureMap: { nodes: [], edges: [] },
    manifest: {
      name: 'Test',
      walls: [{ id: 'w1', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 20, height: 170 }],
      openings: [],
      materials: [],
      labels: [],
      gridSize: 20,
    },
    costSummary: { total: 400_000, items: [] },
    conceptDesign: {
      styleSummary: 'modern',
      designIntent: 'Test',
      roomProgram: [],
      adjacencyNotes: [],
      massingNotes: 'Single storey',
    },
    materialList: [],
    complianceReport,
    ...overrides,
  };
}

describe('councilEngine', () => {
  it('scores high when setbacks, coverage, and compliance pass', () => {
    const assessment = assessCouncilCompliance(
      baseBuilding(),
      createCouncilRequirements({ maxHeightM: 9 }),
    );
    expect(assessment.approvalScore).toBeGreaterThanOrEqual(80);
    expect(assessment.likelihood).toBe('high');
    expect(assessment.explanation.summary.length).toBeGreaterThan(0);
    expect(assessment.explanation.metrics.approvalScore).toBe(assessment.approvalScore);
  });

  it('deducts for setback failures and heritage overlay', () => {
    const building = baseBuilding({
      complianceReport: {
        overall: 'fail',
        blocked: true,
        categories: [],
        results: [
          {
            ruleId: 'zoning-setback',
            category: 'zoning',
            status: 'fail',
            description: 'Setbacks',
            findings: [{ ruleId: 'zoning-setback', category: 'zoning', status: 'fail', message: 'Violation' }],
          },
          {
            ruleId: 'zoning-coverage',
            category: 'zoning',
            status: 'pass',
            description: 'Coverage',
            findings: [],
          },
        ],
      },
    });

    const assessment = assessCouncilCompliance(
      building,
      createCouncilRequirements({ heritageOverlay: true, specialConditions: ['Tree preservation'] }),
    );
    expect(assessment.approvalScore).toBeLessThan(50);
    expect(assessment.likelihood).toBe('low');
    expect(assessment.blockers.length).toBeGreaterThan(0);
    expect(assessment.warnings.some((w) => w.includes('Heritage'))).toBe(true);
    expect(assessment.recommendedAdjustments.length).toBeGreaterThan(0);
  });

  it('deducts when wall height exceeds council limit', () => {
    const building = baseBuilding({
      manifest: {
        name: 'Tall',
        walls: [{ id: 'w1', start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, thickness: 20, height: 220 }],
        openings: [],
        materials: [],
        labels: [],
        gridSize: 20,
      },
    });

    const assessment = assessCouncilCompliance(
      building,
      createCouncilRequirements({ maxHeightM: 8.5 }),
    );
    expect(assessment.blockers.some((b) => b.includes('height'))).toBe(true);
    expect(assessment.approvalScore).toBeLessThan(90);
  });
});
