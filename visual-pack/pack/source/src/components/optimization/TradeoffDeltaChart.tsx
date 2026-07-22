import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { OptimizationCandidate } from '@/domain/optimization/types';
import {
  PRIMARY_DIMENSION_LABELS,
  PRIMARY_DIMENSIONS,
  toDisplayScores,
} from '@/services/optimization/displayDimensions';

const chartConfig = {
  delta: { label: 'Delta', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

export default function TradeoffDeltaChart({
  winner,
  runnerUp,
}: {
  winner: OptimizationCandidate;
  runnerUp: OptimizationCandidate;
}) {
  const winnerDisplay = toDisplayScores(winner.scores);
  const runnerDisplay = toDisplayScores(runnerUp.scores);
  const winnerMap = new Map(winnerDisplay.map((s) => [s.dimension, s.score]));
  const runnerMap = new Map(runnerDisplay.map((s) => [s.dimension, s.score]));

  const data = PRIMARY_DIMENSIONS.map((dimension) => ({
    dimension: PRIMARY_DIMENSION_LABELS[dimension],
    delta: (winnerMap.get(dimension) ?? 0) - (runnerMap.get(dimension) ?? 0),
  }));

  return (
    <div className="rounded-2xl border border-border/60 p-4" data-testid="tradeoff-delta-chart">
      <h3 className="mb-2 font-semibold">Tradeoff Deltas — Winner vs Runner-up</h3>
      <ChartContainer config={chartConfig} className="aspect-[4/3] min-h-[220px] w-full">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" domain={[-40, 40]} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="dimension"
            width={90}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="delta" fill="var(--color-delta)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
