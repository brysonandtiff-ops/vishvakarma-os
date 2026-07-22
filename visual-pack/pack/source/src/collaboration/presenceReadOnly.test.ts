import { describe, expect, it, vi } from 'vitest';
import {
  COLLAB_READ_ONLY_LABEL,
  collabPresenceModeLabel,
  isCollabReadOnlyMode,
} from '@/collaboration/presenceReadOnly';

describe('collaboration presenceReadOnly (RFC 007 P0)', () => {
  it('defaults to read-only preview mode', () => {
    expect(isCollabReadOnlyMode()).toBe(true);
    expect(collabPresenceModeLabel()).toBe(COLLAB_READ_ONLY_LABEL);
  });

  it('allows write mode when VITE_COLLAB_WRITE is set', () => {
    vi.stubEnv('VITE_COLLAB_WRITE', '1');
    expect(isCollabReadOnlyMode()).toBe(false);
    expect(collabPresenceModeLabel()).toContain('Live sync');
    vi.unstubAllEnvs();
  });
});
