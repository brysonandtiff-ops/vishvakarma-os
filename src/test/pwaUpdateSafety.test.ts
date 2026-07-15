import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPwaReloadBlocker,
  getPwaUpdateState,
  markPwaUpdatePending,
  resetPwaUpdateSafetyForTests,
  setPwaReloadBlocker,
} from '@/pwaUpdateSafety';

describe('PWA update safety state', () => {
  beforeEach(() => resetPwaUpdateSafetyForTests());

  it('tracks reload blockers independently', () => {
    setPwaReloadBlocker('editor', true);
    setPwaReloadBlocker('dialog', true);
    expect(getPwaUpdateState()).toEqual({ pending: false, blocked: true });

    clearPwaReloadBlocker('editor');
    expect(getPwaUpdateState().blocked).toBe(true);

    clearPwaReloadBlocker('dialog');
    expect(getPwaUpdateState().blocked).toBe(false);
  });

  it('retains a pending update until the user explicitly activates it', () => {
    setPwaReloadBlocker('editor', true);
    markPwaUpdatePending();

    expect(getPwaUpdateState()).toEqual({ pending: true, blocked: true });
    clearPwaReloadBlocker('editor');
    expect(getPwaUpdateState()).toEqual({ pending: true, blocked: false });
  });

  it('emits state changes for UI subscribers', () => {
    const listener = vi.fn();
    window.addEventListener('vish:pwa-update-state', listener);

    setPwaReloadBlocker('editor', true);
    markPwaUpdatePending();

    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener('vish:pwa-update-state', listener);
  });

  it('rejects unnamed blockers', () => {
    expect(() => setPwaReloadBlocker('  ', true)).toThrow(
      'PWA reload blocker id is required',
    );
  });
});
