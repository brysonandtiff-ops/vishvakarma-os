import type { LightingConfig } from '@/types';

export interface LightingPreset {
  id: string;
  label: string;
  lighting: LightingConfig;
}

export const LIGHTING_PRESETS: LightingPreset[] = [
  {
    id: 'dawn',
    label: 'Dawn',
    lighting: { timeOfDay: 6.25, sunAzimuth: 78, sunElevation: 12, intensity: 0.62 },
  },
  {
    id: 'noon',
    label: 'Noon',
    lighting: { timeOfDay: 12, sunAzimuth: 180, sunElevation: 72, intensity: 1 },
  },
  {
    id: 'golden',
    label: 'Golden Hour',
    lighting: { timeOfDay: 17.5, sunAzimuth: 248, sunElevation: 18, intensity: 0.78 },
  },
  {
    id: 'dusk',
    label: 'Dusk',
    lighting: { timeOfDay: 19.25, sunAzimuth: 272, sunElevation: 6, intensity: 0.48 },
  },
  {
    id: 'night',
    label: 'Night',
    lighting: { timeOfDay: 23, sunAzimuth: 320, sunElevation: 0, intensity: 0.22 },
  },
];

/** Warm architectural sun tint derived from solar timeline */
export function resolveSunColor(timeOfDay: number, sunElevation: number): string {
  if (sunElevation <= 1 || timeOfDay < 4.5 || timeOfDay > 21.5) {
    return '#8fa8c8';
  }
  if (timeOfDay < 7.5 || timeOfDay > 16.5) {
    return '#FFB86A';
  }
  if (timeOfDay >= 10.5 && timeOfDay <= 14.5 && sunElevation > 45) {
    return '#FFF8EE';
  }
  return '#FFE3A3';
}

export function resolveAmbientIntensity(mode: string, timeOfDay: number, sunElevation: number): number {
  const nightBoost = sunElevation <= 1 || timeOfDay < 5 || timeOfDay > 21 ? 0.12 : 0;
  if (mode === 'standard') return 0.46 + nightBoost;
  if (mode === 'premium') return 0.5 + nightBoost;
  return 0.54 + nightBoost;
}
