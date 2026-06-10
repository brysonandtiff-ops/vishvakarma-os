import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { SiteFitnessScore } from '@/domain/optimization/types';

const chartConfig = {
  score: { label: 'Score', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

export default function SiteFitnessPanel({ siteFitness }: { siteFitness: SiteFitnessScore }) {
  const data = [
    { label: 'Solar', score: siteFitness.solarOrientation },
    { label: 'Slope', score: siteFitness.slopeSuitability },
    { label: 'Access', score: siteFitness.accessEfficiency },
    { label: 'Setbacks', score: siteFitness.setbackUtilization },
    { label: 'Open Space', score: siteFitness.openSpaceQuality },
  ];

  return (
    <div className="rounded-2xl border border-border/60 p-4" data-testid="site-fitness-panel">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">Site Fitness</h3>
        <span className="text-2xl font-bold text-primary">{siteFitness.overall}</span>
      </div>
      <ChartContainer config={chartConfig} className="aspect-[2/1] min-h-[180px] w-full">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} width={28} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
