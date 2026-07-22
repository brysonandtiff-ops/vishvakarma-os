import { footprintInsideParcel, getSitePlanFromManifest } from '@/rules/shared/siteContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const setbackRule: ComplianceRule = {
  id: 'zoning-setback',
  description: 'Building footprint within parcel setbacks',
  category: 'zoning',
  validate(project: Project): ComplianceResult {
    const sitePlan = getSitePlanFromManifest(project.manifest);
    const findings: ComplianceFinding[] = [];

    if (!sitePlan) {
      findings.push({
        ruleId: 'zoning-setback',
        category: 'zoning',
        status: 'warning',
        message: 'No site plan on project — generate via AI Designer for setback checks.',
      });
      return {
        ruleId: 'zoning-setback',
        category: 'zoning',
        status: 'warning',
        description: 'Building footprint within parcel setbacks',
        findings,
      };
    }

    const inside = footprintInsideParcel(sitePlan.buildingFootprint, sitePlan.parcelBoundary);
    if (!inside) {
      findings.push({
        ruleId: 'zoning-setback',
        category: 'zoning',
        status: 'fail',
        message: `Setback violation: building footprint extends beyond parcel boundary (F${sitePlan.setbacks.front}m S${sitePlan.setbacks.side}m).`,
      });
    }

    return {
      ruleId: 'zoning-setback',
      category: 'zoning',
      status: statusFromFindings(findings),
      description: 'Building footprint within parcel setbacks',
      findings,
    };
  },
};
