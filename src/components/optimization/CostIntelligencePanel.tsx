import { PrototypeModuleNotice } from '@/components/common/PrototypeDisclaimer';
import MetricPill from '@/components/common/MetricPill';
import CostScenarioChart from '@/components/optimization/CostScenarioChart';
import type { CostIntelligenceReport } from '@/domain/cost/types';

export default function CostIntelligencePanel({
  intelligence,
}: {
  intelligence: CostIntelligenceReport | undefined;
}) {
  if (!intelligence) {
    return (
      <div className="rounded-2xl border border-border/60 p-4 text-sm text-muted-foreground">
        Cost intelligence unavailable — run a full Copilot or Optimization build.
      </div>
    );
  }

  const { scenarios, confidence, risk, regionLabel } = intelligence;
  const riskColor =
    risk.level === 'high'
      ? 'text-red-600 dark:text-red-400'
      : risk.level === 'medium'
        ? 'text-amber-700 dark:text-amber-400'
        : 'text-green-700 dark:text-green-400';

  return (
    <div
      className="space-y-4 rounded-2xl border border-border/60 p-4"
      data-testid="cost-intelligence-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Construction Cost Intelligence</h3>
          <p className="text-sm text-muted-foreground">{regionLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">
            ${scenarios.expected.toLocaleString()}
          </p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Expected</p>
        </div>
      </div>

      <PrototypeModuleNotice variant="cost" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricPill value={`$${scenarios.bestCase.toLocaleString()}`} label="Best Case" />
        <MetricPill value={`$${scenarios.worstCase.toLocaleString()}`} label="Worst Case" />
        <MetricPill value={`$${scenarios.median.toLocaleString()}`} label="Median" />
        <MetricPill value={`${confidence.score}%`} label="Confidence" />
      </div>

      <CostScenarioChart scenarios={scenarios} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-muted/30 p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cost Breakdown
          </p>
          <ul className="mt-2 space-y-1">
            {scenarios.breakdown.map((line) => (
              <li key={line.id} className="flex justify-between gap-2">
                <span>{line.label}</span>
                <span>
                  ${line.amount.toLocaleString()} ({line.sharePct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-muted/30 p-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Risk Analysis
          </p>
          <p className={`mt-2 font-semibold capitalize ${riskColor}`}>{risk.level} risk</p>
          <p className="mt-1 text-muted-foreground">{confidence.summary}</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {risk.drivers.slice(0, 3).map((driver) => (
              <li key={driver}>• {driver}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
