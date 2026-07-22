import { COMPLIANCE_CATEGORY_LABELS } from '@/modules/compliance/constants';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import { formatAuditLines } from '@/services/compliance/complianceGate';
import { buildTextPdf } from '@/utils/minimalPdf';

export function buildComplianceReportPdfBytes(report: ComplianceAuditReport): Uint8Array {
  const lines: string[] = [
    `Overall status: ${report.overall.toUpperCase()}`,
    `Audited: ${report.auditedAt}`,
    report.blocked ? 'EXPORT BLOCKED — critical failures present' : 'Export permitted (warnings may apply)',
    '',
    'Category summary:',
    ...formatAuditLines(report),
    '',
    'Finding detail:',
  ];

  for (const result of report.results) {
    if (result.findings.length === 0) continue;
    lines.push(`[${COMPLIANCE_CATEGORY_LABELS[result.category]}] ${result.description}`);
    for (const finding of result.findings) {
      lines.push(`  ${finding.status.toUpperCase()}: ${finding.message}`);
    }
    lines.push('');
  }

  lines.push(
    '',
    'Disclaimer: Automated NCC stub checks — not certified for council lodgement.',
    'Engage a registered building surveyor for formal compliance assessment.',
  );

  return buildTextPdf(`${report.projectName} — Compliance Report`, lines);
}

export function downloadComplianceReportPdf(report: ComplianceAuditReport): void {
  const bytes = buildComplianceReportPdfBytes(report);
  const blob = new Blob([Uint8Array.from(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.projectName.replace(/\s+/g, '-').toLowerCase()}-compliance-report.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
