/** S.I.R.E. Voice Quality: owner-controlled, device-native narration.
 * Voices are from the visitor's browser. We never claim to supply a studio-quality
 * voice or upload the speaker's text/audio to an external model.
 */
export type VoiceCandidate = Pick<SpeechSynthesisVoice, 'name' | 'voiceURI' | 'lang' | 'localService'>;
export type NarrationPreferences = {
  voiceURI: string;
  rate: number;
};

export const NARRATION_PREFS_KEY = 'vishvakarma.os.voice-prefs.v2';
export const NARRATION_PREFS_EVENT = 'vish:voice-prefs-updated';
export const DEFAULT_NARRATION_PREFERENCES: NarrationPreferences = {
  voiceURI: '',
  rate: 0.98,
};

export function availableEnglishVoices<T extends VoiceCandidate>(voices: readonly T[]): T[] {
  return voices.filter((voice) => /^en(?:[-_]|$)/i.test(voice.lang));
}

export function isKnownRoboticVoice(voice: VoiceCandidate): boolean {
  return /espeak|festival|robotic|compact|synthetic/i.test(voice.name);
}

export function rankNarrationVoice(voice: VoiceCandidate): number {
  const lang = voice.lang.toLowerCase().replace('_', '-');
  const label = voice.name.toLowerCase();
  if (isKnownRoboticVoice(voice)) return -1000;
  const accent = lang === 'en-au' ? 120 : lang === 'en-nz' ? 100
    : lang === 'en-gb' ? 80 : lang === 'en-us' ? 65 : lang.startsWith('en') ? 45 : 0;
  const qualityHint = /enhanced|premium|natural|neural|siri/.test(label) ? 40
    : /karen|moira|daniel|serena|samantha/.test(label) ? 12 : 0;
  return accent + qualityHint + (voice.localService ? 10 : 0);
}

export function selectNarrationVoice<T extends VoiceCandidate>(
  voices: readonly T[],
  preference = '',
): T | null {
  const english = availableEnglishVoices(voices);
  if (!english.length) return null;
  if (preference) {
    const selected = english.find((voice) => voice.voiceURI === preference);
    if (selected) return selected;
  }
  return [...english].sort((a, b) => rankNarrationVoice(b) - rankNarrationVoice(a))[0];
}

export function clampNarrationRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_NARRATION_PREFERENCES.rate;
  return Math.min(1.12, Math.max(0.86, rate));
}

export function readNarrationPreferences(): NarrationPreferences {
  try {
    const raw = window.localStorage.getItem(NARRATION_PREFS_KEY);
    if (!raw) return { ...DEFAULT_NARRATION_PREFERENCES };
    const data = JSON.parse(raw) as Partial<NarrationPreferences>;
    return {
      voiceURI: typeof data.voiceURI === 'string' ? data.voiceURI : '',
      rate: clampNarrationRate(typeof data.rate === 'number' ? data.rate : 0.98),
    };
  } catch {
    return { ...DEFAULT_NARRATION_PREFERENCES };
  }
}

export function saveNarrationPreferences(settings: NarrationPreferences): void {
  if (typeof window === 'undefined') return;
  const normalized: NarrationPreferences = {
    voiceURI: settings.voiceURI,
    rate: clampNarrationRate(settings.rate),
  };
  try {
    window.localStorage.setItem(NARRATION_PREFS_KEY, JSON.stringify(normalized));
  } catch {
    // Safari private browsing may deny storage. Keep both mounted tour UIs in sync.
  }
  window.dispatchEvent(new CustomEvent<NarrationPreferences>(NARRATION_PREFS_EVENT, { detail: normalized }));
}

export function spokenNarrationText(text: string): string {
  return text
    .replace(/Vishvakarma\.OS/gi, 'Vishvakarma O S')
    .replace(/\b3D\b/g, 'three D')
    .replace(/\b2D\b/g, 'two D')
    .replace(/\bS\.I\.R\.E\./gi, 'Sire');
}

export function createNarrationUtterance(
  text: string,
  voices: readonly SpeechSynthesisVoice[],
  settings: NarrationPreferences,
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(spokenNarrationText(text));
  const selected = selectNarrationVoice(voices, settings.voiceURI);
  if (selected) utterance.voice = selected;
  utterance.lang = selected?.lang || 'en-AU';
  utterance.rate = clampNarrationRate(settings.rate);
  utterance.pitch = 1; // natural device voice, not forced artificially low
  utterance.volume = 0.95;
  return utterance;
}

export const NARRATION_VOICE_SAMPLE =
  'Welcome to Vishvakarma O S. Your dream home begins with a simple sketch. Take your time and enjoy creating.';
