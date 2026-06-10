import { PX_PER_METER } from '@/domain/constants';
import type { GeneratedBuilding } from '@/domain/buildings/generatedBuilding';
import type { CouncilRequirements } from '@/domain/copilot/councilRequirements';
import type { CouncilAssessment, CouncilLikelihood } from '@/domain/council-intelligence/types';
import { polygonAreaPx } from '@/rules/shared/siteContext';

export interface CouncilAssessmentOptions {
  siteFitnessSetbackUtilization?: number;
}

function likelihoodFromScore(score: number): CouncilLikelihood {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function maxWallHeightM(building: GeneratedBuilding): number {
  if (building.manifest.walls.length === 0) return 0;
  const maxPx = Math.max(...building.manifest.walls.map((w) => w.height));
  return maxPx / PX_PER_METER;
}

function coverageRatio(building: GeneratedBuilding): number | null {
  const { sitePlan } = building;
  const parcelArea = polygonAreaPx(sitePlan.parcelBoundary);
  const buildingArea = polygonAreaPx(sitePlan.buildingFootprint);
  if (parcelArea <= 0) return null;
  return buildingArea / parcelArea;
}

function setbackCompliant(building: GeneratedBuilding): 'pass' | 'warning' | 'fail' {
  const setbackResult = building.complianceReport.results.find((r) => r.ruleId === 'zoning-setback');
  if (!setbackResult) return 'warning';
  if (setbackResult.status === 'fail') return 'fail';
  if (setbackResult.status === 'warning') return 'warning';
  return 'pass';
}

function coverageStatus(building: GeneratedBuilding): 'pass' | 'warning' | 'fail' {
  const coverageResult = building.complianceReport.results.find((r) => r.ruleId === 'zoning-coverage');
  if (!coverageResult) return 'pass';
  if (coverageResult.status === 'fail') return 'fail';
  if (coverageResult.status === 'warning') return 'warning';
  return 'pass';
}

export function assessCouncilCompliance(
  building: GeneratedBuilding,
  council: CouncilRequirements,
  options?: CouncilAssessmentOptions,
): CouncilAssessment {
  let score = 100;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const recommendedAdjustments: string[] = [];
  const metrics: Record<string, number> = {};

  const setback = setbackCompliant(building);
  metrics.setbackStatus = setback === 'pass' ? 1 : setback === 'warning' ? 0.5 : 0;
  if (setback === 'fail') {
    score -= 25;
    blockers.push('Building footprint violates required setbacks.');
    recommendedAdjustments.push(
      `Reduce footprint to meet F${council.setbacks.front}m / S${council.setbacks.side}m / R${council.setbacks.rear}m setbacks.`,
    );
  } else if (setback === 'warning') {
    score -= 10;
    warnings.push('Setback data incomplete — verify site plan before lodgement.');
  }

  const coverage = coverageStatus(building);
  const ratio = coverageRatio(building);
  if (ratio != null) {
    metrics.coverageRatioPercent = Math.round(ratio * 100);
    metrics.maxCoveragePercent = Math.round(council.maxCoverageRatio * 100);
  }
  if (coverage === 'fail') {
    score -= 20;
    blockers.push(
      `Site coverage exceeds ${(council.maxCoverageRatio * 100).toFixed(0)}% zoning limit.`,
    );
    recommendedAdjustments.push('Shrink building footprint or reduce storey count to lower coverage.');
  } else if (coverage === 'warning') {
    score -= 5;
    warnings.push('Site coverage is near the zoning maximum.');
  }

  const maxHeightM = council.maxHeightM ?? 8.5;
  const wallHeightM = maxWallHeightM(building);
  metrics.wallHeightM = Math.round(wallHeightM * 10) / 10;
  metrics.maxHeightM = maxHeightM;
  if (wallHeightM > maxHeightM) {
    const over = wallHeightM - maxHeightM;
    const deduction = Math.min(20, Math.round(over * 8));
    score -= deduction;
    blockers.push(`Wall height ${wallHeightM.toFixed(1)}m exceeds ${maxHeightM}m limit.`);
    recommendedAdjustments.push('Lower wall heights or adjust roof pitch to meet height controls.');
  }

  if (council.heritageOverlay) {
    score -= 15;
    warnings.push('Heritage overlay applies — additional design review likely required.');
    recommendedAdjustments.push('Prepare heritage impact statement and consult council heritage advisor.');
    metrics.heritageOverlay = 1;
  }

  const conditionCount = council.specialConditions.length;
  metrics.specialConditionCount = conditionCount;
  if (conditionCount > 0) {
    const deduction = Math.min(20, conditionCount * 5);
    score -= deduction;
    warnings.push(`${conditionCount} special council condition(s) require explicit response.`);
    recommendedAdjustments.push('Address each special condition in the design statement.');
  }

  if (building.complianceReport.blocked) {
    score -= 30;
    blockers.push('Compliance failures block permit-ready status.');
    metrics.complianceBlocked = 1;
  } else {
    const zoningFindings = building.complianceReport.results
      .filter((r) => r.category === 'zoning')
      .flatMap((r) => r.findings)
      .filter((f) => f.status === 'fail');
    if (zoningFindings.length > 0) {
      score -= Math.min(15, zoningFindings.length * 5);
      warnings.push(`${zoningFindings.length} zoning finding(s) may delay approval.`);
    }
  }

  const setbackUtil = options?.siteFitnessSetbackUtilization;
  if (setbackUtil != null) {
    metrics.setbackUtilization = setbackUtil;
    if (setbackUtil > 90) {
      score -= 5;
      warnings.push('Buildable envelope is heavily utilized — limited flexibility for council requests.');
    }
  }

  const approvalScore = Math.max(0, Math.min(100, Math.round(score)));
  metrics.approvalScore = approvalScore;

  const summary =
    blockers.length > 0
      ? `Council readiness ${approvalScore}/100 — ${blockers.length} blocker(s) require resolution before lodgement.`
      : warnings.length > 0
        ? `Council readiness ${approvalScore}/100 — ${warnings.length} warning(s); likely approvable with minor adjustments.`
        : `Council readiness ${approvalScore}/100 — strong alignment with declared council requirements.`;

  return {
    approvalScore,
    likelihood: likelihoodFromScore(approvalScore),
    blockers,
    warnings,
    recommendedAdjustments,
    explanation: { summary, metrics },
  };
}
