import { analyzeVastu } from '@/core/simulations/vastu';
import type { ProjectManifest } from '@/types';

export function VastuPanel({ manifest }: { manifest: ProjectManifest }) {
  const result = analyzeVastu(manifest);
  return (
    <div className="space-y-3 px-4 py-3 text-xs">
      <p className="font-bold uppercase tracking-[0.14em] text-primary">Vastu Harmony</p>
      <p className="text-2xl font-bold text-foreground">{result.harmonyPercent}%</p>
      <p className="text-muted-foreground">Entrance {result.entranceScore} · Kitchen {result.kitchenScore}</p>
      <ul className="space-y-1 text-muted-foreground">
        {result.tips.map((tip) => (
          <li key={tip}>• {tip}</li>
        ))}
      </ul>
    </div>
  );
}
