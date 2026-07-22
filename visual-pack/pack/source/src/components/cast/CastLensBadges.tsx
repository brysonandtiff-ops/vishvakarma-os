import { activeLensLabels } from '@/cast/CastLensState';
import type { CastLensState } from '@/cast/types';

interface CastLensBadgesProps {
  lenses: CastLensState;
}

export default function CastLensBadges({ lenses }: CastLensBadgesProps) {
  const labels = activeLensLabels(lenses);
  if (labels.length === 0) {
    return (
      <span className="text-[10px] uppercase tracking-wide text-ws-text-dim">No lenses active</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1" data-testid="cast-lens-badges">
      {labels.map((label) => (
        <span
          key={label}
          className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary"
        >
          {label}
        </span>
      ))}
    </div>
  );
}
