import { loadStudioAudioPrefs, prefersReducedMotion } from '@/modules/studio-audio/audioPrefs';
import { unlockStudioAudio } from '@/modules/studio-audio/audioEngine';

let ambientNodes: {
  noise: AudioBufferSourceNode;
  drone: OscillatorNode;
  filter: BiquadFilterNode;
  gain: GainNode;
} | null = null;

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.35;
  }
  return buffer;
}

export async function startEditorAmbient(ctx: AudioContext, destination: GainNode): Promise<void> {
  if (ambientNodes) return;
  const prefs = loadStudioAudioPrefs();
  if (!prefs.ambientEnabled || prefersReducedMotion()) return;

  await unlockStudioAudio();

  const gain = ctx.createGain();
  gain.gain.value = 0.018 * prefs.masterVolume;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx);
  noise.loop = true;

  const drone = ctx.createOscillator();
  drone.type = 'sine';
  drone.frequency.value = 92;

  noise.connect(filter);
  drone.connect(filter);
  filter.connect(gain);
  gain.connect(destination);

  noise.start();
  drone.start();

  ambientNodes = { noise, drone, filter, gain };
}

export function stopEditorAmbient(): void {
  if (!ambientNodes) return;
  try {
    ambientNodes.noise.stop();
    ambientNodes.drone.stop();
  } catch {
    // already stopped
  }
  ambientNodes = null;
}

export function isEditorAmbientRunning(): boolean {
  return ambientNodes !== null;
}
