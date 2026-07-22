import { COMPLIANCE_CATEGORY_LABELS } from '@/modules/compliance/constants';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import { formatAuditLines } from '@/services/compliance/complianceGate';
import { Badge } from '@/components/ui/badge';

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pass: 'default',
  warning: 'secondary',
  fail: 'destructive',
};

export default function ComplianceReportPanel({ report }: { report: ComplianceAuditReport }) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">Overall</span>
        <Badge variant={STATUS_VARIANT[report.overall] ?? 'secondary'}>{report.overall.toUpperCase()}</Badge>
        {report.blocked && (
          <span className="text-xs text-destructive">Export blocked until failures are resolved</span>
        )}
      </div>

      <ul className="space-y-1 text-muted-foreground">
        {formatAuditLines(report).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>

      <div className="max-h-40 overflow-auto space-y-2 border-t border-border/40 pt-2">
        {report.results
          .filter((r) => r.findings.length > 0)
          .map((result) => (
            <div key={result.ruleId}>
              <p className="font-medium text-foreground">
                {COMPLIANCE_CATEGORY_LABELS[result.category]} — {result.description}
              </p>
              <ul className="ml-2 text-xs text-muted-foreground">
                {result.findings.map((f, i) => (
                  <li key={`${f.ruleId}-${i}`}>
                    [{f.status}] {f.message}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Automated NCC stub checks — not certified for council lodgement.
      </p>
    </div>
  );
}
