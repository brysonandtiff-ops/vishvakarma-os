import { resolveJurisdiction } from '@/domain/projects/jurisdiction';
import { aggregateComplianceResults } from '@/services/compliance/complianceAggregator';
import { getCitationForRule, getRulePackDisclaimer } from '@/modules/compliance/rulePacks';
import { getComplianceRulesForJurisdiction } from '@/rules/registry';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import type { ComplianceResult } from '@/rules/types';
import type { Project, ProjectManifest } from '@/types';

function runRules(project: Project): ComplianceResult[] {
  const jurisdiction = resolveJurisdiction(project.manifest);
  return getComplianceRulesForJurisdiction(jurisdiction).map((rule) => rule.validate(project));
}

function attachCitations(results: ComplianceResult[]): ComplianceResult[] {
  return results.map((result) => ({
    ...result,
    findings: result.findings.map((finding) => ({
      ...finding,
      citation: finding.citation ?? getCitationForRule(finding.ruleId),
    })),
  }));
}

export function runComplianceAudit(project: Project): ComplianceAuditReport {
  const jurisdiction = resolveJurisdiction(project.manifest);
  const results = attachCitations(runRules(project));
  const report = aggregateComplianceResults(results, {
    projectId: project.id,
    projectName: project.name,
  });
  return { ...report, disclaimer: getRulePackDisclaimer(jurisdiction) };
}

export function runComplianceAuditFromManifest(
  manifest: ProjectManifest,
  meta?: { id?: string; name?: string }
): ComplianceAuditReport {
  const project: Project = {
    id: meta?.id ?? 'draft',
    name: meta?.name ?? manifest.name,
    description: manifest.description,
    manifest,
    created_at: manifest.metadata.created,
    updated_at: manifest.metadata.modified,
  };
  return runComplianceAudit(project);
}
