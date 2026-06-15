import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import type { EditorTutorialSnapshot, TutorialProgress, TutorialTrack } from './types';
import { EMPTY_EDITOR_SNAPSHOT } from './types';
import { getTutorialTrack, TUTORIAL_TRACKS } from './tutorialCatalog';
import {
  dismissTutorialAutoStart,
  isTutorialAutoStartDismissed,
  loadTutorialProgress,
  markTrackCompleted,
  saveTutorialProgress,
  setTrackStep,
} from './tutorialMemory';
import TutorialEngine from './TutorialEngine';
import TutorialHub from './TutorialHub';

export const OPEN_TUTORIAL_HUB_EVENT = 'vish:open-tutorial-hub';
export const START_TUTORIAL_EVENT = 'vish:start-tutorial';

type StartTutorialDetail = {
  trackId: string;
  stepIndex?: number;
  autoStart?: boolean;
};

type TutorialContextValue = {
  activeTrack: TutorialTrack | null;
  stepIndex: number;
  progress: TutorialProgress;
  hubOpen: boolean;
  paused: boolean;
  editorSnapshot: EditorTutorialSnapshot;
  startTrack: (trackId: string, stepIndex?: number) => void;
  resumeTrack: (trackId: string) => void;
  advance: () => void;
  back: () => void;
  skipTrack: () => void;
  completeTrack: () => void;
  openHub: () => void;
  closeHub: () => void;
  setPaused: (paused: boolean) => void;
  updateEditorSnapshot: (snapshot: EditorTutorialSnapshot) => void;
  isTrackCompleted: (trackId: string) => boolean;
};

import { createContext, useContext, type ReactNode } from 'react';

const TutorialContext = createContext<TutorialContextValue | null>(null);

export function useTutorial() {
  const ctx = useContext(TutorialContext);
  if (!ctx) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return ctx;
}

export function useTutorialOptional() {
  return useContext(TutorialContext);
}

