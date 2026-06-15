import { loadStudioAudioPrefs, prefersReducedMotion } from '@/modules/studio-audio/audioPrefs';
import { SOUND_CATALOG, type StudioSoundId } from '@/modules/studio-audio/soundCatalog';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;
let lastWallPlaceAt = 0;

function ensureContext(): { ctx: AudioContext; masterGain: GainNode } | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    audioContext = new Ctx();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    applyMasterVolume();
  }
  if (!masterGain) return null;
  return { ctx: audioContext, masterGain };
}

function applyMasterVolume(): void {
  if (!masterGain) return;
  const prefs = loadStudioAudioPrefs();
  masterGain.gain.value = prefs.masterVolume;
}

export function getSharedAudioNodes(): { ctx: AudioContext; masterGain: GainNode } | null {
  return ensureContext();
}

export async function unlockStudioAudio(): Promise<void> {
  const nodes = ensureContext();
  if (!nodes || unlocked) return;
  if (nodes.ctx.state === 'suspended') {
    await nodes.ctx.resume();
  }
  unlocked = true;
}

export function playStudioSound(id: StudioSoundId): void {
  const prefs = loadStudioAudioPrefs();
  if (!prefs.sfxEnabled || prefersReducedMotion()) return;

  if (id === 'wallPlace') {
    const now = performance.now();
    if (now - lastWallPlaceAt < 120) return;
    lastWallPlaceAt = now;
  }

  const nodes = ensureContext();
  if (!nodes) return;

  applyMasterVolume();

  if (nodes.ctx.state === 'suspended') {
    void nodes.ctx.resume();
  }

  const spec = SOUND_CATALOG[id];
  const osc = nodes.ctx.createOscillator();
  const gain = nodes.ctx.createGain();
  const now = nodes.ctx.currentTime;
  const attack = spec.attack ?? 0.005;
  const decay = spec.decay ?? spec.duration;

  osc.type = spec.type;
  osc.frequency.setValueAtTime(spec.frequency, now);
  if (spec.detune) osc.detune.setValueAtTime(spec.detune, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(spec.gain, 0.0001), now + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  osc.connect(gain);
  gain.connect(nodes.masterGain);
  osc.start(now);
  osc.stop(now + spec.duration + 0.02);
}

export function resetStudioAudioForTests(): void {
  audioContext = null;
  masterGain = null;
  unlocked = false;
  lastWallPlaceAt = 0;
}
