import { useCallback, useEffect, useRef, useState } from 'react';
import {
  availableEnglishVoices,
  NARRATION_PREFS_EVENT,
  readNarrationPreferences,
  saveNarrationPreferences,
  type NarrationPreferences,
} from '@/voice-tour/voiceQuality';

/** Voice lists on Safari may load only after a user gesture and voiceschanged. */
export function useNarrationVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<NarrationPreferences>(readNarrationPreferences);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    const synth = window.speechSynthesis;
    const refresh = () => {
      const next = availableEnglishVoices(synth.getVoices());
      setVoices((old) =>
        old.length === next.length && old.every((voice, index) =>
          voice.voiceURI === next[index]?.voiceURI && voice.lang === next[index]?.lang
        ) ? old : next,
      );
    };
    refresh();
    const first = window.setTimeout(refresh, 250);
    const second = window.setTimeout(refresh, 1000);
    synth.addEventListener?.('voiceschanged', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      synth.removeEventListener?.('voiceschanged', refresh);
      window.removeEventListener('focus', refresh);
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, []);

  useEffect(() => {
    const sync = (event: Event) => {
      const detail = (event as CustomEvent<NarrationPreferences>).detail;
      const updated = detail && typeof detail.voiceURI === 'string'
        ? detail
        : readNarrationPreferences();
      settingsRef.current = updated;
      setSettings(updated);
    };
    window.addEventListener(NARRATION_PREFS_EVENT, sync);
    return () => window.removeEventListener(NARRATION_PREFS_EVENT, sync);
  }, []);

  const updateSettings = useCallback((patch: Partial<NarrationPreferences>) => {
    // Persist outside React's state updater: StrictMode may invoke updater twice.
    const updated = { ...settingsRef.current, ...patch };
    settingsRef.current = updated;
    setSettings(updated);
    saveNarrationPreferences(updated);
  }, []);

  return { voices, settings, updateSettings };
}
