// World Record Registry — honest, reproducible record evidence in Governance OS
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Copy, ExternalLink, Loader2, ShieldCheck, Trophy } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { GovernanceBackendBanner } from '@/components/governance/GovernanceBackendBanner';
import {
  WORLD_RECORD_HONESTY_DISCLAIMER,
  buildWorldRecordsFromMeasurement,
  certificateAssetExists,
  fetchLatestMeasurement,
  getWorldRecordStatusLabel,
  isGuinnessVerified,
  type WorldRecordEntry,
} from '@/governance/records/worldRecordRegistry';
import { toast } from 'sonner';

function statusVariant(status: WorldRecordEntry['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'guinness_verified') return 'default';
  if (status === 'self_verified') return 'secondary';
  if (status === 'proposed') return 'outline';
  return 'outline';
}

export default function WorldRecordsPage() {
  const [records, setRecords] = useState<WorldRecordEntry[]>([]);
  const [hasCertificate, setHasCertificate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [measurement, certificateExists] = await Promise.all([
          fetchLatestMeasurement(),
          certificateAssetExists(),
        ]);
        if (!active) return;
        setHasCertificate(certificateExists);
        setRecords(buildWorldRecordsFromMeasurement(measurement, certificateExists));
      } catch {
        if (!active) return;
        setError('Failed to load world record registry');
        setRecords(buildWorldRecordsFromMeasurement(null, false));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  function copyHash(hash?: string) {
    if (!hash) return;
    void navigator.clipboard.writeText(hash);
    toast.success('Evidence hash copied');
  }

  const verifiedCount = records.filter((record) => record.status === 'self_verified' || record.status === 'guinness_verified').length;
  const proposedCount = records.filter((record) => record.status === 'proposed').length;

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        <div className="gov-page-header shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-foreground text-balance">World Record Registry</h1>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                Measurable claims with SHA-256 evidence — honest status labels only
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 gap-1">
              <Trophy className="h-3.5 w-3.5" />
              Governance OS
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded border border-border bg-card px-3 py-1.5 text-xs font-semibold tabular-nums shadow-sm">
              {records.length} record{records.length === 1 ? '' : 's'}
            </span>
            <span className="rounded border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success tabular-nums shadow-sm">
              {verifiedCount} verified
            </span>
            <span className="rounded border border-border bg-card px-3 py-1.5 text-xs font-semibold tabular-nums shadow-sm">
              {proposedCount} proposed
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4 md:p-6">
            <GovernanceBackendBanner />
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-3 text-sm">Loading world record registry…</p>
              </div>
            ) : (
            <>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Honesty policy
                </CardTitle>
                <CardDescription>{WORLD_RECORD_HONESTY_DISCLAIMER}</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Guinness World Records branding appears only when status is Guinness Verified and a certificate asset is
                present at <code className="rounded bg-muted px-1">/records/gwr-certificate.pdf</code>.
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Verified / candidate</p>
                  <p className="text-2xl font-bold">{verifiedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Proposed (not measured)</p>
                  <p className="text-2xl font-bold">{proposedCount}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Reproduce proof</p>
                  <p className="font-mono text-sm">pnpm run record:measure</p>
                </CardContent>
              </Card>
            </div>

            {records.map((record) => (
              <Card key={record.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base text-balance">{record.title}</CardTitle>
                      <CardDescription>{record.scopeNote}</CardDescription>
                    </div>
                    <Badge variant={statusVariant(record.status)}>
                      {getWorldRecordStatusLabel(record.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{record.metricLabel}</p>
                      <p className="mt-1 font-mono text-sm">{record.metricValue}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Reproduce</p>
                      <p className="mt-1 font-mono text-sm">{record.reproduceCommand}</p>
                    </div>
                  </div>

                  {(record.measuredAt || record.commit) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {record.measuredAt && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Measured at</p>
                          <p className="mt-1 font-mono text-xs">{record.measuredAt}</p>
                        </div>
                      )}
                      {record.commit && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Commit</p>
                          <p className="mt-1 truncate font-mono text-xs">{record.commit}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {record.evidenceHash && (
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence SHA-256</p>
                        <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={() => copyHash(record.evidenceHash)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="mt-1 break-all font-mono text-xs">{record.evidenceHash}</p>
                    </div>
                  )}

                  {isGuinnessVerified(record.status, hasCertificate) && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Trophy className="h-4 w-4" />
                      Guinness World Records certificate on file
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Limitations
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {record.limitations.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" asChild>
                      <a href="/world-record/latest-measurement.json" target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Measurement JSON
                      </a>
                    </Button>
                    <p className="self-center text-xs text-muted-foreground">
                      Docs: <code className="rounded bg-muted px-1">docs/world-record/</code>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
            </>
            )}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
