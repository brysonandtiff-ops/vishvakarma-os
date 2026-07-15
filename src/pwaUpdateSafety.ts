export const PWA_UPDATE_STATE_EVENT = 'vish:pwa-update-state';

export type PwaUpdateState = {
  pending: boolean;
  blocked: boolean;
};

const blockers = new Set<string>();
let updatePending = false;

function emitState() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<PwaUpdateState>(PWA_UPDATE_STATE_EVENT, {
      detail: getPwaUpdateState(),
    }),
  );
}

export function getPwaUpdateState(): PwaUpdateState {
  return {
    pending: updatePending,
    blocked: blockers.size > 0,
  };
}

export function setPwaReloadBlocker(id: string, blocked: boolean) {
  const normalized = id.trim();
  if (!normalized) throw new Error('PWA reload blocker id is required.');

  const changed = blocked ? !blockers.has(normalized) : blockers.has(normalized);
  if (blocked) blockers.add(normalized);
  else blockers.delete(normalized);
  if (changed) emitState();
}

export function clearPwaReloadBlocker(id: string) {
  setPwaReloadBlocker(id, false);
}

export function isPwaReloadBlocked() {
  return blockers.size > 0;
}

export function markPwaUpdatePending() {
  if (updatePending) return;
  updatePending = true;
  emitState();
}

export function clearPwaUpdatePending() {
  if (!updatePending) return;
  updatePending = false;
  emitState();
}

export function resetPwaUpdateSafetyForTests() {
  blockers.clear();
  updatePending = false;
  emitState();
}
