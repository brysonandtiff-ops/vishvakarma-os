import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { CostScenarioBreakdown } from '@/domain/cost/types';

const chartConfig = {
  amount: { label: 'Cost', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

const SCENARIO_COLORS = [
  'hsl(var(--chart-2))',
  'hsl(var(--primary))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-3))',
];

export default function CostScenarioChart({
  scenarios,
}: {
  scenarios: CostScenarioBreakdown;
}) {
  const data = [
    { label: 'Best', amount: scenarios.bestCase },
    { label: 'Expected', amount: scenarios.expected },
    { label: 'Median', amount: scenarios.median },
    { label: 'Worst', amount: scenarios.worstCase },
  ];

  return (
    <div data-testid="cost-scenario-chart">
      <ChartContainer config={chartConfig} className="aspect-[2/1] min-h-[180px] w-full">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <ChartTooltip
            content={
              <ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />
            }
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={data[index].label} fill={SCENARIO_COLORS[index % SCENARIO_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
