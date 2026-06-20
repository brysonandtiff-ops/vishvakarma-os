import { useState } from 'react';
import { useCoarsePointer } from '@/hooks/useCoarsePointer';

const phases = ['All', '1', '2', '3'] as const;

/** Phase filter UI — local-only until engine phase wiring ships. Hidden on coarse pointer to avoid overlap with walk pad / minimap. */
export default function EditorPhasePills() {
  const isCoarsePointer = useCoarsePointer();
  const [active, setActive] = useState<(typeof phases)[number]>('All');

  if (isCoarsePointer) return null;

  return (
    <div
      className="pointer-events-auto absolute bottom-16 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2"
      data-testid="editor-phase-pills"
    >
      <span className="vish-canvas-overlay-pill text-[10px]">Phase</span>
      <div className="vish-phase-pill-group">
        {phases.map((phase) => (
          <button
            key={phase}
            type="button"
            className={`vish-phase-pill ${active === phase ? 'active' : ''}`}
            onClick={() => setActive(phase)}
          >
            {phase}
          </button>
        ))}
      </div>
    </div>
  );
}
