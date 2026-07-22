// Official Vishvakarma.OS logo — served from public/brand/vishvakarma-official-logo.svg.
// This is the user-supplied gold swan / V mark and is the single source of truth
// for in-app brand surfaces, favicons, touch icons, and PWA metadata.
export const OFFICIAL_LOGO_SRC = '/brand/vishvakarma-official-logo.svg';

export const OFFICIAL_LOGO_FAVICON_SRC = '/brand/vishvakarma-official-logo.svg';

/** Optional owner-supplied wing-flap frames (same artwork, aligned crop). Empty → CSS pseudo-flap fallback. */
export const COPILOT_SWAN_FLAP_FRAMES: readonly string[] = [
  // '/brand/copilot-swan-flap-1.webp',
  // '/brand/copilot-swan-flap-2.webp',
  // '/brand/copilot-swan-flap-3.webp',
];

export function hasCopilotSwanFlapFrames(): boolean {
  return COPILOT_SWAN_FLAP_FRAMES.length >= 2;
}
