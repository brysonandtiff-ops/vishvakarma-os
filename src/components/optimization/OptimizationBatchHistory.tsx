import type { OptimizationBatchRecord } from '@/domain/optimization/types';

export default function OptimizationBatchHistory({
  records,
}: {
  records: OptimizationBatchRecord[];
}) {
  if (records.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-border/60 p-4"
      data-testid="optimization-batch-history"
    >
      <h3 className="mb-3 font-semibold">Recent Optimization Runs</h3>
      <ul className="space-y-2">
        {records.map((record) => {
          const winner = record.candidateSummaries.find((c) => c.id === record.winnerId);
          return (
            <li
              key={record.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/30 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{record.input.prompt.slice(0, 80)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(record.createdAt).toLocaleString()} · Moat {record.moatGain.score}
                  {record.promotedProjectId ? ' · Saved' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{winner?.label ?? 'Winner'}</p>
                <p className="text-xs text-muted-foreground">
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
