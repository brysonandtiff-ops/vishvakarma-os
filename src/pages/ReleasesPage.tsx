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
  Shield,
  FileCheck,
  Database,
  Zap,
  Eye,
  TestTube,
  Target,
  Lock,
  TrendingUp,
} from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { getReleases } from '@/db/api';
import type { Release } from '@/types';

interface ReleaseGate {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  message: string;
  icon: React.ElementType;
  link?: string;
}

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReleases();
  }, []);

  async function loadReleases() {
    setLoading(true);
    const data = await getReleases();
    setReleases(data);
    setLoading(false);
  }

  // Release gates for Blueprint Editor v1.0.0
  const releaseGates: ReleaseGate[] = [
    {
      id: 'gate-1',
      name: 'Spec Present and Valid',
      description: 'Blueprint Editor specification exists, complete, and locked',
      status: 'pass',
      message: 'SPEC.md validated with all required sections',
      icon: FileCheck,
      link: '/docs/SPEC.md',
    },
    {
      id: 'gate-2',
      name: 'Registry Valid',
      description: 'All entities registered with complete schemas',
      status: 'pass',
      message: '8 core entities documented with schemas',
      icon: Database,
      link: '/docs/REGISTRY.md',
    },
    {
      id: 'gate-3',
      name: 'Routes Match Manifest',
      description: 'All routes declared in route_manifest table',
      status: 'pass',
      message: '6 routes registered, 100% coverage',
      icon: Shield,
    },
    {
      id: 'gate-4',
      name: 'Sample Loads Successfully',
      description: 'Sample project validates and loads without errors',
      status: 'pass',
      message: 'sample-house-01.json validates successfully',
      icon: Package,
      link: '/public/samples/sample-house-01.json',
    },
    {
      id: 'gate-5',
      name: 'Save/Load Deterministic',
      description: 'Save → Load reproduces identical state',
      status: 'warning',
      message: 'Manual testing required',
      icon: Zap,
    },
    {
      id: 'gate-6',
      name: '2D/3D Parity',
      description: 'Same manifest produces identical 2D and 3D representations',
      status: 'warning',
      message: 'Manual verification required',
      icon: Eye,
    },
    {
      id: 'gate-7',
      name: 'Tests Green',
      description: 'All automated tests pass',
      status: 'warning',
      message: 'No automated tests configured yet',
      icon: TestTube,
    },
    {
      id: 'gate-8',
      name: 'Touch Targets Valid',
      description: 'All interactive elements meet iPad touch target size (44px)',
      status: 'pass',
      message: 'Tool buttons 48px, controls 44px minimum',
      icon: Target,
    },
    {
      id: 'gate-9',
      name: 'No Spec Drift',
      description: 'All UI elements declared in spec',
      status: 'pass',
      message: 'All UI elements registered in specValidation.ts',
      icon: Lock,
    },
    {
      id: 'gate-10',
      name: 'Performance Acceptable',
      description: 'Editor performs well on target hardware (iPad Air 2020)',
      status: 'warning',
      message: 'Manual performance testing required',
      icon: TrendingUp,
    },
  ];

  const passedGates = releaseGates.filter((g) => g.status === 'pass').length;
  const failedGates = releaseGates.filter((g) => g.status === 'fail').length;
  const warningGates = releaseGates.filter((g) => g.status === 'warning').length;
  const totalGates = releaseGates.length;
  const passPercentage = (passedGates / totalGates) * 100;

  const buildStatus = failedGates > 0 ? 'RED' : warningGates > 0 ? 'YELLOW' : 'GREEN';

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-600">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-amber-500 text-white">Warning</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  }

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-card px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-foreground text-balance">Release Center</h1>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                Release gates, version control, and evidence packs
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  buildStatus === 'GREEN'
                    ? 'border-success/30 bg-success/10 text-success'
                    : buildStatus === 'YELLOW'
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${
                  buildStatus === 'GREEN' ? 'bg-success' : buildStatus === 'YELLOW' ? 'bg-warning' : 'bg-destructive'
                }`} />
                Build: {buildStatus}
              </div>
              <Button variant="outline" size="sm" className="touch-target">
                Generate Evidence Pack
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-5xl space-y-6 p-6">
            {/* Build Status Hero */}
            <div className={`rounded-xl border-2 p-6 shadow-md ${
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
                  className="shrink-0"
                >
                  {buildStatus === 'GREEN' ? 'Mark as Ready' : 'Not Ready'}
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
            </div>

            {/* Release Gates */}
            <div>
              <h2 className="mb-4 text-base font-semibold text-foreground">Release Gates</h2>
              <div className="grid gap-3">
                {releaseGates.map((gate, index) => {
                  const Icon = gate.icon;
                  return (
                    <div
                      key={gate.id}
                      className={`flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md ${
                        gate.status === 'fail' ? 'border-destructive/30' :
                        gate.status === 'warning' ? 'border-warning/30' :
                        gate.status === 'pass' ? 'border-success/20' : 'border-border'
                      }`}
                    >
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        gate.status === 'pass' ? 'bg-success/10' :
                        gate.status === 'warning' ? 'bg-warning/10' :
                        gate.status === 'fail' ? 'bg-destructive/10' : 'bg-muted'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          gate.status === 'pass' ? 'text-success' :
                          gate.status === 'warning' ? 'text-warning' :
                          gate.status === 'fail' ? 'text-destructive' : 'text-muted-foreground'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-foreground text-balance">
                            Gate {index + 1}: {gate.name}
                          </span>
                          {getStatusBadge(gate.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5 text-pretty">{gate.description}</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground/70">{gate.message}</p>
                          {gate.link && (
                            <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs">
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {getStatusIcon(gate.status)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stop-Ship Violations */}
            <div className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Stop-Ship Violations</p>
                <ul className="space-y-1">
                  {[
                    'Spec Drift: UI element not in spec',
                    'Schema Violation: Manifest fails validation',
                    '2D/3D Mismatch: Rendering not deterministic',
                    'Data Loss: Save/load loses data',
                    'Touch Target Violation: Element < 44px',
                    'Performance Failure: Update > 500ms',
                  ].map(v => (
                    <li key={v} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-destructive/60" />
                      {v}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-destructive">
                  Current violations: {failedGates}
                </p>
              </div>
            </div>

            {/* Previous Releases */}
            {releases.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Previous Releases</h2>
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
                        <p className="text-xs text-muted-foreground text-pretty">{release.description}</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="sm" className="h-8">Evidence Pack</Button>
                        <Button variant="outline" size="sm" className="h-8">Change Log</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
