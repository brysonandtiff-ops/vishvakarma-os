import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import {
  loadStudioAudioPrefs,
  saveStudioAudioPrefs,
  prefersReducedMotion,
  type StudioAudioPrefs,
} from '@/modules/studio-audio/audioPrefs';
import { playStudioSound, unlockStudioAudio, getSharedAudioNodes } from '@/modules/studio-audio/audioEngine';
import { startEditorAmbient, stopEditorAmbient } from '@/modules/studio-audio/ambientLoop';
import type { StudioSoundId } from '@/modules/studio-audio/soundCatalog';

interface StudioAudioContextValue {
  prefs: StudioAudioPrefs;
  setPrefs: (patch: Partial<StudioAudioPrefs>) => void;
  play: (id: StudioSoundId) => void;
  unlock: () => Promise<void>;
}

const StudioAudioContext = createContext<StudioAudioContextValue | null>(null);

export function StudioAudioProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<StudioAudioPrefs>(() => loadStudioAudioPrefs());
  const location = useLocation();

  const setPrefs = useCallback((patch: Partial<StudioAudioPrefs>) => {
    setPrefsState((current) => {
      const next = { ...current, ...patch };
      saveStudioAudioPrefs(next);
      return next;
    });
  }, []);

  const play = useCallback((id: StudioSoundId) => {
    playStudioSound(id);
  }, []);

  const unlock = useCallback(async () => {
    await unlockStudioAudio();
  }, []);

  useEffect(() => {
    const onGesture = () => {
      void unlockStudioAudio();
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    return () => window.removeEventListener('pointerdown', onGesture);
  }, []);

  useEffect(() => {
    const onEditor = location.pathname === '/editor' || location.pathname.startsWith('/editor/');
    if (!onEditor || !prefs.ambientEnabled || prefersReducedMotion()) {
      stopEditorAmbient();
      return;
    }

    void unlockStudioAudio().then(async () => {
      const shared = getSharedAudioNodes();
      if (shared) await startEditorAmbient(shared.ctx, shared.masterGain);
    });

    return () => stopEditorAmbient();
  }, [location.pathname, prefs.ambientEnabled, prefs.masterVolume]);

  const value = useMemo(
    () => ({ prefs, setPrefs, play, unlock }),
    [prefs, setPrefs, play, unlock],
  );

  return <StudioAudioContext.Provider value={value}>{children}</StudioAudioContext.Provider>;
}

export function useStudioAudio(): StudioAudioContextValue {
  const ctx = useContext(StudioAudioContext);
  if (!ctx) {
    throw new Error('useStudioAudio must be used within StudioAudioProvider');
  }
  return ctx;
}

export function useStudioAudioOptional(): StudioAudioContextValue | null {
  return useContext(StudioAudioContext);
}
