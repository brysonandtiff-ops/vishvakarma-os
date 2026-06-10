import type { TradeoffItem } from '@/domain/optimization/types';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export default function TradeoffPanel({ tradeoffs }: { tradeoffs: TradeoffItem[] }) {
  if (tradeoffs.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/60 p-4" data-testid="tradeoff-panel">
      <h3 className="mb-3 font-semibold">Tradeoffs — Winner vs Runner-up</h3>
      <ul className="space-y-2">
        {tradeoffs.map((item) => (
          <li key={item.dimension} className="flex items-start gap-2 text-sm">
            {item.direction === 'improves' && (
              <ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            )}
            {item.direction === 'worsens' && (
              <ArrowDown className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            )}
            {item.direction === 'unchanged' && (
              <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span>
              <strong>{item.dimension}:</strong> {item.detail}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
