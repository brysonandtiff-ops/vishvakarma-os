import { useMemo, useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic2, PenLine, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import { startGuidedDemoSession } from '@/demo-session/GuidedDemoSessionController';
import { startTutorial } from '@/tutorial/TutorialProvider';
import { OPEN_VOICE_TOUR_EVENT } from '@/voice-tour/voiceTourContent';

function hasMeaningfulEditorContent(snapshot: ReturnType<ReturnType<typeof getFloorPlanEngine>['getSnapshot']>) {
  const manifest = snapshot.manifest;
  return (
    manifest.walls.length > 0 ||
    manifest.openings.length > 0 ||
    (manifest.rooms?.length ?? 0) > 0 ||
    (manifest.furniture?.length ?? 0) > 0 ||
    (manifest.mepSymbols?.length ?? 0) > 0 ||
    (manifest.landscapeElements?.length ?? 0) > 0
  );
}

export default function EmptyCanvasGuidedStart() {
  const location = useLocation();
  const navigate = useNavigate();
  const engine = useMemo(() => getFloorPlanEngine(), []);
  const snapshot = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getSnapshot);
  const [dismissed, setDismissed] = useState(false);

  const isEditor = location.pathname === '/editor';
  const hasContent = hasMeaningfulEditorContent(snapshot);

  if (!isEditor || hasContent || dismissed) return null;

  const startDemo = () => {
    startGuidedDemoSession({ autoPlayVoice: true });
  };

  const drawWall = () => {
    navigate('/editor');
    engine.setWorkspaceMode('draft');
    engine.setGridVisible(true);
    engine.setSnapEnabled(true);
    engine.setTool('wall');
    startTutorial('essentials', { stepIndex: 2, autoStart: true });
    toast.success('Wall tool ready', {
      description: 'Grid and snap are on. Tap two points on the canvas to draw your first wall.',
    });
  };

  const openVoiceTour = () => {
    window.dispatchEvent(new CustomEvent(OPEN_VOICE_TOUR_EVENT, { detail: { autoPlay: true } }));
  };

  return (
    <section className="vish-empty-guided-start" aria-label="Empty canvas guided start">
      <button
        type="button"
        className="vish-empty-guided-start__close"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss guided start"
      >
        <X className="h-4 w-4" />
      </button>
      <p className="vish-empty-guided-start__eyebrow">Blank canvas</p>
      <h2>Start with a real first move</h2>
      <p>
        Load a polished demo, draw your first wall with grid/snap on, or let the voice tour walk you through the whole studio.
      </p>
      <div className="vish-empty-guided-start__actions">
        <button type="button" onClick={startDemo} className="primary">
          <Sparkles className="h-4 w-4" />
          Start demo
        </button>
        <button type="button" onClick={drawWall}>
          <PenLine className="h-4 w-4" />
          Draw wall
        </button>
        <button type="button" onClick={openVoiceTour}>
          <Mic2 className="h-4 w-4" />
          Voice tour
        </button>
      </div>
    </section>
  );
}
