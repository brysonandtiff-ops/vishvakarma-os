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
      <div className="rounded-2xl border border-vish-navy-700/50 bg-vish-navy-900/40 p-4 text-sm text-slate-400 shadow-inner">
        Cost intelligence unavailable — run a full Copilot or Optimization build.
      </div>
    );
  }

  const { scenarios, confidence, risk, regionLabel } = intelligence;
  const riskColor =
    risk.level === 'high'
      ? 'text-red-500'
      : risk.level === 'medium'
        ? 'text-amber-400'
        : 'text-green-400';

  return (
    <div
      className="space-y-4 rounded-2xl border border-vish-navy-700/50 bg-vish-navy-900/40 p-4 shadow-xl backdrop-blur-xl"
      data-testid="cost-intelligence-panel"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-white">Construction Cost Intelligence</h3>
          <p className="text-sm text-slate-400">{regionLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-vish-gold drop-shadow-md">
            ${scenarios.expected.toLocaleString()}
          </p>
          <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">Expected</p>
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
        <div className="rounded-xl border border-vish-navy-700/30 bg-vish-navy-950/50 p-3 text-sm shadow-inner">
          <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Cost Breakdown
          </p>
          <ul className="mt-2 space-y-1 text-slate-300">
            {scenarios.breakdown.map((line) => (
              <li key={line.id} className="flex justify-between gap-2">
                <span>{line.label}</span>
                <span className="font-mono text-vish-gold/80">
                  ${line.amount.toLocaleString()} ({line.sharePct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-vish-navy-700/30 bg-vish-navy-950/50 p-3 text-sm shadow-inner">
          <p className="font-technical text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Risk Analysis
          </p>
          <p className={`mt-2 font-semibold capitalize ${riskColor}`}>{risk.level} risk</p>
          <p className="mt-1 text-slate-400">{confidence.summary}</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {risk.drivers.slice(0, 3).map((driver) => (
              <li key={driver}>• {driver}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
