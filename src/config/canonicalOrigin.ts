/** Canonical production origin — single source of truth for auth and billing redirects. */
export const CANONICAL_ORIGIN = 'https://vishvakarma-os.app';
export const CLOUDFLARE_PAGES_ORIGIN = 'https://vishvakarma-os.pages.dev';
/** Legacy rollback origin retained only while the Cloudflare cutover is being certified. */
export const VERCEL_FALLBACK_ORIGIN = 'https://vishvakarma-os.vercel.app';
export const CANONICAL_AUTH_URL = `${CANONICAL_ORIGIN}/auth`;
export const CANONICAL_EDITOR_URL = `${CANONICAL_ORIGIN}/editor`;
