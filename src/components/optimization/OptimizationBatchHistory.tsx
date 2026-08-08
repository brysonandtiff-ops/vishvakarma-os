import type { OptimizationBatchRecord } from '@/domain/optimization/types';

export default function OptimizationBatchHistory({
  records,
}: {
  records: OptimizationBatchRecord[];
}) {
  if (records.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-vish-navy-700/50 bg-vish-navy-950/40 p-4 shadow-xl backdrop-blur-xl"
      data-testid="optimization-batch-history"
      data-tutorial="optimization-history"
    >
      <h3 className="mb-3 font-technical text-xs font-bold uppercase tracking-widest text-vish-gold/90">Recent Optimization Runs</h3>
      <ul className="space-y-2">
        {records.map((record) => {
          const winner = record.candidateSummaries.find((c) => c.id === record.winnerId);
          return (
            <li
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-vish-navy-900/50 border border-vish-navy-800/50 px-3 py-2 text-sm hover:bg-vish-navy-800 transition"
            >
              <div>
                <p className="font-medium text-white">{record.input.prompt.slice(0, 80)}</p>
                <p className="text-[11px] text-slate-400">
                  {new Date(record.createdAt).toLocaleString()} · Moat {record.moatGain.score}
                  {record.promotedProjectId ? ' · Saved' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-vish-gold">{winner?.label ?? 'Winner'}</p>
                <p className="text-[11px] text-slate-400">
                  {winner?.overallScore ?? '—'}/100 · {record.moatGain.valueImpactLabel}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
