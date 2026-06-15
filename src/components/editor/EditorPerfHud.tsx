import { useEffect, useState } from 'react';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';

const HUD_KEY = 'vishvakarma.os.perf.hud';

export function isPerfHudEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.localStorage.getItem(HUD_KEY) === '1') return true;
  return new URLSearchParams(window.location.search).get('perf') === '1';
}

export default function EditorPerfHud() {
  const [enabled] = useState(isPerfHudEnabled);
  const [geometryRevision, setGeometryRevision] = useState(0);
  const [viewportRevision, setViewportRevision] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const engine = getFloorPlanEngine();
    const sync = () => {
      const snapshot = engine.getSnapshot();
      setGeometryRevision(snapshot.geometryRevision);
      setViewportRevision(snapshot.viewportRevision);
    };
    sync();
    const unsub = engine.subscribe(sync);
    const unsubViewport = engine.subscribeViewport(sync);
    return () => {
      unsub();
      unsubViewport();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-30 rounded-md border border-primary/30 bg-black/70 px-2 py-1 font-mono text-[10px] text-primary">
      geo:{geometryRevision} view:{viewportRevision}
    </div>
  );
}
