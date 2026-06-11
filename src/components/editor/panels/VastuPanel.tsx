import { analyzeVastu } from '@/core/simulations/vastu';
import type { ProjectManifest } from '@/types';

export function VastuPanel({ manifest }: { manifest: ProjectManifest }) {
  const result = analyzeVastu(manifest);
  return (
    <div className="vish-vastu-panel space-y-3 px-4 py-3 text-xs">
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Vastu Harmony</p>
      <p className="text-2xl font-bold text-ws-text">{result.harmonyPercent}%</p>
      <p className="text-ws-text-dim">
        Entrance <span className="font-semibold text-ws-text">{result.entranceScore}</span>
        {' · '}
        Kitchen <span className="font-semibold text-ws-text">{result.kitchenScore}</span>
      </p>
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
