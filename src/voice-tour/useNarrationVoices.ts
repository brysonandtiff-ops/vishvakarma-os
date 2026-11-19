import { useEffect, useState } from 'react';
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
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return undefined;
    const synth = window.speechSynthesis;
    const refresh = () => setVoices(availableEnglishVoices(synth.getVoices()));
    refresh();
    const first = window.setTimeout(refresh, 250);
    const second = window.setTimeout(refresh, 1000);
    synth.addEventListener?.('voiceschanged', refresh);
    return () => {
      synth.removeEventListener?.('voiceschanged', refresh);
      window.clearTimeout(first);
      window.clearTimeout(second);
    };
  }, []);

  useEffect(() => {
    const sync = () => setSettings(readNarrationPreferences());
    window.addEventListener(NARRATION_PREFS_EVENT, sync);
    return () => window.removeEventListener(NARRATION_PREFS_EVENT, sync);
  }, []);

  const updateSettings = (patch: Partial<NarrationPreferences>) => {
    setSettings((previous) => {
      const updated = { ...previous, ...patch };
      saveNarrationPreferences(updated);
      return updated;
    });
  };

  return { voices, settings, updateSettings };
}
