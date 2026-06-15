import { formatIntentType } from '@/cast/CastIntentRelay';
import type { CastIntentEvent } from '@/cast/types';

interface CastIntentTimelineProps {
  intents: CastIntentEvent[];
}

export default function CastIntentTimeline({ intents }: CastIntentTimelineProps) {
  if (intents.length === 0) {
    return (
      <div className="rounded-lg border border-primary/20 bg-black/20 px-3 py-4 text-xs text-ws-text-dim">
        Intent relay will narrate design changes as the presenter edits.
      </div>
    );
  }

  return (
    <div
      className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-primary/20 bg-black/20 px-3 py-3"
      data-testid="cast-intent-timeline"
    >
      {intents.map((event) => (
        <div key={event.id} className="border-l-2 border-primary/50 pl-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
            {formatIntentType(event.type)}
          </p>
          <p className="text-xs leading-relaxed text-ws-text">{event.message}</p>
        </div>
      ))}
    </div>
  );
}
