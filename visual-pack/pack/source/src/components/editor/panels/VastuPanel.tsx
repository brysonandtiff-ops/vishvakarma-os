import { analyzeVastu } from '@/core/simulations/vastu';
import type { ProjectManifest } from '@/types';

function DirectionBars({ directions }: { directions: ReturnType<typeof analyzeVastu>['directions'] }) {
  return (
    <div className="space-y-1" aria-label="Vastu direction scores">
      {directions.map((d) => (
        <div key={d.direction} className="flex items-center gap-2">
          <span className="w-6 font-mono text-[10px] text-primary">{d.direction}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-primary/70 transition-all"
              style={{ width: `${d.score}%` }}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-ws-text-dim">{d.score}</span>
        </div>
      ))}
    </div>
  );
}

export function VastuPanel({ manifest }: { manifest: ProjectManifest }) {
  const result = analyzeVastu(manifest);

  return (
    <div className="vish-vastu-panel space-y-3 px-4 py-3 text-xs" data-tutorial="vastu-panel">
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Vastu Harmony</p>
      <p className="text-2xl font-bold text-ws-text">{result.harmonyPercent}%</p>
      <p className="text-ws-text-dim">
        Entrance <span className="font-semibold text-ws-text">{result.entranceScore}</span>
        {' · '}
        Kitchen <span className="font-semibold text-ws-text">{result.kitchenScore}</span>
        {' · '}
        Puja <span className="font-semibold text-ws-text">{result.pujaScore}</span>
      </p>

      <div>
        <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Eight directions</p>
        <DirectionBars directions={result.directions} />
      </div>

      {result.roomPlacements.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Room placement</p>
          <ul className="space-y-1 text-ws-text-dim">
            {result.roomPlacements.map((room) => (
              <li key={room.label} className="leading-relaxed">
                {room.label}: {room.direction} ({room.score}%)
                {room.score < 70 && (
                  <span className="text-warning"> → ideal {room.idealDirections.join('/')}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="space-y-1.5 text-ws-text-dim">
        {result.tips.map((tip) => (
          <li key={tip} className="leading-relaxed">
            <span className="text-primary/80" aria-hidden>
              •{' '}
            </span>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
