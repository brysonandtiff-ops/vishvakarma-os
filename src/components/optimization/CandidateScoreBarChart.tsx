import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { OptimizationCandidate } from '@/domain/optimization/types';
import {
  PRIMARY_DIMENSION_LABELS,
  PRIMARY_DIMENSIONS,
  toDisplayScoresForCandidate,
} from '@/services/optimization/displayDimensions';

const CANDIDATE_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function buildChartConfig(candidates: OptimizationCandidate[]): ChartConfig {
  const config: ChartConfig = {};
  candidates.forEach((candidate, index) => {
    config[candidate.id] = {
      label: candidate.label,
      color: CANDIDATE_COLORS[index % CANDIDATE_COLORS.length],
    };
  });
  return config;
}

export default function CandidateScoreBarChart({
  candidates,
}: {
  candidates: OptimizationCandidate[];
}) {
  const chartConfig = buildChartConfig(candidates);

  const data = PRIMARY_DIMENSIONS.map((dimension) => {
    const row: Record<string, string | number> = {
      dimension: PRIMARY_DIMENSION_LABELS[dimension],
    };
    for (const candidate of candidates) {
      const display = toDisplayScoresForCandidate(candidate);
      row[candidate.id] = display.find((s) => s.dimension === dimension)?.score ?? 0;
    }
    return row;
  });

  return (
    <div
      className="rounded-2xl border border-border/60 p-4"
      data-testid="candidate-score-bar-chart"
    >
      <h3 className="mb-2 font-semibold">Candidate Comparison — 6 Dimensions</h3>
      <ChartContainer config={chartConfig} className="aspect-[2/1] min-h-[260px] w-full">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="dimension" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {candidates.map((candidate) => (
            <Bar
              key={candidate.id}
              dataKey={candidate.id}
              fill={`var(--color-${candidate.id})`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
