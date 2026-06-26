/**
 * Canonical 2D canvas + 3D atmosphere palette — mirrors BRAND_LOCK / vish-theme.css workstation tokens.
 * Use these in imperative draw calls (Canvas 2D, Three.js) where CSS variables are unavailable.
 */

/** Blueprint paper surface — matches --ws-canvas-surface (#FDF9F5) */
export const CANVAS_PAPER = '#FDF9F5';
/** Slightly warmer paper fill for canvas buffer */
export const CANVAS_PAPER_FILL = '#F5F1E8';

/** Grid lines — intentionally stronger so iPad testers can immediately see when grid is enabled. */
export const GRID_MINOR = 'rgba(212, 207, 196, 0.72)';
export const GRID_MAJOR = 'rgba(184, 148, 31, 0.42)';

/** Wall depth shadow (subtle ink offset) */
export const WALL_SHADOW = 'rgba(44, 28, 16, 0.18)';
/** Wall highlight pass (opposite shadow offset) */
export const WALL_HIGHLIGHT = 'rgba(44, 44, 44, 0.12)';

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
export const ROOM_STROKE_SOFT = 'rgba(180, 140, 60, 0.35)';
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
  background: '#050507',
  fog: '#050507',
  particle: '#F4C34F',
  godRay: '#F8E08A',
  sun: '#FFE3A3',
  fillWarm: '#F5D070',
  accentWarm: '#E8A820',
  accentCool: '#6A4010',
  gridPrimary: '#b48c3c', // GOLD_MUTED
  gridSecondary: '#5C4B2A',
  leaf: '#3d8b42',
  bark: '#5c3d1e',
} as const;

/** Grid spacing aligned with CSS blueprint-grid (20px minor, 100px major) */
export const GRID_MINOR_PX = 20;
export const GRID_MAJOR_FACTOR = 5;

/** Edge fade for grid lines near canvas bounds (fraction of visible span) */
export const GRID_FADE_MARGIN = 0.08;

/** Subtle paper vignette at canvas edges */
export const PAPER_VIGNETTE = 'rgba(44, 28, 16, 0.04)';

/** Canvas typography — matches architect-measurement / workstation mono */
export const CANVAS_FONT_MONO = 'bold 12px "IBM Plex Mono", "SF Mono", Monaco, monospace';
export const CANVAS_FONT_MONO_SM = 'bold 10px "IBM Plex Mono", "SF Mono", Monaco, monospace';
export const CANVAS_FONT_MONO_XS = '9px "IBM Plex Mono", "SF Mono", Monaco, monospace';
export const CANVAS_FONT_SANS = '12px system-ui, -apple-system, sans-serif';
export const CANVAS_FONT_LABEL = 'bold 11px system-ui, -apple-system, sans-serif';
export const CANVAS_FONT_COMPASS = 'bold 11px system-ui, -apple-system, sans-serif';

export interface WorldBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function gridMinorStroke(alpha: number): string {
  return `rgba(212, 207, 196, ${0.72 * alpha})`;
}

export function gridMajorStroke(alpha: number): string {
  return `rgba(184, 148, 31, ${0.42 * alpha})`;
}

export function computeVisibleGridBounds(
  canvasWidth: number,
  canvasHeight: number,
  viewport: { panX: number; panY: number; zoom: number },
): WorldBounds {
  const { panX, panY, zoom } = viewport;
  return {
    left: -panX / zoom,
    top: -panY / zoom,
    width: canvasWidth / zoom,
    height: canvasHeight / zoom,
  };
}
