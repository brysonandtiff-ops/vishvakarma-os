/**
 * Canonical 2D canvas + 3D atmosphere palette — mirrors BRAND_LOCK / vish-theme.css workstation tokens.
 * Use these in imperative draw calls (Canvas 2D, Three.js) where CSS variables are unavailable.
 */

/** Blueprint paper surface — matches --ws-canvas-surface (#FDF9F5) */
export const CANVAS_PAPER = '#FDF9F5';
/** Slightly warmer paper fill for canvas buffer */
export const CANVAS_PAPER_FILL = '#F5F1E8';

/** Grid lines */
export const GRID_MINOR = 'rgba(212, 207, 196, 0.55)';
export const GRID_MAJOR = 'rgba(184, 148, 31, 0.28)';

/** Wall depth shadow (subtle ink offset) */
export const WALL_SHADOW = 'rgba(44, 28, 16, 0.18)';

/** Architectural ink + gold selection — matches --ws-active family */
export const INK = '#2C2C2C';
export const INK_LABEL = '#2c1810';
export const GOLD = '#B8941F';
export const GOLD_BRIGHT = '#CF9B3A';
export const GOLD_LIGHT = '#D4AF37';
export const GOLD_MUTED = '#b48c3c';
export const GOLD_HOVER = 'rgba(184, 148, 31, 0.3)';
export const GOLD_PREVIEW = 'rgba(184, 148, 31, 0.6)';
export const GOLD_GLOW = 'rgba(212, 175, 55, 0.45)';
export const GOLD_GLOW_SOFT = 'rgba(212, 175, 55, 0.25)';

/** Label / dimension chips */
export const CHIP_FILL = '#F9F6F0';
export const CHIP_FILL_ALPHA = 'rgba(249, 246, 240, 0.95)';
export const CHIP_FILL_PREVIEW = 'rgba(249, 246, 240, 0.85)';
export const CHIP_STROKE = '#F5F1E8';

/** Openings */
export const DOOR = '#C85A54';
export const DOOR_GHOST = 'rgba(200, 90, 84, 0.4)';
export const WINDOW = '#C8963A';
export const WINDOW_GHOST = 'rgba(200, 150, 58, 0.4)';

/** Rooms */
export const ROOM_FILL = 'rgba(180, 140, 60, 0.12)';
export const ROOM_STROKE = 'rgba(180, 140, 60, 0.45)';
export const ROOM_LABEL = '#6b4f2a';

/** MEP — muted architectural tones (distinct, warm palette) */
export const MEP_COLORS = {
  outlet: '#8B6914',
  switch: '#B8941F',
  hvac: '#6B5B4A',
  panel: '#5C4B2A',
} as const;

/** Fixtures / lighting symbols */
export const FIXTURE_STROKE = '#5c4b2a';
export const FIXTURE_LABEL = '#3d2914';
export const FIXTURE_MEP_STROKE = '#1f2937';
export const FIXTURE_MEP_LABEL = '#ffffff';

/** Furniture materials */
export const WOOD = '#6b4f3a';
export const WOOD_DARK = '#4a3528';
export const WOOD_LIGHT = '#8B6914';
export const FABRIC = '#4a5568';
export const FABRIC_LIGHT = '#718096';

/** Compass / vastu overlay */
export const COMPASS_STROKE = 'rgba(180, 140, 60, 0.8)';
export const COMPASS_FILL = 'rgba(180, 140, 60, 0.08)';

/** 3D atmosphere */
export const ATMOSPHERE = {
  background: '#14100A',
  fog: '#17120A',
  particle: '#F4C34F',
  godRay: '#F5D76A',
  sun: '#FFE3A3',
  fillWarm: '#F2C45A',
  accentWarm: '#D99B25',
  accentCool: '#7A4B10',
  gridPrimary: '#C99A27',
  gridSecondary: '#5C4B2A',
  leaf: '#388e3c',
  bark: '#5c3d1e',
} as const;

/** Grid spacing aligned with CSS blueprint-grid (20px minor, 100px major) */
export const GRID_MINOR_PX = 20;
export const GRID_MAJOR_FACTOR = 5;
