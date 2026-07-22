import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { ScorerResult } from '@/services/optimization/scoring/scorerTypes';

function statusToScore(status: string): number {
  if (status === 'pass') return 100;
  if (status === 'warning') return 75;
  return 0;
}

export function scoreCompliance(building: GeneratedBuilding): ScorerResult {
  const report = building.complianceReport;
  const ruleScores = report.results.map((r) => statusToScore(r.status));
  const avg = ruleScores.length
    ? Math.round(ruleScores.reduce((s, v) => s + v, 0) / ruleScores.length)
    : 0;
  const failCount = report.results.filter((r) => r.status === 'fail').length;
  const warnCount = report.results.filter((r) => r.status === 'warning').length;

  return {
    score: avg,
    explanation: {
      summary:
        failCount > 0
          ? `${failCount} compliance rule(s) failed — export blocked until resolved.`
          : warnCount > 0
            ? `All critical rules pass with ${warnCount} advisory warning(s).`
            : 'All 12 compliance rules pass without warnings.',
      metrics: {
        passCount: report.results.filter((r) => r.status === 'pass').length,
        warnCount,
        failCount,
        blocked: report.blocked ? 1 : 0,
      },
    },
  };
}
