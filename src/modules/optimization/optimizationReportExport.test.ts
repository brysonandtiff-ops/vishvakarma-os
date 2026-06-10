import { describe, expect, it } from 'vitest';
import { runOptimizationBatch } from '@/services/optimization/optimizationOrchestrator';
import { buildOptimizationReportPdfBytes } from '@/modules/optimization/optimizationReportExport';

describe('optimizationReportExport', () => {
  it('builds a PDF report with winner and tradeoffs', async () => {
    const batch = await runOptimizationBatch({
      prompt: '3-bedroom home on 400m² block',
      sessionId: 'export-test',
    });

    const bytes = buildOptimizationReportPdfBytes(batch);
    expect(bytes.length).toBeGreaterThan(100);
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('OPTIMIZATION REPORT');
    expect(text).toContain(batch.report.winnerLabel);
    expect(text).toContain('MOAT GAIN');
    expect(text).toContain('WINNER PRIMARY DIMENSIONS');
  }, 60_000);
});
