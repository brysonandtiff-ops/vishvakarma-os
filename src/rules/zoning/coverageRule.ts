import { PX_PER_METER } from '@/domain/constants';
import { polygonAreaPx, getSitePlanFromManifest } from '@/rules/shared/siteContext';
import { getMaxCoverageFromManifest } from '@/rules/shared/copilotContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

function wallFootprintAreaSqM(manifest: Project['manifest']): number {
  let totalPx = 0;
  for (const wall of manifest.walls) {
    const lengthPx = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    totalPx += lengthPx * Math.max(wall.thickness, 10);
  }
  const pxPerSqM = PX_PER_METER * PX_PER_METER;
  return totalPx / pxPerSqM;
}

export const coverageRule: ComplianceRule = {
  id: 'zoning-coverage',
  description: 'Site coverage ratio within zoning limit',
  category: 'zoning',
  validate(project: Project): ComplianceResult {
    const sitePlan = getSitePlanFromManifest(project.manifest);
    const findings: ComplianceFinding[] = [];

    if (!sitePlan) {
      return {
        ruleId: 'zoning-coverage',
        category: 'zoning',
        status: 'pass',
        description: 'Site coverage ratio within zoning limit',
        findings: [],
      };
    }

    const parcelAreaPx = polygonAreaPx(sitePlan.parcelBoundary);
    const buildingAreaPx = polygonAreaPx(sitePlan.buildingFootprint);
    const ratio = parcelAreaPx > 0 ? buildingAreaPx / parcelAreaPx : 0;
    const maxCoverage = getMaxCoverageFromManifest(project.manifest);

    if (ratio > maxCoverage) {
      findings.push({
        ruleId: 'zoning-coverage',
        category: 'zoning',
        status: 'fail',
        message: `Coverage ${(ratio * 100).toFixed(0)}% exceeds maximum ${(maxCoverage * 100).toFixed(0)}%.`,
      });
    } else if (ratio > maxCoverage * 0.9) {
      findings.push({
        ruleId: 'zoning-coverage',
        category: 'zoning',
        status: 'warning',
        message: `Coverage ${(ratio * 100).toFixed(0)}% is near the ${(maxCoverage * 100).toFixed(0)}% limit.`,
      });
    }

    if (wallFootprintAreaSqM(project.manifest) === 0 && buildingAreaPx === 0) {
      findings.push({
        ruleId: 'zoning-coverage',
        category: 'zoning',
        status: 'warning',
        message: 'No building geometry to assess coverage.',
      });
    }

    return {
      ruleId: 'zoning-coverage',
      category: 'zoning',
      status: statusFromFindings(findings),
      description: 'Site coverage ratio within zoning limit',
      findings,
    };
  },
};
