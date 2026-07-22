import { cn } from '@/lib/utils';
import {
  COMPUTE_STATUS_MESSAGES,
  type ComputeStatus,
} from '@/components/system-intelligence/pipelineStageLabels';

export default function ComputeOverlay({
  status,
  candidateLabel,
  className,
}: {
  status: ComputeStatus;
  candidateLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'vish-canvas-overlay-pill flex flex-col items-end gap-0.5 text-xs text-muted-foreground',
        className,
      )}
      data-testid="compute-overlay"
      aria-live="polite"
    >
      <span>{COMPUTE_STATUS_MESSAGES[status]}</span>
      {candidateLabel && <span className="text-[10px] text-earth-400/90">{candidateLabel}</span>}
    </div>
  );
}
