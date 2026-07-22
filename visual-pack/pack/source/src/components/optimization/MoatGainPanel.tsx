import MetricPill from '@/components/common/MetricPill';
import type { MoatGainReport } from '@/domain/optimization/types';

export default function MoatGainPanel({ moatGain }: { moatGain: MoatGainReport }) {
  const isDefensible = moatGain.valueImpactBand === 'defensible';
  const costDefensible = moatGain.costMoat?.valueImpactBand === 'cost_defensible';

  return (
    <div
      className="space-y-4 rounded-2xl border border-border/60 p-4"
      data-testid="moat-gain-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">Moat Gain</h3>
          <p className="text-sm text-muted-foreground">{moatGain.summary}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">{moatGain.compositeScore}</p>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Composite / 100
          </p>
          <p className="text-xs text-muted-foreground">Decision {moatGain.score}</p>
        </div>
      </div>

      <div
        className={`rounded-xl p-3 ${
          isDefensible ? 'bg-primary/10' : 'bg-muted/40'
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Decision Value Impact
        </p>
        <p className="mt-1 text-lg font-semibold">
          {isDefensible ? '$1M–3M → $3M–8M' : '$1M–3M'}
        </p>
        <p className="text-sm text-muted-foreground">
          Platform band: {moatGain.valueImpactLabel}
          {isDefensible ? ' (defensible optimization moat)' : ' (generator territory)'}
        </p>
      </div>

      {moatGain.costMoat && (
        <div
          className={`rounded-xl p-3 ${
            costDefensible ? 'bg-primary/10' : 'bg-muted/40'
          }`}
          data-testid="cost-moat-band"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cost Value Impact
          </p>
          <p className="mt-1 text-lg font-semibold">
            {costDefensible ? '$5M–15M → $10M–25M' : '$5M–15M'}
          </p>
          <p className="text-sm text-muted-foreground">
            Cost band: {moatGain.costMoat.valueImpactLabel} · Score {moatGain.costMoat.score}/100
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <MetricPill value={`+${moatGain.decisionLift}`} label="Decision Lift" />
        <MetricPill value={`+${moatGain.winnerMargin}`} label="Winner Margin" />
        <MetricPill value={String(moatGain.strategyDiversity)} label="Diversity" />
        <MetricPill value={`${moatGain.permitConfidence}%`} label="Permit Conf." />
        <MetricPill value={`${moatGain.explainabilityIndex}%`} label="Explainability" />
        {moatGain.costMoat && (
          <MetricPill value={`${moatGain.costMoat.costConfidence}%`} label="Cost Conf." />
        )}
      </div>
    </div>
  );
}
