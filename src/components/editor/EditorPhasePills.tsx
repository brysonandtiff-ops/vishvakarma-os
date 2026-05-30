import { useState } from 'react';

const phases = ['All', '1', '2', '3'] as const;

export default function EditorPhasePills() {
  const [active, setActive] = useState<(typeof phases)[number]>('All');

  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2" data-testid="editor-phase-pills">
      <span className="vish-canvas-overlay-pill">Phase</span>
      <div className="vish-mode-tab-group">
        {phases.map((phase) => (
          <button
            key={phase}
            type="button"
            className={`vish-mode-tab ${active === phase ? 'active' : ''}`}
            onClick={() => setActive(phase)}
          >
            {phase}
          </button>
        ))}
      </div>
    </div>
  );
}
