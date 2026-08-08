import { FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MetricPill from '@/components/common/MetricPill';
import type { OptimizationBatch } from '@/domain/optimization/types';
import { downloadOptimizationReportPdf } from '@/modules/optimization/optimizationReportExport';

export default function OptimizationReportPanel({ batch }: { batch: OptimizationBatch }) {
  const { report, siteFitness } = batch;

  return (
    <div className="space-y-4 rounded-2xl border border-vish-navy-700/50 bg-vish-navy-900/40 p-4 shadow-xl backdrop-blur-xl" data-testid="optimization-report">
      <div className="flex items-center justify-between border-b border-vish-navy-700/50 pb-2">
        <h3 className="font-semibold text-white">Optimization Report</h3>
        <Button size="sm" variant="outline" className="border-vish-navy-700/50 bg-vish-navy-900/40 text-slate-300 hover:bg-vish-navy-800 hover:text-white" onClick={() => downloadOptimizationReportPdf(batch)}>
          <FileDown className="mr-2 h-4 w-4 text-vish-gold" />
          Export PDF
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MetricPill value={String(report.estimatedCost.toLocaleString())} label="Est. Cost" />
        <MetricPill value={`${report.complianceConfidence}%`} label="Compliance" />
        <MetricPill value={`${report.approvalConfidence}%`} label="Approval" />
        <MetricPill value={String(siteFitness.overall)} label="Site Fitness" />
        <MetricPill value={report.permitReady ? 'Ready' : 'Blocked'} label="Permit" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-vish-navy-700/50 bg-vish-navy-800/40 p-3 shadow-inner">
          <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">Winner</p>
          <p className="font-semibold text-vish-gold">{report.winnerLabel}</p>
        </div>
        <div className="rounded-xl border border-vish-navy-700/30 bg-vish-navy-950/50 p-3 shadow-inner">
          <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-500">Runner-up</p>
          <p className="font-semibold text-slate-300">{report.runnerUpLabel}</p>
        </div>
      </div>

      {report.riskAreas.length > 0 && (
        <div className="rounded-xl border border-vish-navy-700/30 bg-vish-navy-950/50 p-3 shadow-inner">
          <p className="mb-2 font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Areas</p>
          <ul className="space-y-1 text-sm text-amber-400">
            {report.riskAreas.map((risk) => (
              <li key={risk}>• {risk}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
