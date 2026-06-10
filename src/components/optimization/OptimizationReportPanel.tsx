import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetricPill from '@/components/common/MetricPill';
import type { OptimizationBatch } from '@/domain/optimization/types';
import { downloadOptimizationReportPdf } from '@/modules/optimization/optimizationReportExport';

export default function OptimizationReportPanel({ batch }: { batch: OptimizationBatch }) {
  const { report, siteFitness } = batch;

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 p-4" data-testid="optimization-report">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Optimization Report</h3>
        <Button size="sm" variant="outline" onClick={() => downloadOptimizationReportPdf(batch)}>
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricPill value={String(report.estimatedCost.toLocaleString())} label="Est. Cost" />
        <MetricPill value={`${report.complianceConfidence}%`} label="Compliance" />
        <MetricPill value={String(siteFitness.overall)} label="Site Fitness" />
        <MetricPill value={report.permitReady ? 'Ready' : 'Blocked'} label="Permit" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-primary/5 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Winner</p>
          <p className="font-semibold">{report.winnerLabel}</p>
        </div>
        <div className="rounded-xl bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Runner-up</p>
          <p className="font-semibold">{report.runnerUpLabel}</p>
        </div>
      </div>

      {report.riskAreas.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Risk Areas</p>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
            {report.riskAreas.map((risk) => (
              <li key={risk}>• {risk}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
