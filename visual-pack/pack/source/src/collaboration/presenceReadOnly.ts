/**
 * RFC 007 P0 — read-only collaboration presence (preview).
 * Manifest subscribe + presence broadcast; local CRDT writes disabled until P1.
 */

export const COLLAB_READ_ONLY_LABEL = 'Read-only presence (preview)';

/** P0 default: presence only until co-edit ships (override with VITE_COLLAB_WRITE=1). */
export function isCollabReadOnlyMode(): boolean {
  const writeFlag = import.meta.env.VITE_COLLAB_WRITE;
  if (writeFlag === '1' || writeFlag === 'true') {
    return false;
  }
  return true;
}

export function collabPresenceModeLabel(): string {
  return isCollabReadOnlyMode() ? COLLAB_READ_ONLY_LABEL : 'Live sync (preview)';
}
