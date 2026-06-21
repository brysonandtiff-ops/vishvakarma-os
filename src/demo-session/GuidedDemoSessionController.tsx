import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getFloorPlanEngine } from '@/core/floorPlanEngine';
import { loadSampleById } from '@/core/sampleCatalog';
import { startTutorial } from '@/tutorial/TutorialProvider';
import { OPEN_VOICE_TOUR_EVENT } from '@/voice-tour/voiceTourContent';

export const START_GUIDED_DEMO_SESSION_EVENT = 'vish:start-guided-demo-session';
export const GUIDED_DEMO_SAMPLE_ID = 'full-feature-showcase';

type GuidedDemoSessionDetail = {
  autoPlayVoice?: boolean;
};

export function startGuidedDemoSession(options?: GuidedDemoSessionDetail) {
  window.dispatchEvent(
    new CustomEvent<GuidedDemoSessionDetail>(START_GUIDED_DEMO_SESSION_EVENT, {
      detail: { autoPlayVoice: options?.autoPlayVoice ?? true },
    }),
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function GuidedDemoSessionController() {
  const navigate = useNavigate();
  const location = useLocation();
  const runningRef = useRef(false);

  const runDemoSession = useCallback(
    async (detail?: GuidedDemoSessionDetail) => {
      if (runningRef.current) return;
      runningRef.current = true;

      try {
        if (location.pathname !== '/editor') {
          navigate('/editor');
          await wait(450);
        } else {
          await wait(80);
        }

        const sample = await loadSampleById(GUIDED_DEMO_SAMPLE_ID);
        const engine = getFloorPlanEngine();
        engine.loadManifest(sample, sample.name);
        engine.setGridVisible(true);
        engine.setSnapEnabled(true);
        engine.setShow3D(true);
        engine.setWorkspaceMode('draft');
        engine.setTool('select');
        engine.resetCanvasViewport();

        toast.success('Demo session started', {
          description: 'Sample loaded, grid on, 3D open, voice guide starting.',
        });

        window.setTimeout(() => {
          startTutorial('essentials', { stepIndex: 0, autoStart: true });
          window.dispatchEvent(
            new CustomEvent(OPEN_VOICE_TOUR_EVENT, {
              detail: { autoPlay: detail?.autoPlayVoice ?? true },
            }),
          );
        }, 350);
      } catch (error) {
        console.error('Failed to start guided demo session:', error);
        toast.error('Could not start demo session', {
          description: error instanceof Error ? error.message : 'Try loading a demo manually from the editor top bar.',
        });
      } finally {
        runningRef.current = false;
      }
    },
    [location.pathname, navigate],
  );

  useEffect(() => {
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<GuidedDemoSessionDetail>).detail;
      void runDemoSession(detail);
    };
    window.addEventListener(START_GUIDED_DEMO_SESSION_EVENT, onStart);
    return () => window.removeEventListener(START_GUIDED_DEMO_SESSION_EVENT, onStart);
  }, [runDemoSession]);

  return null;
}
