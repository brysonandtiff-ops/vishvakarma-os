import type { OptimizationCandidate } from '@/domain/optimization/types';
import CandidateCard from '@/components/optimization/CandidateCard';

export default function CandidateComparisonGrid({
  candidates,
  winnerId,
  favorites,
  selectedId,
  compareId,
  onSelect,
  onFavorite,
  onPromote,
  onCompare,
}: {
  candidates: OptimizationCandidate[];
  winnerId: string;
  favorites: Set<string>;
  selectedId: string | null;
  compareId: string | null;
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
  onPromote: (candidate: OptimizationCandidate) => void;
  onCompare: (id: string) => void;
}) {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      data-testid="candidate-grid"
    >
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          isWinner={candidate.id === winnerId}
          isFavorite={favorites.has(candidate.id)}
          isSelected={selectedId === candidate.id || compareId === candidate.id}
          onSelect={() => onSelect(candidate.id)}
          onFavorite={() => onFavorite(candidate.id)}
          onPromote={() => onPromote(candidate)}
          onCompare={() => onCompare(candidate.id)}
        />
      ))}
    </div>
  );
}
