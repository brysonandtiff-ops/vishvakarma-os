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

  return (
    <div
      className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4"
      data-testid="winner-hero-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recommended Winner
          </p>
          <h3 className="text-xl font-bold">{report.winnerLabel}</h3>
          <p className="text-sm text-muted-foreground">
            Runner-up: {report.runnerUpLabel} · Confidence {confidence}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{winner.overallScore}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Overall Score</p>
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
