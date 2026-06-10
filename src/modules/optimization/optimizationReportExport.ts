import type { OptimizationBatch } from '@/domain/optimization/types';
import { toDisplayScoresForCandidate } from '@/services/optimization/displayDimensions';
import { buildTextPdf } from '@/utils/minimalPdf';

export function buildOptimizationReportPdfBytes(batch: OptimizationBatch): Uint8Array {
  const { report, candidates, siteFitness } = batch;
  const winner = candidates.find((c) => c.id === report.winnerId);
  const runnerUp = candidates.find((c) => c.id === report.runnerUpId);
  const winnerDisplay = winner ? toDisplayScoresForCandidate(winner) : [];

  const lines: string[] = [
    'DESIGN OPTIMIZATION REPORT',
    `Generated: ${report.generatedAt}`,
    '',
    '--- MOAT GAIN ---',
    `Decision Score: ${report.moatGain.score}/100`,
    `Composite Score: ${report.moatGain.compositeScore}/100`,
    `Decision Value: ${report.moatGain.valueImpactLabel} (${report.moatGain.valueImpactBand})`,
    `Decision Lift: +${report.moatGain.decisionLift} pts`,
    `Winner Margin: +${report.moatGain.winnerMargin} pts`,
    report.moatGain.summary,
    ...(report.moatGain.costMoat
      ? [
          '',
          '--- COST MOAT ---',
          `Cost Moat Score: ${report.moatGain.costMoat.score}/100`,
          `Cost Value: ${report.moatGain.costMoat.valueImpactLabel}`,
          `Cost Confidence: ${report.moatGain.costMoat.costConfidence}%`,
          `Pricing Defensibility: ${report.moatGain.costMoat.pricingDefensibility}%`,
          report.moatGain.costMoat.summary,
        ]
      : []),
    '',
    ...(winner?.building.costSummary.intelligence
      ? [
          '--- COST INTELLIGENCE (Winner) ---',
          `Expected: $${winner.building.costSummary.intelligence.scenarios.expected.toLocaleString()}`,
          `Best: $${winner.building.costSummary.intelligence.scenarios.bestCase.toLocaleString()}`,
          `Worst: $${winner.building.costSummary.intelligence.scenarios.worstCase.toLocaleString()}`,
          `Confidence: ${winner.building.costSummary.intelligence.confidence.score}/100`,
          `Risk: ${winner.building.costSummary.intelligence.risk.level}`,
          '',
        ]
      : []),
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
    '--- WINNER PRIMARY DIMENSIONS (6) ---',
    ...winnerDisplay.map((s) => `  ${s.label}: ${s.score}/100`),
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
