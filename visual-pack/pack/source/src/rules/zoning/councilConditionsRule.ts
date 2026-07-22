import { getCopilotMetadataFromManifest } from '@/rules/shared/copilotContext';
import type { ComplianceFinding, ComplianceResult, ComplianceRule } from '@/rules/types';
import { statusFromFindings } from '@/rules/types';
import type { Project } from '@/types';

export const councilConditionsRule: ComplianceRule = {
  id: 'zoning-council-conditions',
  description: 'Council special conditions advisory review',
  category: 'zoning',
  validate(project: Project): ComplianceResult {
    const copilot = getCopilotMetadataFromManifest(project.manifest);
    const findings: ComplianceFinding[] = [];

    if (!copilot?.council) {
      return {
        ruleId: 'zoning-council-conditions',
        category: 'zoning',
        status: 'pass',
        description: 'Council special conditions advisory review',
        findings: [],
      };
    }

    for (const condition of copilot.council.specialConditions ?? []) {
      findings.push({
        ruleId: 'zoning-council-conditions',
        category: 'zoning',
        status: 'warning',
        message: `Council condition (manual review): ${condition}`,
      });
    }

    if (copilot.council.heritageOverlay) {
      findings.push({
        ruleId: 'zoning-council-conditions',
        category: 'zoning',
        status: 'warning',
        message: 'Heritage overlay flagged — manual heritage assessment required.',
      });
    }

    return {
      ruleId: 'zoning-council-conditions',
      category: 'zoning',
      status: statusFromFindings(findings),
      description: 'Council special conditions advisory review',
      findings,
    };
  },
};
