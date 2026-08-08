import { Heart, Star, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OptimizationCandidate } from '@/domain/optimization/types';
import type { CouncilLikelihood } from '@/domain/council-intelligence/types';
import { projectThumbnailDataUrl } from '@/utils/projectThumbnail';

const APPROVAL_VARIANT: Record<CouncilLikelihood, 'default' | 'secondary' | 'destructive'> = {
  high: 'default',
  medium: 'secondary',
  low: 'destructive',
};

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
  const councilAssessment =
    candidate.building.councilAssessment ?? candidate.building.copilot?.councilAssessment;

  return (
    <div
      className={`rounded-2xl border bg-vish-navy-900/40 backdrop-blur-xl transition-all shadow-xl hover:shadow-2xl hover:border-vish-gold/30 hover:-translate-y-0.5 ${
        isSelected ? 'border-vish-gold ring-2 ring-vish-gold/30' : 'border-vish-navy-700/50'
      } ${isWinner ? 'shadow-vish-gold/20' : ''}`}
      data-testid={`candidate-card-${candidate.id}`}
    >
      <button type="button" className="w-full text-left" onClick={onSelect}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-vish-navy-950/50">
          {thumb ? (
            <img src={thumb} alt={candidate.label} className="h-full w-full object-contain p-2 opacity-80" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">No preview</div>
          )}
          {isWinner && (
            <span className="absolute left-2 top-2 rounded-full bg-vish-gold px-2 py-0.5 font-technical text-[10px] font-bold uppercase tracking-widest text-vish-navy-950 shadow-md">
              Winner
            </span>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-vish-navy-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-vish-gold border border-vish-gold/20">
            #{candidate.rank}
          </span>
          {councilAssessment && (
            <Badge
              variant={APPROVAL_VARIANT[councilAssessment.likelihood]}
              className={`absolute bottom-2 left-2 text-[9px] uppercase tracking-widest ${councilAssessment.likelihood === 'high' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}`}
              data-testid={`approval-badge-${candidate.id}`}
            >
              Approval {councilAssessment.approvalScore}%
            </Badge>
          )}
        </div>
        <div className="space-y-1 p-4">
          <p className="font-semibold text-white">{candidate.label}</p>
          <p className="text-2xl font-bold text-vish-gold drop-shadow-md">{candidate.overallScore}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            ${candidate.building.costSummary.total.toLocaleString()}
            {candidate.building.costSummary.intelligence
              ? ` (${candidate.building.costSummary.intelligence.confidence.score}% conf)`
              : ''}{' '}
            · Compliance {compliance}
          </p>
        </div>
      </button>
      <div className="flex gap-1 border-t border-vish-navy-700/50 p-2 bg-vish-navy-950/30 rounded-b-2xl">
        <Button size="sm" variant="ghost" className="flex-1 text-xs text-slate-300 hover:text-white hover:bg-vish-navy-800" onClick={onCompare}>
          Compare
        </Button>
        <Button size="sm" variant="ghost" className="px-2 text-slate-400 hover:text-vish-gold hover:bg-vish-navy-800" onClick={onFavorite} aria-label="Favorite">
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-vish-gold text-vish-gold' : ''}`} />
        </Button>
        <Button size="sm" variant="ghost" className="px-2 text-slate-400 hover:text-white hover:bg-vish-navy-800" onClick={onPromote} aria-label="Promote to project">
          <Upload className="h-4 w-4" />
        </Button>
        {isWinner && <Star className="ml-auto h-4 w-4 text-vish-gold fill-vish-gold" />}
      </div>
    </div>
  );
}
