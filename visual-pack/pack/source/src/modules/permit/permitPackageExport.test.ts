/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';
import { buildPermitPackageZip } from '@/modules/permit/permitPackageExport';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';
import JSZip from 'jszip';

describe('permitPackageExport', () => {
  it('bundles permit package ZIP with required documents', async () => {
    const building = await runBuildingDesignerPipeline({
      prompt: '3-bedroom modern home on 500m² lot',
      ingestion: {
        mergedPrompt: '3-bedroom modern home',
        council: {
          setbacks: { front: 6, side: 1.5, rear: 3 },
          maxCoverageRatio: 0.4,
          specialConditions: [],
        },
      },
    });

    const result = await buildPermitPackageZip(building);
    expect(result.allowed).toBe(true);
    expect(result.blob).toBeTruthy();

    const zip = await JSZip.loadAsync(await result.blob!.arrayBuffer());
    expect(zip.file('01-cover-sheet.pdf')).toBeTruthy();
    expect(zip.file('02-site-plan.pdf')).toBeTruthy();
    expect(zip.file('03-floor-plan.pdf')).toBeTruthy();
    expect(zip.file('08-compliance-report.pdf')).toBeTruthy();
    expect(zip.file('manifest.json')).toBeTruthy();
  });

  it('blocks permit export when compliance fails', async () => {
    const building = await runBuildingDesignerPipeline({
      prompt: '3-bedroom modern home',
    });
    building.complianceReport = {
      ...building.complianceReport,
      overall: 'fail',
      blocked: true,
    };

    const result = await buildPermitPackageZip(building);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });
});
