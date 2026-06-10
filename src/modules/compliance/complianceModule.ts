import { aggregateComplianceResults } from '@/services/compliance/complianceAggregator';
import { getAllComplianceRules } from '@/rules/registry';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import type { ComplianceResult } from '@/rules/types';
import type { Project, ProjectManifest } from '@/types';

function runRules(project: Project): ComplianceResult[] {
  return getAllComplianceRules().map((rule) => rule.validate(project));
}

export function runComplianceAudit(project: Project): ComplianceAuditReport {
  const results = runRules(project);
  return aggregateComplianceResults(results, {
    projectId: project.id,
    projectName: project.name,
  });
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
