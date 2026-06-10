import { CheckCircle2 } from 'lucide-react';
import type { ComplianceStatus } from '@/rules/types';
import type { SaveState } from '@/types';

function complianceBadge(status: ComplianceStatus) {
  if (status === 'pass') return { label: 'Pass', className: 'border-success/30 bg-success/10 text-success' };
  if (status === 'warning') return { label: 'Warn', className: 'border-warning/30 bg-warning/10 text-warning' };
  return { label: 'Fail', className: 'border-destructive/30 bg-destructive/10 text-destructive' };
}

export default function ProjectProofPanel({
  projectName,
  wallCount,
  openingCount,
  saveState,
  lastDraftAt,
  cloudConnected,
  cloudSaveLabel,
  snapEnabled,
  complianceStatus,
  complianceSummary,
}: {
  projectName: string;
  wallCount: number;
  openingCount: number;
  saveState: SaveState;
  lastDraftAt: string | null;
  cloudConnected: boolean | null;
  cloudSaveLabel?: string;
  snapEnabled: boolean;
  complianceStatus?: ComplianceStatus;
  complianceSummary?: string;
}) {
  const hasGeometry = wallCount > 0 || openingCount > 0;
  const proofRows = [
    {
      label: 'Blueprint structure',
      value: hasGeometry ? `${wallCount} walls · ${openingCount} openings` : 'Awaiting first wall',
      ok: hasGeometry,
    },
    {
      label: 'Save protection',
      value: saveState === 'cloud-saved' ? 'Cloud verified' : lastDraftAt ? 'Local restore point active' : 'Ready to protect edits',
      ok: saveState !== 'unsaved',
    },
    {
      label: 'Snapshot readiness',
      value: hasGeometry ? 'Export package can be generated' : 'Load demo to see proof',
      ok: hasGeometry,
    },
    {
      label: 'Workflow mode',
      value: cloudConnected ? (cloudSaveLabel ?? 'Cloud Save') : 'Local Draft mode',
      ok: true,
    },
    ...(complianceStatus
      ? [
          {
            label: 'Building compliance',
            value: complianceSummary ?? 'Live NCC audit',
            ok: complianceStatus !== 'fail',
            badge: complianceBadge(complianceStatus),
          },
        ]
      : []),
  ];

  return (
    <section className="m-4 overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/10 via-white/70 to-white shadow-sm" data-testid="project-proof-panel">
      <div className="border-b border-primary/20 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Project Proof</p>
            <p className="truncate text-sm font-semibold text-foreground">{projectName}</p>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Visible governance status for demo confidence, save safety, and release handoff.
        </p>
      </div>

      <div className="space-y-2 px-4 py-3">
        {proofRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-white/65 px-3 py-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{row.label}</p>
              <p className="mt-0.5 text-xs text-foreground">{row.value}</p>
            </div>
            <span
              className={`mt-0.5 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
                'badge' in row && row.badge
                  ? row.badge.className
                  : row.ok
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-warning/30 bg-warning/10 text-warning'
              }`}
            >
              {'badge' in row && row.badge ? row.badge.label : row.ok ? 'OK' : 'Next'}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-primary/20 px-4 py-3 text-center">
        <div className="rounded-2xl bg-black/5 p-2">
          <p className="text-lg font-bold text-primary">{snapEnabled ? 'ON' : 'OFF'}</p>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Snap</p>
        </div>
        <div className="rounded-2xl bg-black/5 p-2">
          <p className="text-lg font-bold text-primary">1.0</p>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Spec</p>
        </div>
      </div>
    </section>
  );
}
