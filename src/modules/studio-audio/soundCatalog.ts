export type StudioSoundId =
  | 'toolSelect'
  | 'buttonPress'
  | 'fixSuccess'
  | 'fixPartial'
  | 'botScan'
  | 'botAttention'
  | 'toastSuccess'
  | 'toastError'
  | 'wallPlace'
  | 'panelOpen'
  | 'resonance432'
  | 'resonance528';

export interface SoundSpec {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  attack?: number;
  decay?: number;
  detune?: number;
}

export const SOUND_CATALOG: Record<StudioSoundId, SoundSpec> = {
  toolSelect: { frequency: 620, duration: 0.06, type: 'sine', gain: 0.08, attack: 0.004, decay: 0.05 },
  buttonPress: { frequency: 440, duration: 0.05, type: 'triangle', gain: 0.07, attack: 0.003, decay: 0.04 },
  fixSuccess: { frequency: 880, duration: 0.18, type: 'sine', gain: 0.1, attack: 0.01, decay: 0.14, detune: 4 },
  fixPartial: { frequency: 660, duration: 0.12, type: 'sine', gain: 0.08, attack: 0.008, decay: 0.1 },
  botScan: { frequency: 520, duration: 0.09, type: 'sine', gain: 0.06, attack: 0.006, decay: 0.08 },
  botAttention: { frequency: 740, duration: 0.11, type: 'triangle', gain: 0.07, attack: 0.006, decay: 0.09 },
  toastSuccess: { frequency: 784, duration: 0.1, type: 'sine', gain: 0.07, attack: 0.006, decay: 0.08 },
  toastError: { frequency: 220, duration: 0.14, type: 'sawtooth', gain: 0.05, attack: 0.004, decay: 0.12 },
  wallPlace: { frequency: 310, duration: 0.07, type: 'triangle', gain: 0.05, attack: 0.004, decay: 0.06 },
  panelOpen: { frequency: 560, duration: 0.08, type: 'sine', gain: 0.06, attack: 0.005, decay: 0.07 },
  resonance432: { frequency: 432, duration: 0.25, type: 'sine', gain: 0.15, attack: 0.02, decay: 0.23, detune: 2 },
  resonance528: { frequency: 528, duration: 0.3, type: 'sine', gain: 0.15, attack: 0.02, decay: 0.28, detune: 2 },
};
