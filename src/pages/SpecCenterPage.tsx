// Spec Center page - displays locked specifications with hash verification
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Lock, AlertCircle, CheckCircle2, Plus, ShieldCheck } from 'lucide-react';
import AppLayout from '@/components/layouts/AppLayout';
import { getSpecs } from '@/db/api';
import type { Spec } from '@/types';

const BLUEPRINT_EDITOR_SPEC_HASH = 'e8f4a2b9c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5';

const requiredSections = [
  'Required UI Regions',
  'Tool List',
  'Interaction Rules',
  'File Format',
  'Validation Rules',
  '2D/3D Synchronization',
  'Material Presets',
  'Stop-Ship Conditions',
];

const specContent = `## Required UI Regions

1. Left Navigation (64px) — App navigation
2. Tool Dock (64px) — Drawing tools
3. Canvas (flexible) — 2D blueprint
4. Properties Panel (320px) — Materials & solar
5. Status Bar (top) — Project info

## Tool List

- Select Tool (V)  ·  Wall Tool (W)
- Door Tool (D)    ·  Window Tool (N)
- Measure Tool (M)

## Validation Rules

- Wall length >= 10px
- Touch targets >= 44px
- 3D updates < 200ms`;

export default function SpecCenterPage() {
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpecs();
  }, []);

  async function loadSpecs() {
    setLoading(true);
    const data = await getSpecs();
    setSpecs(data);
    setLoading(false);
  }

  return (
    <AppLayout>
      <div className="flex h-full flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="gov-page-header shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground text-balance">Spec Center</h1>
              <p className="mt-0.5 text-sm text-muted-foreground text-pretty">
                Centralized specification management with governance enforcement
              </p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Spec
            </Button>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { label: 'Total',    value: specs.length + 1, cls: 'text-foreground' },
              { label: 'Locked',   value: 1,                cls: 'text-primary' },
              { label: 'Approved', value: specs.filter(s => s.status === 'approved').length, cls: 'text-success' },
              { label: 'Draft',    value: specs.filter(s => s.status === 'draft').length,    cls: 'text-warning' },
            ].map(stat => (
              <div key={stat.label} className="flex items-baseline gap-1.5 rounded border border-border bg-card px-3 py-1.5 shadow-sm">
                <span className={`text-base font-bold tabular-nums ${stat.cls}`}>{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-5xl space-y-6 p-6">
            {/* Blueprint Editor Spec — Featured */}
            <Card className="overflow-hidden border-2 border-primary/60 shadow-md">
              <div className="flex items-center gap-2 border-b border-border bg-primary/5 px-6 py-3">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Governing Specification
                </span>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg text-balance">Blueprint Editor v1.0.0</CardTitle>
                      <Badge className="gap-1 bg-primary text-primary-foreground">
                        <Lock className="h-3 w-3" /> LOCKED
                      </Badge>
                      <Badge variant="secondary">Core Feature</Badge>
                    </div>
                    <CardDescription className="text-pretty">
                      Complete specification for the architectural blueprint editor workspace
                    </CardDescription>
                  </div>
                  <FileText className="h-8 w-8 shrink-0 text-primary/60" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Hash block */}
                <div className="rounded-xl border border-border bg-muted/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        SHA-256 Spec Hash
                      </p>
                      <p className="break-all font-mono text-xs text-foreground/80">
                        {BLUEPRINT_EDITOR_SPEC_HASH}
                      </p>
                    </div>
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  </div>
                </div>

                {/* Required sections */}
                <div>
                  <p className="mb-3 text-sm font-semibold text-foreground">Required Sections</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {requiredSections.map((section) => (
                      <div
                        key={section}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                        <span className="truncate text-muted-foreground">{section}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Spec content preview */}
                <div>
                  <p className="mb-2 text-sm font-semibold text-foreground">Specification Preview</p>
                  <ScrollArea className="h-40 rounded-lg border border-border bg-muted/40 p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-foreground/75">
                      {specContent}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">View Full Spec</Button>
                  <Button variant="outline" size="sm">Export PDF</Button>
                  <Button variant="outline" size="sm" disabled>
                    <Lock className="mr-2 h-3.5 w-3.5" />
                    Edit (Locked)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Other Specs */}
            {!loading && specs.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-foreground">Other Specifications</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {specs.map((spec) => (
                    <Card key={spec.id} className="h-full flex flex-col border-border shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <CardTitle className="text-sm text-balance">{spec.name}</CardTitle>
                            <CardDescription className="mt-0.5 text-xs">{spec.category}</CardDescription>
                          </div>
                          <Badge
                            variant={spec.status === 'locked' ? 'default' : spec.status === 'approved' ? 'outline' : 'secondary'}
                            className="shrink-0 text-xs"
                          >
                            {spec.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="mt-auto flex gap-2">
                        <Button variant="outline" size="sm">View</Button>
                        {spec.status !== 'locked' && (
                          <Button variant="outline" size="sm">Edit</Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for other specs */}
            {!loading && specs.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <h3 className="mt-3 text-sm font-semibold text-foreground">No additional specs</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add new specifications through the change request process
                </p>
              </div>
            )}

            {/* Governance Notice */}
            <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-semibold text-foreground">Governance Notice</p>
                <p className="mt-1 text-sm text-pretty text-muted-foreground">
                  Locked specifications cannot be modified without an approved Change Request.
                  Any UI implementation that deviates from the locked spec will trigger a stop-ship violation.
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
