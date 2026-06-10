import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { OptimizationCandidate } from '@/domain/optimization/types';
import { toDisplayScoresForCandidate } from '@/services/optimization/displayDimensions';

const chartConfig = {
  score: { label: 'Score', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

export default function CandidateRadarChart({
  candidate,
}: {
  candidate: OptimizationCandidate | null;
}) {
  if (!candidate) {
    return (
      <div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
        Select a candidate to view radar chart.
      </div>
    );
  }

  const data = toDisplayScoresForCandidate(candidate).map((s) => ({
    dimension: s.label,
    score: s.score,
  }));

  return (
    <div className="rounded-2xl border border-border/60 p-4" data-testid="candidate-radar-chart">
      <h3 className="mb-2 font-semibold">{candidate.label} — Dimension Profile</h3>
      <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
        <RadarChart data={data}>
          <ChartTooltip content={<ChartTooltipContent />} />
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10 }} />
          <Radar
            dataKey="score"
            fill="var(--color-score)"
            fillOpacity={0.35}
            stroke="var(--color-score)"
            strokeWidth={2}
          />
        </RadarChart>
      </ChartContainer>
    </div>
  );
}
