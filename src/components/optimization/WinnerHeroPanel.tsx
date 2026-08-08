import { FileDown, FolderPlus, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { OptimizationBatch, OptimizationCandidate } from '@/domain/optimization/types';

export default function WinnerHeroPanel({
  batch,
  winner,
  onPromote,
  onSaveProject,
  onExportPermit,
  onExportPdf,
  saving,
}: {
  batch: OptimizationBatch;
  winner: OptimizationCandidate;
  onPromote: () => void;
  onSaveProject: () => void;
  onExportPermit: () => void;
  onExportPdf: () => void;
  saving?: boolean;
}) {
  const { report } = batch;
  const confidence = Math.min(100, report.moatGain.score + report.moatGain.winnerMargin);
  const councilAssessment =
    winner.building.councilAssessment ?? winner.building.copilot?.councilAssessment;

  return (
    <div
      className="space-y-4 rounded-2xl border border-vish-navy-600/50 bg-vish-navy-900/40 p-4 shadow-xl backdrop-blur-xl"
      data-testid="winner-hero-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-technical text-xs font-bold uppercase tracking-widest text-vish-gold/90">
            Recommended Winner
          </p>
          <h3 className="text-xl font-bold text-white">{report.winnerLabel}</h3>
          <p className="text-sm text-slate-400">
            Runner-up: {report.runnerUpLabel} · Confidence {confidence}%
          </p>
        </div>
        <div className="flex gap-4 text-right">
          {councilAssessment && (
            <div data-testid="winner-approval-score">
              <p className="text-3xl font-bold text-white">{councilAssessment.approvalScore}%</p>
              <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Approval Likelihood
              </p>
            </div>
          )}
          <div>
            <p className="text-3xl font-bold text-vish-gold">{winner.overallScore}</p>
            <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">Overall Score</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onPromote} data-testid="winner-promote-btn">
          <Upload className="mr-2 h-4 w-4" />
          Promote to Editor
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={onSaveProject}
          disabled={saving}
          data-testid="winner-save-btn"
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          {saving ? 'Saving…' : 'Save as Project'}
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExportPermit}
                  disabled={!report.permitReady}
                  data-testid="winner-permit-btn"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Export Permit Package
                </Button>
              </span>
            </TooltipTrigger>
            {!report.permitReady && (
              <TooltipContent>
                Permit export blocked due to compliance failures on the winner.
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <Button size="sm" variant="outline" onClick={onExportPdf}>
          <FileDown className="mr-2 h-4 w-4" />
          Export Report PDF
        </Button>
      </div>
    </div>
  );
}
