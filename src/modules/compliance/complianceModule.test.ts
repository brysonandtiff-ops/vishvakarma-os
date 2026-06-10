import { describe, expect, it } from 'vitest';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';
import { setbackRule } from '@/rules/zoning/setbackRule';
import type { Project } from '@/types';

describe('complianceModule', () => {
  it('runs golden audit on AI-generated manifest', async () => {
    const building = await runBuildingDesignerPipeline({
      prompt: '4-bedroom modern home on 600m² corner block with double garage',
    });
    const report = runComplianceAuditFromManifest(building.manifest, {
      id: 'golden',
      name: building.manifest.name,
    });

    expect(report.projectName).toBeTruthy();
    expect(report.categories.length).toBe(5);
    expect(report.results.length).toBe(12);
    expect(['pass', 'warning', 'fail']).toContain(report.overall);
  });

  it('blocks export when setback rule fails', () => {
    const manifest = {
      version: '1.0.0',
      name: 'Setback Fail',
      walls: [],
      openings: [],
      materials: [],
      floorMaterial: 'material-wood',
      lighting: { sunAzimuth: 180, sunElevation: 45, timeOfDay: 12, intensity: 1 },
      gridSize: 20,
      snapToGrid: true,
      metadata: {
        created: '2026-01-01T00:00:00Z',
        modified: '2026-01-01T00:00:00Z',
        aiDesigner: {
          sitePlan: {
            parcelBoundary: [
              { x: 0, y: 0 },
              { x: 80, y: 0 },
              { x: 80, y: 80 },
              { x: 0, y: 80 },
            ],
            buildingFootprint: [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
              { x: 100, y: 40 },
              { x: 0, y: 40 },
            ],
            setbacks: { front: 3, side: 1.5, rear: 3 },
            orientation: 'north',
          },
        },
      },
    };

    const setback = setbackRule.validate({
      id: 'test',
      name: 'Setback Fail',
      manifest,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    } as Project);

    expect(setback.status).toBe('fail');

    const report = runComplianceAuditFromManifest(manifest);
    expect(report.blocked).toBe(true);
    expect(report.overall).toBe('fail');
  });
});
