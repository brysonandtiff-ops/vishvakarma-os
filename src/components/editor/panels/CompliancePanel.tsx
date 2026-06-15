import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, RefreshCw, XCircle } from 'lucide-react';
import { PrototypeModuleNotice } from '@/components/common/PrototypeDisclaimer';
import { Button } from '@/components/ui/button';
import { complianceCodeLabel, resolveJurisdiction } from '@/domain/projects/jurisdiction';
import { runComplianceAuditFromManifest } from '@/modules/compliance/complianceModule';
import type { ComplianceAuditReport } from '@/modules/compliance/types';
import type { ComplianceCategory, ComplianceStatus } from '@/rules/types';
import type { ProjectManifest } from '@/types';

function StatusIcon({ status }: { status: ComplianceStatus }) {
  if (status === 'pass') return <CheckCircle2 className="gate-pass h-4 w-4 shrink-0" />;
  if (status === 'warning') return <AlertTriangle className="gate-warn h-4 w-4 shrink-0" />;
  return <XCircle className="gate-fail h-4 w-4 shrink-0" />;
}

function statusLabel(status: ComplianceStatus) {
  if (status === 'pass') return 'Compliant';
  if (status === 'warning') return 'Advisory';
  return 'Non-compliant';
}

export function CompliancePanel({
  manifest,
  projectId,
  projectName,
}: {
  manifest: ProjectManifest;
  projectId?: string;
  projectName: string;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [expanded, setExpanded] = useState<ComplianceCategory | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<ComplianceCategory | 'all'>('all');

  const jurisdiction = resolveJurisdiction(manifest);
  const codeLabel = complianceCodeLabel(jurisdiction);

  const report: ComplianceAuditReport = useMemo(
    () =>
      runComplianceAuditFromManifest(manifest, {
        id: projectId,
        name: projectName,
      }),
    [manifest, projectId, projectName, refreshKey]
  );

  const exportAuditJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.replace(/\s+/g, '_')}_compliance_audit.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3 px-4 py-3 text-xs" data-testid="compliance-panel" data-tutorial="compliance-panel">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold uppercase tracking-[0.14em] text-primary">{codeLabel} Building Compliance</p>
        <Button
          variant="ghost"
          size="sm"
          className="touch-target min-h-[44px] gap-1 px-3 text-[10px]"
          onClick={() => setRefreshKey((k) => k + 1)}
          data-testid="compliance-rerun"
        >
          <RefreshCw className="h-3 w-3" /> Re-run
        </Button>
      </div>

      <PrototypeModuleNotice variant="compliance" />

      <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-white/65 px-3 py-2">
        <StatusIcon status={report.overall} />
        <div>
          <p className="font-semibold text-foreground">Overall: {statusLabel(report.overall)}</p>
          <p className="text-muted-foreground">
            {report.blocked ? 'Export blocked until failures are resolved.' : 'Warnings are advisory only.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
            categoryFilter === 'all' ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
          }`}
          onClick={() => setCategoryFilter('all')}
        >
          All
        </button>
        {report.categories.map((cat) => (
          <button
            key={cat.category}
            type="button"
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              categoryFilter === cat.category ? 'bg-primary/15 text-primary' : 'bg-muted/60 text-muted-foreground'
            }`}
            onClick={() => setCategoryFilter(cat.category)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5">
        {report.categories
          .filter((cat) => categoryFilter === 'all' || cat.category === categoryFilter)
          .map((cat) => {
          const catFindings = report.results
            .filter((r) => r.category === cat.category)
            .flatMap((r) => r.findings);
          const isOpen = expanded === cat.category;

          return (
            <li key={cat.category} className="rounded-2xl border border-border/70 bg-white/65">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
                onClick={() => setExpanded(isOpen ? null : cat.category)}
                data-testid={`compliance-category-${cat.category}`}
              >
                <span className="flex items-center gap-2">
                  <StatusIcon status={cat.status} />
                  <span className="font-medium text-foreground">
                    {cat.label} — {statusLabel(cat.status)}
                  </span>
                </span>
                {catFindings.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{catFindings.length} finding(s)</span>
                )}
              </button>
              {isOpen && catFindings.length > 0 && (
                <ul className="space-y-1 border-t border-border/50 px-3 py-2 text-muted-foreground">
                  {catFindings.map((finding, idx) => {
                    const linkedRoom = finding.roomId
                      ? manifest.rooms?.find((r) => r.id === finding.roomId)
                      : undefined;
                    return (
                    <li key={`${finding.ruleId}-${idx}`} className="flex gap-1.5">
                      <StatusIcon status={finding.status} />
                      <span>
                        {linkedRoom ? (
                          <span className="font-medium text-foreground">{linkedRoom.name}: </span>
                        ) : null}
                        {finding.message}
                        {finding.citation ? (
                          <span
                            className="mt-0.5 block text-[10px] text-muted-foreground/90"
                            data-testid={`compliance-citation_${finding.ruleId}`}
                          >
                            <span className="font-semibold text-foreground/80">
                              {finding.citation.code}
                              {finding.citation.clause ? ` · ${finding.citation.clause}` : ''}
                            </span>
                            {' — '}
                            {finding.citation.summary}
                            {finding.citation.sourceUrl ? (
                              <>
                                {' '}
                                <a
                                  href={finding.citation.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary underline-offset-2 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Source
                                </a>
                              </>
                            ) : null}
                          </span>
                        ) : null}
                      </span>
                    </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={exportAuditJson}>
        <Download className="h-3.5 w-3.5" /> Export audit JSON
      </Button>
    </div>
  );
}

export function useComplianceReport(
  manifest: ProjectManifest,
  meta: { projectId?: string; projectName: string },
  refreshKey = 0,
  geometryRevision?: number,
) {
  return useMemo(
    () =>
      runComplianceAuditFromManifest(manifest, {
        id: meta.projectId,
        name: meta.projectName,
      }),
    [manifest, meta.projectId, meta.projectName, refreshKey, geometryRevision],
  );
}
