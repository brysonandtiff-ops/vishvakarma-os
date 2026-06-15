import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildComplianceReportPdfBytes } from '@/modules/compliance/complianceReportExport';
import { buildOptimizationReportPdfBytes } from '@/modules/optimization/optimizationReportExport';
import { runOptimizationBatch } from '@/services/optimization/optimizationOrchestrator';
import type { ComplianceAuditReport } from '@/modules/compliance/types';

const repoRoot = resolve(process.cwd());

function pdfToText(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function readSource(relPath: string): string {
  return readFileSync(resolve(repoRoot, relPath), 'utf8');
}

describe('Gate 18 — decision intelligence disclaimers', () => {
  it('compliance PDF export includes prototype disclaimer', () => {
    const report: ComplianceAuditReport = {
      projectId: 'p1',
      projectName: 'Disclaimer Test',
      overall: 'pass',
      categories: [],
      results: [],
      auditedAt: new Date().toISOString(),
      blocked: false,
      disclaimer: 'decision intelligence prototype',
    };
    const text = pdfToText(buildComplianceReportPdfBytes(report));
    expect(text).toContain('not certified');
  });

  it('optimization (council) PDF export includes prototype disclaimer', async () => {
    const batch = await runOptimizationBatch({
      prompt: '3-bedroom home for gate 18 disclaimer check',
      sessionId: 'gate-18-disclaimer',
    });
    const text = pdfToText(buildOptimizationReportPdfBytes(batch));
    expect(text).toContain('not certified');
  }, 60_000);

  it('cost and council export modules document prototype disclaimers', () => {
    const permitSrc = readSource('src/modules/permit/permitPackageExport.ts');
    const optimizationSrc = readSource('src/modules/optimization/optimizationReportExport.ts');
    expect(permitSrc).toContain('Indicative estimate only');
    expect(optimizationSrc).toContain('not certified');
  });
});
