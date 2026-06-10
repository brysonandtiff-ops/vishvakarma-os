import { Heart, Star, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OptimizationCandidate } from '@/domain/optimization/types';
import { projectThumbnailDataUrl } from '@/utils/projectThumbnail';

export default function CandidateCard({
  candidate,
  isWinner,
  isFavorite,
  isSelected,
  onSelect,
  onFavorite,
  onPromote,
  onCompare,
}: {
  candidate: OptimizationCandidate;
  isWinner?: boolean;
  isFavorite?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  onFavorite: () => void;
  onPromote: () => void;
  onCompare: () => void;
}) {
  const thumb = projectThumbnailDataUrl(candidate.building.manifest);
  const compliance = candidate.building.complianceReport.overall;

  return (
    <div
      className={`rounded-2xl border bg-card transition-all ${
        isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border/60'
      } ${isWinner ? 'shadow-md' : ''}`}
      data-testid={`candidate-card-${candidate.id}`}
    >
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-muted/30">
          {thumb ? (
            <img src={thumb} alt={candidate.label} className="h-full w-full object-contain p-2" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No preview</div>
          )}
          {isWinner && (
            <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              Winner
            </span>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-background/90 px-2 py-0.5 text-xs font-bold">
            #{candidate.rank}
          </span>
        </div>
        <div className="space-y-1 p-4">
          <p className="font-semibold">{candidate.label}</p>
          <p className="text-2xl font-bold text-primary">{candidate.overallScore}</p>
          <p className="text-xs text-muted-foreground">
            ${candidate.building.costSummary.total.toLocaleString()}
            {candidate.building.costSummary.intelligence
              ? ` (${candidate.building.costSummary.intelligence.confidence.score}% conf)`
              : ''}{' '}
            · Compliance {compliance}
          </p>
        </div>
      </button>
      <div className="flex gap-1 border-t border-border/40 p-2">
        <Button size="sm" variant="ghost" className="flex-1 text-xs" onClick={onCompare}>
          Compare
        </Button>
        <Button size="sm" variant="ghost" className="px-2" onClick={onFavorite} aria-label="Favorite">
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
        </Button>
        <Button size="sm" variant="ghost" className="px-2" onClick={onPromote} aria-label="Promote to project">
          <Upload className="h-4 w-4" />
        </Button>
        {isWinner && <Star className="ml-auto h-4 w-4 text-primary" />}
      </div>
    </div>
  );
}
