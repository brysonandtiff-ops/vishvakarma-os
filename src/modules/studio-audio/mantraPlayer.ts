/**
 * mantraPlayer.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentic mantra audio engine for Vishvakarma.OS.
 * Loads, loops, and crossfades between three sacred mantra tracks.
 * Integrates with the existing StudioAudio shared AudioContext.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getSharedAudioNodes, unlockStudioAudio } from './audioEngine';

// ── Track catalogue ──────────────────────────────────────────────────────────

export interface MantraTrack {
  id: string;
  title: string;
  subtitle: string;
  sanskrit: string;
  src: string;
}

export const MANTRA_TRACKS: MantraTrack[] = [
  {
    id: 'om-namah-shivaya',
    title: 'Om Namah Shivaya',
    subtitle: 'Bansuri · Tanpura · Tabla',
    sanskrit: 'ॐ नमः शिवाय',
    src: '/audio/mantras/om-namah-shivaya.mp3',
  },
  {
    id: 'vishvakarma-mantra',
    title: 'Vishvakarma Mantra',
    subtitle: 'Veena · Tanpura · Mridangam',
    sanskrit: 'ॐ श्री विश्वकर्मणे नमः',
    src: '/audio/mantras/vishvakarma-mantra.mp3',
  },
  {
    id: 'gayatri-ambient',
    title: 'Gayatri Ambient',
    subtitle: 'Sitar · Harmonium · Tabla',
    sanskrit: 'ॐ भूर्भुवः स्वः',
    src: '/audio/mantras/gayatri-ambient.mp3',
  },
  {
    id: 'ganesh-invocation',
    title: 'Ganesh Invocation',
    subtitle: 'Bansuri · Tabla · Tanpura',
    sanskrit: 'ॐ गं गणपतये नमः',
    src: '/audio/mantras/ganesh-invocation.mp3',
  },
  {
    id: 'saraswati-ambient',
    title: 'Saraswati Ambient',
    subtitle: 'Veena · Harmonium · Flute',
    sanskrit: 'ॐ ऐं सरस्वत्यै नमः',
    src: '/audio/mantras/saraswati-ambient.mp3',
  },
];

// ── Internal state ───────────────────────────────────────────────────────────

interface ActiveTrack {
  audio: HTMLAudioElement;
  gainNode: GainNode;
  source: MediaElementAudioSourceNode;
}

let activeTrack: ActiveTrack | null = null;
let currentTrackId: string | null = null;
let isPlaying = false;
let targetVolume = 0.45;
const FADE_DURATION_MS = 2000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function fadeGain(gainNode: GainNode, from: number, to: number, durationMs: number): void {
  const ctx = gainNode.context;
  const now = ctx.currentTime;
  gainNode.gain.cancelScheduledValues(now);
  gainNode.gain.setValueAtTime(Math.max(from, 0.0001), now);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(to, 0.0001), now + durationMs / 1000);
}

function createTrack(src: string, volume: number): ActiveTrack | null {
  const nodes = getSharedAudioNodes();
  if (!nodes) return null;

  const audio = new Audio(src);
  audio.loop = true;
  audio.crossOrigin = 'anonymous';
  audio.preload = 'auto';

  const gainNode = nodes.ctx.createGain();
  gainNode.gain.value = 0.0001;
  gainNode.connect(nodes.masterGain);

  let source: MediaElementAudioSourceNode;
  try {
    source = nodes.ctx.createMediaElementSource(audio);
    source.connect(gainNode);
  } catch {
    // Already connected (shouldn't happen with new Audio() each time)
    return null;
  }

  return { audio, gainNode, source };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Start playing a mantra track (with fade-in).
 * If a different track is already playing, crossfade to the new one.
 */
export async function playMantra(trackId: string, volume = targetVolume): Promise<void> {
  await unlockStudioAudio();

  const track = MANTRA_TRACKS.find((t) => t.id === trackId);
  if (!track) return;

  targetVolume = volume;

  // Already playing this track — just ensure it's audible
  if (currentTrackId === trackId && activeTrack && isPlaying) {
    fadeGain(activeTrack.gainNode, activeTrack.gainNode.gain.value, targetVolume, FADE_DURATION_MS);
    return;
  }

  // Fade out and destroy the old track
  if (activeTrack) {
    const old = activeTrack;
    fadeGain(old.gainNode, old.gainNode.gain.value, 0.0001, FADE_DURATION_MS);
    setTimeout(() => {
      try {
        old.audio.pause();
        old.audio.src = '';
        old.gainNode.disconnect();
      } catch {
        // ignore
      }
    }, FADE_DURATION_MS + 100);
    activeTrack = null;
  }

  // Create and start new track
  const newTrack = createTrack(track.src, volume);
  if (!newTrack) return;

  activeTrack = newTrack;
  currentTrackId = trackId;
  isPlaying = true;

  try {
    await newTrack.audio.play();
    fadeGain(newTrack.gainNode, 0.0001, targetVolume, FADE_DURATION_MS);
  } catch (err) {
    // Autoplay blocked — will resume on next user gesture
    console.warn('[MantraPlayer] Autoplay blocked, will retry on gesture:', err);
    isPlaying = false;
  }
}

/**
 * Stop the current mantra track (with fade-out).
 */
export function stopMantra(): void {
  if (!activeTrack) return;

  const old = activeTrack;
  isPlaying = false;
  currentTrackId = null;
  activeTrack = null;

  fadeGain(old.gainNode, old.gainNode.gain.value, 0.0001, FADE_DURATION_MS);
  setTimeout(() => {
    try {
      old.audio.pause();
      old.audio.src = '';
      old.gainNode.disconnect();
    } catch {
      // ignore
    }
  }, FADE_DURATION_MS + 100);
}

/**
 * Set the volume of the currently playing mantra track.
 */
export function setMantraVolume(volume: number): void {
  targetVolume = Math.min(1, Math.max(0, volume));
  if (activeTrack && isPlaying) {
    const nodes = getSharedAudioNodes();
    if (!nodes) return;
    const now = nodes.ctx.currentTime;
    activeTrack.gainNode.gain.cancelScheduledValues(now);
    activeTrack.gainNode.gain.setValueAtTime(Math.max(targetVolume, 0.0001), now);
  }
}

/**
 * Resume playback after an autoplay block (call on user gesture).
 */
export async function resumeMantraAfterGesture(): Promise<void> {
  if (!activeTrack || isPlaying) return;
  try {
    await activeTrack.audio.play();
    isPlaying = true;
    fadeGain(activeTrack.gainNode, 0.0001, targetVolume, FADE_DURATION_MS);
  } catch {
    // still blocked
  }
}

export function getMantraState(): { isPlaying: boolean; currentTrackId: string | null } {
  return { isPlaying, currentTrackId };
}
