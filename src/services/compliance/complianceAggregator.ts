import { COMPLIANCE_CATEGORY_LABELS } from '@/modules/compliance/constants';
import type { ComplianceAuditReport, ComplianceCategorySummary } from '@/modules/compliance/types';
import type { ComplianceCategory, ComplianceResult, ComplianceStatus } from '@/rules/types';
import { worstStatus } from '@/rules/types';

const CATEGORY_ORDER: ComplianceCategory[] = [
  'ncc',
  'accessibility',
  'energy',
  'zoning',
  'fire',
];

function statusToIcon(status: ComplianceStatus): ComplianceCategorySummary['icon'] {
  if (status === 'pass') return 'check';
  if (status === 'warning') return 'warn';
  return 'x';
}

function rollupCategory(results: ComplianceResult[], category: ComplianceCategory): ComplianceStatus {
  const relevant = results.filter((r) => r.category === category);
  if (relevant.length === 0) return 'pass';
  return relevant.reduce((acc, r) => worstStatus(acc, r.status), 'pass' as ComplianceStatus);
}

export function aggregateComplianceResults(
  results: ComplianceResult[],
  meta: { projectId: string; projectName: string }
): ComplianceAuditReport {
  const categories: ComplianceCategorySummary[] = CATEGORY_ORDER.map((category) => {
    const status = rollupCategory(results, category);
    return {
      category,
      label: COMPLIANCE_CATEGORY_LABELS[category],
      status,
      icon: statusToIcon(status),
    };
  });

  const overall = categories.reduce(
    (acc, c) => worstStatus(acc, c.status),
    'pass' as ComplianceStatus
  );

  return {
    projectId: meta.projectId,
    projectName: meta.projectName,
    overall,
    categories,
    results,
    auditedAt: new Date().toISOString(),
    blocked: overall === 'fail',
  };
}
