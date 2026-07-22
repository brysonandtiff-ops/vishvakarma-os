import { DEFAULT_LAYER_VISIBILITY, type EditorLayerVisibility } from '@/types';
import type { CastLensState } from '@/cast/types';

export const DEFAULT_CAST_LENSES: CastLensState = {
  thermal: false,
  vayu: false,
  vastu: false,
  mep: false,
  compliance: false,
  panchatattva: false,
  layers: { ...DEFAULT_LAYER_VISIBILITY },
};

export function mergeCastLenses(
  current: CastLensState,
  patch: Partial<CastLensState>
): CastLensState {
  return {
    ...current,
    ...patch,
    layers: {
      ...current.layers,
      ...(patch.layers ?? {}),
    },
  };
}

export function toggleCastLens(current: CastLensState, key: keyof Omit<CastLensState, 'layers'>): CastLensState {
  return { ...current, [key]: !current[key] };
}

export function activeLensLabels(lenses: CastLensState): string[] {
  const labels: string[] = [];
  if (lenses.thermal) labels.push('Thermal');
  if (lenses.vayu) labels.push('Vayu CFD');
  if (lenses.vastu) labels.push('Vastu');
  if (lenses.mep) labels.push('MEP');
  if (lenses.compliance) labels.push('Compliance');
  if (lenses.panchatattva) labels.push('Panchatattva');
  return labels;
}

export function parseLensStateFromDb(value: unknown): CastLensState {
  if (!value || typeof value !== 'object') return { ...DEFAULT_CAST_LENSES };
  const raw = value as Partial<CastLensState>;
  return mergeCastLenses(DEFAULT_CAST_LENSES, {
    thermal: Boolean(raw.thermal),
    vayu: Boolean(raw.vayu),
    vastu: Boolean(raw.vastu),
    mep: Boolean(raw.mep),
    compliance: Boolean(raw.compliance),
    panchatattva: Boolean(raw.panchatattva),
    layers: {
      ...DEFAULT_LAYER_VISIBILITY,
      ...(raw.layers as Partial<EditorLayerVisibility> | undefined),
    },
  });
}
