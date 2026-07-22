import { getSharedAudioNodes } from './audioEngine';

let rainSource: AudioBufferSourceNode | null = null;
let droneOsc: OscillatorNode | null = null;
let atmosphericGainNode: GainNode | null = null;
let isAtmospherePlaying = false;

// Create white noise buffer
function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function playMonsoonJali(): void {
  const nodes = getSharedAudioNodes();
  if (!nodes || isAtmospherePlaying) return;

  const { ctx, masterGain } = nodes;

  if (ctx.state === 'suspended') {
    void ctx.resume();
  }

  // Create gain node for crossfading
  atmosphericGainNode = ctx.createGain();
  atmosphericGainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
  atmosphericGainNode.connect(masterGain);

  // 1. Rain Synthesizer (White noise with low pass filter)
  const noiseBuffer = createNoiseBuffer(ctx);
  rainSource = ctx.createBufferSource();
  rainSource.buffer = noiseBuffer;
  rainSource.loop = true;

  const lowpassFilter = ctx.createBiquadFilter();
  lowpassFilter.type = 'lowpass';
  lowpassFilter.frequency.setValueAtTime(450, ctx.currentTime); // Muffled rain sound

  rainSource.connect(lowpassFilter);
  lowpassFilter.connect(atmosphericGainNode);

  // 2. 432Hz sine wave drone
  droneOsc = ctx.createOscillator();
  droneOsc.type = 'sine';
  droneOsc.frequency.setValueAtTime(432, ctx.currentTime);

  const droneGain = ctx.createGain();
  droneGain.gain.setValueAtTime(0.12, ctx.currentTime); // Keep drone subtle

  droneOsc.connect(droneGain);
  droneGain.connect(atmosphericGainNode);

  // Start both
  rainSource.start(0);
  droneOsc.start(0);

  // Fade-in
  const now = ctx.currentTime;
  atmosphericGainNode.gain.exponentialRampToValueAtTime(0.35, now + 2.0); // 2 second fade in
  isAtmospherePlaying = true;
}

export function stopMonsoonJali(): void {
  if (!isAtmospherePlaying || !atmosphericGainNode) return;

  const nodes = getSharedAudioNodes();
  if (!nodes) return;
  const { ctx } = nodes;

  // Fade-out
  const fadeOutTime = 2.0;
  atmosphericGainNode.gain.cancelScheduledValues(ctx.currentTime);
  atmosphericGainNode.gain.setValueAtTime(Math.max(atmosphericGainNode.gain.value, 0.0001), ctx.currentTime);
  atmosphericGainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + fadeOutTime);

  const sourceToStop = rainSource;
  const oscToStop = droneOsc;
  const gainToDisconnect = atmosphericGainNode;

  setTimeout(() => {
    try {
      sourceToStop?.stop();
      oscToStop?.stop();
      gainToDisconnect?.disconnect();
    } catch (e) {
      // ignore
    }
  }, fadeOutTime * 1000 + 100);

  rainSource = null;
  droneOsc = null;
  atmosphericGainNode = null;
  isAtmospherePlaying = false;
}

export function isMonsoonJaliPlaying(): boolean {
  return isAtmospherePlaying;
}
