export const VISUAL_THEME_STORAGE_KEY = 'vish.visualTheme';

export const VISUAL_THEMES = [
  {
    id: 'midnight-obsidian',
    label: 'Midnight Obsidian',
    shortLabel: 'Obsidian',
    description: 'Deep obsidian backdrop with high-contrast architectural geometry.',
    accentHsl: '220 15% 12%',
  },
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
  {
    id: 'vibhuti-obsidian',
    label: 'Vibhuti Obsidian',
    shortLabel: 'Vibhuti',
    description: 'Obsidian glassmorphism with golden accents and neon Prana glow.',
    accentHsl: '43 74% 58%',
  },
  {
    id: 'industrial-slate',
    label: 'Industrial Slate',
    shortLabel: 'Slate',
    description: 'Cool gray industrial drafting aesthetic.',
    accentHsl: '210 10% 25%',
  },
  {
    id: 'indigo-cyanotype',
    label: 'Indigo Cyanotype',
    shortLabel: 'Cyanotype',
    description: 'Classic blue-white blueprint aesthetic.',
    accentHsl: '215 80% 30%',
  },
  {
    id: 'aged-copper',
    label: 'Aged Copper',
    shortLabel: 'Copper',
    description: 'Warm, oxidized copper architectural tones.',
    accentHsl: '15 40% 40%',
  },
  {
    id: 'sacred-parchment',
    label: 'Sacred Parchment',
    shortLabel: 'Parchment',
    description: 'Warm cream paper with deep sepia ink.',
    accentHsl: '35 40% 75%',
  },
] as const;

export type VisualThemeId = (typeof VISUAL_THEMES)[number]['id'];

export const DEFAULT_VISUAL_THEME: VisualThemeId = 'midnight-obsidian';

export function isVisualThemeId(value: unknown): value is VisualThemeId {
  return typeof value === 'string' && VISUAL_THEMES.some((theme) => theme.id === value);
}
