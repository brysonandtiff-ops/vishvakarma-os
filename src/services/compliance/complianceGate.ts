import type { ComplianceAuditReport } from '@/modules/compliance/types';
import type { ComplianceFinding } from '@/rules/types';

export function isExportAllowed(report: ComplianceAuditReport): boolean {
  return !report.blocked;
}

export function formatAuditLines(report: ComplianceAuditReport): string[] {
  return report.categories.map((cat) => {
    const symbol = cat.status === 'pass' ? '✓' : cat.status === 'warning' ? '⚠' : '✗';
    return `${symbol} ${cat.label} ${cat.status === 'pass' ? 'Compliant' : cat.status === 'warning' ? 'Advisory' : 'Non-compliant'}`;
  });
}

export function getFailFindings(report: ComplianceAuditReport): ComplianceFinding[] {
  return report.results.flatMap((r) => r.findings.filter((f) => f.status === 'fail'));
}

export function getWarningFindings(report: ComplianceAuditReport): ComplianceFinding[] {
  return report.results.flatMap((r) => r.findings.filter((f) => f.status === 'warning'));
}
