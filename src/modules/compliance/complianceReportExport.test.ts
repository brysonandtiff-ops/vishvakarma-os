import { describe, expect, it } from 'vitest';
import { buildComplianceReportPdfBytes } from '@/modules/compliance/complianceReportExport';
import { runBuildingDesignerPipeline } from '@/services/floorplan-generation/orchestrator';

describe('complianceReportExport', () => {
  it('builds PDF bytes with category summary and disclaimer', async () => {
    const building = await runBuildingDesignerPipeline({
      prompt: '3-bedroom modern home on 500m² lot',
    });

    const bytes = buildComplianceReportPdfBytes(building.complianceReport);
    const text = new TextDecoder().decode(bytes);

    expect(text.startsWith('%PDF')).toBe(true);
    expect(text).toContain('Compliance Report');
    expect(text).toContain('Disclaimer');
    expect(text).toContain('NCC');
  });
});
