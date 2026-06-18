export const VISUAL_THEME_STORAGE_KEY = 'vish.visualTheme';

export const VISUAL_THEMES = [
  {
    id: 'vishvakarma-gold',
    label: 'Vishvakarma Gold',
    shortLabel: 'Gold',
    description: 'Default professional drafting identity.',
    accentHsl: '43 65% 52%',
  },
  {
    id: 'solar-mandala',
    label: 'Solar Mandala',
    shortLabel: 'Solar',
    description: 'Alternate presentation-only visual identity.',
    accentHsl: '186 66% 45%',
  },
] as const;

export type VisualThemeId = (typeof VISUAL_THEMES)[number]['id'];

export const DEFAULT_VISUAL_THEME: VisualThemeId = 'vishvakarma-gold';

export function isVisualThemeId(value: unknown): value is VisualThemeId {
  return typeof value === 'string' && VISUAL_THEMES.some((theme) => theme.id === value);
}