function parseTutorialQuery(searchParams: URLSearchParams) {
  const trackId = searchParams.get('tutorial');
  const stepRaw = searchParams.get('step');
  const stepIndex = stepRaw != null ? Number.parseInt(stepRaw, 10) : 0;
  return trackId ? { trackId, stepIndex: Number.isFinite(stepIndex) ? stepIndex : 0 } : null;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [progress, setProgress] = useState<TutorialProgress>(() => loadTutorialProgress());
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [hubOpen, setHubOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [editorSnapshot, setEditorSnapshot] = useState<EditorTutorialSnapshot>(EMPTY_EDITOR_SNAPSHOT);
  const queryHandled = useRef(false);
  const pendingRouteNav = useRef<string | null>(null);

  const activeTrack = activeTrackId ? getTutorialTrack(activeTrackId) ?? null : null;

  const persistProgress = useCallback((updater: (prev: TutorialProgress) => TutorialProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveTutorialProgress(next);
      return next;
    });
  }, []);

  const clearTutorialQuery = useCallback(() => {
    if (!searchParams.has('tutorial') && !searchParams.has('step')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('tutorial');
    next.delete('step');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const startTrack = useCallback(
    (trackId: string, startAt = 0) => {
      const track = getTutorialTrack(trackId);
      if (!track) return;
      setHubOpen(false);
      setPaused(false);
      setActiveTrackId(trackId);
      const clamped = Math.max(0, Math.min(startAt, track.steps.length - 1));
      setStepIndex(clamped);
      const step = track.steps[clamped];
      persistProgress((prev) => setTrackStep(trackId, step.id, prev));
      if (track.defaultRoute && location.pathname !== track.defaultRoute && !step?.route) {
        pendingRouteNav.current = track.defaultRoute;
        navigate(track.defaultRoute);
      } else if (step?.route && location.pathname !== step.route) {
        pendingRouteNav.current = step.route;
        navigate(step.route);
      }
    },
    [location.pathname, navigate, persistProgress],
  );

  const resumeTrack = useCallback(
    (trackId: string) => {
      const track = getTutorialTrack(trackId);
      if (!track) return;
      const lastStepId = progress.lastStep[trackId];
      const idx = lastStepId ? track.steps.findIndex((s) => s.id === lastStepId) : 0;
      startTrack(trackId, Math.max(0, idx));
    },
    [progress.lastStep, startTrack],
  );

  const completeTrack = useCallback(() => {
    if (!activeTrackId) return;
    persistProgress((prev) => markTrackCompleted(activeTrackId, prev));
    setActiveTrackId(null);
    setStepIndex(0);
    clearTutorialQuery();
  }, [activeTrackId, clearTutorialQuery, persistProgress]);

  const skipTrack = useCallback(() => {
    if (!activeTrackId) return;
    persistProgress((prev) => {
      const lastStep = { ...prev.lastStep };
      delete lastStep[activeTrackId];
      return { ...prev, lastStep, lastActiveTrackId: undefined };
    });
    setActiveTrackId(null);
    setStepIndex(0);
    clearTutorialQuery();
  }, [activeTrackId, clearTutorialQuery, persistProgress, progress]);

  const advance = useCallback(() => {
    if (!activeTrack || !activeTrackId) return;
    const nextIndex = stepIndex + 1;
    if (nextIndex >= activeTrack.steps.length) {
      completeTrack();
      return;
    }
    const nextStep = activeTrack.steps[nextIndex];
    setStepIndex(nextIndex);
    persistProgress((prev) => setTrackStep(activeTrackId, nextStep.id, prev));
    if (nextStep.route && location.pathname !== nextStep.route) {
      pendingRouteNav.current = nextStep.route;
      navigate(nextStep.route);
    }
  }, [activeTrack, activeTrackId, completeTrack, location.pathname, navigate, persistProgress, stepIndex]);

  const back = useCallback(() => {
    if (!activeTrack || !activeTrackId || stepIndex <= 0) return;
    const prevIndex = stepIndex - 1;
    const prevStep = activeTrack.steps[prevIndex];
    setStepIndex(prevIndex);
    persistProgress((prev) => setTrackStep(activeTrackId, prevStep.id, prev));
    if (prevStep.route && location.pathname !== prevStep.route) {
      pendingRouteNav.current = prevStep.route;
      navigate(prevStep.route);
    }
  }, [activeTrack, activeTrackId, location.pathname, navigate, persistProgress, stepIndex]);

  const openHub = useCallback(() => setHubOpen(true), []);
  const closeHub = useCallback(() => setHubOpen(false), []);

  const updateEditorSnapshot = useCallback((snapshot: EditorTutorialSnapshot) => {
    setEditorSnapshot(snapshot);
  }, []);

  const isTrackCompleted = useCallback(
    (trackId: string) => progress.completed.includes(trackId),
    [progress.completed],
  );

  useEffect(() => {
    const onOpenHub = () => setHubOpen(true);
    const onStart = (event: Event) => {
      const detail = (event as CustomEvent<StartTutorialDetail>).detail;
      if (detail?.trackId) {
        startTrack(detail.trackId, detail.stepIndex ?? 0);
        if (detail.autoStart) {
          dismissTutorialAutoStart();
        }
      }
    };
    window.addEventListener(OPEN_TUTORIAL_HUB_EVENT, onOpenHub);
    window.addEventListener(START_TUTORIAL_EVENT, onStart);
    return () => {
      window.removeEventListener(OPEN_TUTORIAL_HUB_EVENT, onOpenHub);
      window.removeEventListener(START_TUTORIAL_EVENT, onStart);
    };
  }, [startTrack]);

  useEffect(() => {
    if (queryHandled.current) return;
    const parsed = parseTutorialQuery(searchParams);
    if (!parsed) return;
    queryHandled.current = true;
    startTrack(parsed.trackId, parsed.stepIndex);
    clearTutorialQuery();
  }, [clearTutorialQuery, searchParams, startTrack]);

  useEffect(() => {
    if (!activeTrack) return;
    const step = activeTrack.steps[stepIndex];
    if (!step?.route) return;
    if (location.pathname === step.route) {
      pendingRouteNav.current = null;
    }
  }, [activeTrack, location.pathname, stepIndex]);

  const value = useMemo<TutorialContextValue>(
    () => ({
      activeTrack,
      stepIndex,
      progress,
      hubOpen,
      paused,
      editorSnapshot,
      startTrack,
      resumeTrack,
      advance,
      back,
      skipTrack,
      completeTrack,
      openHub,
      closeHub,
      setPaused,
      updateEditorSnapshot,
      isTrackCompleted,
    }),
    [
      activeTrack,
      stepIndex,
      progress,
      hubOpen,
      paused,
      editorSnapshot,
      startTrack,
      resumeTrack,
      advance,
      back,
      skipTrack,
      completeTrack,
      openHub,
      closeHub,
      updateEditorSnapshot,
      isTrackCompleted,
    ],
  );

  return (
    <TutorialContext.Provider value={value}>
      {children}
      <TutorialEngine />
      <TutorialHub />
    </TutorialContext.Provider>
  );
}

export function openTutorialHub() {
  window.dispatchEvent(new Event(OPEN_TUTORIAL_HUB_EVENT));
}

export function startTutorial(trackId: string, options?: { stepIndex?: number; autoStart?: boolean }) {
  window.dispatchEvent(
    new CustomEvent<StartTutorialDetail>(START_TUTORIAL_EVENT, {
      detail: { trackId, stepIndex: options?.stepIndex, autoStart: options?.autoStart },
    }),
  );
}

export function shouldAutoStartEssentials() {
  return !isTutorialAutoStartDismissed();
}

export { TUTORIAL_TRACKS };
