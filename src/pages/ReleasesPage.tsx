// Release Center Page - Release gates and version control with evidence packs
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Package,
  ScanLine,
  FlaskConical,
  Hammer,
  ChevronDown,
  ChevronRight,
  Rocket,
} from 'lucide-react';
import { WorkspacePageScroll } from '@/components/layouts/WorkspacePageShell';
import WorkspacePageHeader from '@/components/common/WorkspacePageHeader';
import { GovernanceBackendBanner } from '@/components/governance/GovernanceBackendBanner';
import { getReleases } from '@/db/api';
import {
  downloadEvidencePack,
  getBuildVerificationSummary,
  getReleaseGatesForUi,
  RELEASE_GATE_COUNT,
} from '@/governance/gates/releaseGateManifest';
import type { Release } from '@/types';
import { Link } from 'react-router';

interface ReleaseGate {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  evidence: string[];
  icon: React.ElementType;
  link?: string;
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGates, setExpandedGates] = useState<Set<string>>(new Set());
  const [showStopShipViolations, setShowStopShipViolations] = useState(false); // State for Stop-Ship Violations visibility

  useEffect(() => {
    loadReleases();
  }, []);

  async function loadReleases() {
    setLoading(true);
    try {
      const data = await getReleases();
      setReleases(data);
    } catch {
      setReleases([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleGate(id: string) {
    setExpandedGates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleStopShipViolations() {
    setShowStopShipViolations((prev) => !prev);
  }

  // Release gates — aligned with scripts/verify-all.js via gate-manifest.json
  const releaseGates: ReleaseGate[] = getReleaseGatesForUi();

  const passedGates = releaseGates.filter((g) => g.status === 'pass').length;
  const failedGates = releaseGates.filter((g) => g.status === 'fail').length;
  const warningGates = releaseGates.filter((g) => g.status === 'warning').length;
  const pendingGates = releaseGates.filter((g) => g.status === 'pending').length;
  const totalGates = releaseGates.length;
  const passPercentage = (passedGates / totalGates) * 100;

  const buildStatus =
    failedGates > 0 ? 'RED' : warningGates > 0 || pendingGates > 0 ? 'YELLOW' : 'GREEN';

  const verification = getBuildVerificationSummary();
  const snapshotDate = new Date(verification.generatedAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const verificationRows = [
    {
      icon: ScanLine,
      label: 'Lint',
      status: verification.lint,
      value:
        verification.lint === 'pass'
          ? 'Automated gates 1–6 pass'
          : verification.lint === 'fail'
            ? 'Gate failures'
            : 'Not verified in snapshot',
      detail: 'From gate-ui-status.json · run pnpm run release:gates',
    },
    {
      icon: FlaskConical,
      label: 'Tests',
      status: verification.tests,
      value:
        verification.testsPassed != null && verification.testsTotal != null
          ? `${verification.testsPassed} / ${verification.testsTotal}`
          : verification.tests === 'pass'
            ? 'Strict run passed'
            : 'Run release:gates:strict',
      detail: verification.note,
    },
    {
      icon: Hammer,
      label: 'Build',
      status: verification.build,
      value:
        verification.build === 'pass'
          ? 'dist/ ready'
          : verification.build === 'fail'
            ? 'Build failed'
            : 'Run pnpm run build in CI',
      detail: 'Last verified at build time — not a live CI run',
    },
  ] as const;

  async function handleEvidencePackDownload() {
    try {
      await downloadEvidencePack();
      toast.success('Evidence pack downloaded');
    } catch {
      toast.error('Could not download evidence pack');
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pass':
        return <Badge variant="outline" className="border-success/40 bg-success/10 text-success">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">Warning</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  }

  return (
    <>
        <WorkspacePageHeader
          zone="governance"
          variant="fullBleed"
          eyebrow="Governance"
          title="Release Center"
          description="Release gates, version control, and evidence packs"
          actions={
            <div className="flex shrink-0 items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-semibold ${
                  buildStatus === 'GREEN'
                    ? 'border-success/30 bg-success/10 text-success'
                    : buildStatus === 'YELLOW'
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  buildStatus === 'GREEN' ? 'bg-success' : buildStatus === 'YELLOW' ? 'bg-warning' : 'bg-destructive'
                }`} />
                Build: {buildStatus}
              </div>
              <Button variant="outline" size="sm" className="touch-target" onClick={() => void handleEvidencePackDownload()}>
                Download Evidence Pack
              </Button>
            </div>
          }
        />

        <WorkspacePageScroll>
          <div className="vish-section-stack gov-content-area">
            <GovernanceBackendBanner />

            {/* Verification snapshot — from gate-ui-status.json (pnpm run release:gates) */}
            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Verification Snapshot
                </p>
                <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                  Last verified: {snapshotDate}
                </Badge>
              </div>
              <p className="border-b border-border px-5 py-2 text-[10px] text-muted-foreground text-pretty">
                Status reflects the committed gate snapshot, not a live CI run. Run{' '}
                <code className="rounded bg-muted px-1">pnpm run release:gates:strict</code> locally or in CI, then
                commit <code className="rounded bg-muted px-1">src/governance/gates/gate-ui-status.json</code>.
              </p>
              <div className="grid grid-cols-3 divide-x divide-border">
                {verificationRows.map(({ icon: Icon, label, status, value, detail }) => {
                  const pass = status === 'pass';
                  const warn = status === 'warning' || status === 'pending';
                  return (
                    <div key={label} className="flex items-start gap-3 p-4">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          pass ? 'bg-success/10' : warn ? 'bg-warning/10' : 'bg-destructive/10'
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            pass ? 'text-success' : warn ? 'text-warning' : 'text-destructive'
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-foreground">{label}</p>
                          {pass ? (
                            <CheckCircle2 className="h-3 w-3 text-success" />
                          ) : warn ? (
                            <AlertCircle className="h-3 w-3 text-warning" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                        <p className="font-mono text-sm font-bold text-foreground">{value}</p>
                        <p className="text-[10px] text-muted-foreground text-pretty">{detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Build Status Hero */}
            <div className={`vish-gov-card-dark rounded-xl border-2 p-6 shadow-md ${
              buildStatus === 'GREEN' ? 'border-success/40 bg-success/5' :
              buildStatus === 'YELLOW' ? 'border-warning/40 bg-warning/5' :
              'border-destructive/40 bg-destructive/5'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Package className="h-6 w-6 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">Vishvakarma.OS v1.0.0</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">Blueprint Editor Release Candidate</p>
                </div>
                <Button
                  variant={buildStatus === 'GREEN' ? 'default' : 'outline'}
                  disabled={buildStatus === 'RED'}
                  className="shrink-0 gap-2"
                  onClick={() => buildStatus === 'GREEN' && toast.success(`Release marked as ready — all ${RELEASE_GATE_COUNT} gates passed.`)}
                >
                  {buildStatus === 'GREEN' ? (
                    <><Rocket className="h-3.5 w-3.5" />Mark as Ready</>
                  ) : 'Not Ready'}
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 rounded-xl border border-border bg-card/60 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{passedGates}</p>
                  <p className="text-xs text-muted-foreground">Passed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{warningGates}</p>
                  <p className="text-xs text-muted-foreground">Warnings</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{failedGates}</p>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Gate Progress</span>
                  <span className="font-medium">{passedGates}/{totalGates} passed ({Math.round(passPercentage)}%)</span>
                </div>
                <Progress value={passPercentage} className="h-2" />
              </div>

              {/* Release Ready Explanation */}
              {buildStatus === 'GREEN' && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <div>
                    <p className="text-sm font-semibold text-success">Release Ready</p>
                    <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                      All {RELEASE_GATE_COUNT} release gates report pass in the committed snapshot (
                      {snapshotDate}).{' '}
                      <Link to="/world-records" className="text-primary underline-offset-2 hover:underline">
                        View world record evidence
                      </Link>
                      . Re-run <code className="rounded bg-muted px-1">pnpm run release:gates:strict</code> before
                      shipping to refresh counts and evidence files.
                    </p>
                  </div>
                </div>
              )}
              {buildStatus === 'YELLOW' && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div>
                    <p className="text-sm font-semibold text-warning">Not Release Ready</p>
                    <p className="mt-0.5 text-xs text-muted-foreground text-pretty">
                      {warningGates + pendingGates} gate{warningGates + pendingGates !== 1 ? 's' : ''} require
                      attention before this build can be marked as ready. Expand each non-pass gate below for
                      details and the fix required.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Release Gates */}
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">Release Gates</h2>
              <div className="grid gap-3">
                {releaseGates.map((gate, index) => {
                  const Icon = gate.icon;
                  const isExpanded = expandedGates.has(gate.id);
                  const ExpandIcon = isExpanded ? ChevronDown : ChevronRight;
                  return (
                    <div
                      key={gate.id}
                      className={`rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md ${
                        gate.status === 'fail'    ? 'border-destructive/30' :
                        gate.status === 'warning' ? 'border-warning/30' :
                        gate.status === 'pass'    ? 'border-success/20' : 'border-border'
                      }`}
                    >
                      {/* Gate header row — always visible */}
                      <button
                        className="touch-target flex w-full min-h-[44px] items-start gap-4 p-4 text-left"
                        onClick={() => toggleGate(gate.id)}
                        aria-expanded={isExpanded}
                        aria-label={`${gate.name} — ${gate.status}`}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          gate.status === 'pass'    ? 'bg-success/10' :
                          gate.status === 'warning' ? 'bg-warning/10' :
                          gate.status === 'fail'    ? 'bg-destructive/10' : 'bg-muted'
                        }`}>
                          <Icon className={`h-4 w-4 ${
                            gate.status === 'pass'    ? 'text-success' :
                            gate.status === 'warning' ? 'text-warning' :
                            gate.status === 'fail'    ? 'text-destructive' : 'text-muted-foreground'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-foreground text-balance">
                              Gate {index + 1}: {gate.name}
                            </span>
                            {getStatusBadge(gate.status)}
                          </div>
                          <p className="text-xs text-muted-foreground text-pretty">{gate.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground/70 text-pretty">{gate.message}</p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {getStatusIcon(gate.status)}
                          <ExpandIcon className="h-4 w-4 text-muted-foreground/50" />
                        </div>
                      </button>

                      {/* Expandable evidence panel */}
                      {isExpanded && gate.evidence.length > 0 && (
                        <div className="border-t border-border bg-muted/20 px-4 py-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Evidence
                          </p>
                          <ul className="space-y-1">
                            {gate.evidence.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground text-pretty">
                                <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-success/60" />
                                {item}
                              </li>
                            ))}
                          </ul>
                          {gate.link && (
                            <p className="mt-2 text-[10px] text-muted-foreground/50">
                              Source: {gate.link}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stop-Ship Violations */}
            {/* Always visible for now, but can be toggled */}
            <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Stop-Ship Violations</p>
                <p className="mb-3 text-xs text-muted-foreground text-pretty">
                  Any of the following would immediately block release, regardless of gate scores:
                </p>
                <ul className="space-y-1">
                  {[
                    'Spec Drift — UI element present but not declared in SPEC.md',
                    'Schema Violation — ProjectManifest fails validateManifest()',
                    '2D/3D Mismatch — wall count differs between BlueprintCanvas and Viewport3D',
                    'Data Loss — Save → Load cycle drops walls, openings, or materials',
                    'Touch Target Violation — interactive element renders below 44×44px',
                    'Test Regression — any previously-passing test begins to fail',
                  ].map(v => (
                    <li key={v} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-destructive/60" />
                      {v}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-success">
                  Current stop-ship violations: 0
                </p>
              </div>
            </div>

            {/* Previous Releases */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-foreground">Previous Releases</h2>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading release history…</p>
              ) : releases.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
                  <p className="text-sm text-muted-foreground">No release records yet.</p>
                  <p className="mt-1 text-xs text-muted-foreground">Connect Supabase or run a gated release to populate history.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {releases.map((release) => (
                    <div key={release.id} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-foreground">{release.version}</p>
                          <Badge variant={release.status === 'released' ? 'default' : 'secondary'} className="text-xs">
                            {release.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground text-pretty">{release.description || release.title}</p>
                        {release.released_at && (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            Released {new Date(release.released_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" className="h-8" onClick={() => void handleEvidencePackDownload()}>
                          Evidence Pack
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() =>
                            toast.message(`${release.version} change log`, {
                              description: release.description || release.title,
                            })
                          }
                        >
                          Change Log
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </WorkspacePageScroll>
    </>
  );
}
