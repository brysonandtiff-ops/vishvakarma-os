import { memo, useEffect, useState } from 'react';
import {
  atmosphereModeForProfile,
  persistPerformanceProfile,
  readStoredPerformanceProfile,
  resolvePerformanceProfile,
  type PerformanceProfile,
} from '@/utils/performanceProfile';

const OPTIONS: { id: PerformanceProfile; label: string; hint: string }[] = [
  { id: 'draft', label: 'Draft', hint: 'iPad default — low GPU, coalesced undo' },
  { id: 'studio', label: 'Studio', hint: 'Balanced visuals for daily work' },
  { id: 'presentation', label: 'Presentation', hint: 'Cinematic 3D for reviews' },
];

function PerformanceProfilePanel() {
  const [profile, setProfile] = useState<PerformanceProfile>(() =>
    readStoredPerformanceProfile() ?? resolvePerformanceProfile(),
  );

  useEffect(() => {
    persistPerformanceProfile(profile);
  }, [profile]);

  return (
    <div className="space-y-2 px-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Performance profile</p>
      <div className="grid gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              profile === option.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background/40 text-foreground hover:border-primary/40'
            }`}
            onClick={() => setProfile(option.id)}
          >
            <span className="font-medium">{option.label}</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {option.hint} · 3D: {atmosphereModeForProfile(option.id)}
            </span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        Dev HUD: add <code className="text-primary">?perf=1</code> or set localStorage{' '}
        <code className="text-primary">vishvakarma.os.perf.hud=1</code>
      </p>
    </div>
  );
}

export default memo(PerformanceProfilePanel);
