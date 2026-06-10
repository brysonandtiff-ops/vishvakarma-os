import type { OptimizationBatch } from '@/domain/optimization/types';
import { buildTextPdf } from '@/utils/minimalPdf';

export function buildOptimizationReportPdfBytes(batch: OptimizationBatch): Uint8Array {
  const { report, candidates, siteFitness } = batch;
  const winner = candidates.find((c) => c.id === report.winnerId);
  const runnerUp = candidates.find((c) => c.id === report.runnerUpId);

  const lines: string[] = [
    'DESIGN OPTIMIZATION REPORT',
    `Generated: ${report.generatedAt}`,
    '',
    '--- SITE FITNESS ---',
    `Overall Site Fitness: ${siteFitness.overall}/100`,
    `Solar Orientation: ${siteFitness.solarOrientation}/100`,
    `Slope Suitability: ${siteFitness.slopeSuitability}/100`,
    `Setback Utilization: ${siteFitness.setbackUtilization}/100`,
    '',
    '--- WINNER ---',
    `${report.winnerLabel} (Score: ${winner?.overallScore ?? 'N/A'}/100)`,
    `Estimated Cost: $${report.estimatedCost.toLocaleString()}`,
    `Compliance Confidence: ${report.complianceConfidence}%`,
    `Permit Ready: ${report.permitReady ? 'Yes' : 'No'}`,
    '',
    '--- RUNNER-UP ---',
    `${report.runnerUpLabel} (Score: ${runnerUp?.overallScore ?? 'N/A'}/100)`,
    '',
    '--- TRADEOFFS (Winner vs Runner-up) ---',
    ...report.tradeoffs.map((t) => {
      const symbol = t.direction === 'improves' ? '+' : t.direction === 'worsens' ? '-' : '=';
      return `${symbol} ${t.dimension}: ${t.detail}`;
    }),
    '',
    '--- RISK AREAS ---',
    ...(report.riskAreas.length ? report.riskAreas.map((r) => `! ${r}`) : ['None identified']),
    '',
    '--- ALL CANDIDATES ---',
    ...candidates.map(
      (c) =>
        `#${c.rank} ${c.label}: ${c.overallScore}/100 — $${c.building.costSummary.total.toLocaleString()} — Compliance: ${c.building.complianceReport.overall}`,
    ),
    '',
    'Disclaimer: Automated optimization scores — not certified for council lodgement.',
    'Engage a registered architect or building surveyor for formal assessment.',
  ];

  const title = `Optimization Report — ${report.winnerLabel}`;
  return buildTextPdf(title, lines);
}

export function downloadOptimizationReportPdf(batch: OptimizationBatch): void {
  const bytes = buildOptimizationReportPdfBytes(batch);
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `optimization-report-${batch.id.slice(0, 8)}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
