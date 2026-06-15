import { describe, expect, it } from 'vitest';
import {
  canExportCastEvidence,
  canStartCast,
  canUseCastLenses,
  canUseRoleScopedInvites,
  castMaxViewers,
} from '@/cast/castTier';

describe('castTier', () => {
  it('allows Studio to start cast and use lenses', () => {
    expect(canStartCast('studio')).toBe(true);
    expect(canUseCastLenses('studio')).toBe(true);
    expect(castMaxViewers('studio')).toBe(3);
    expect(canUseRoleScopedInvites('studio')).toBe(false);
    expect(canExportCastEvidence('studio')).toBe(false);
  });

  it('grants Enterprise cast extras', () => {
    expect(canStartCast('enterprise')).toBe(true);
    expect(castMaxViewers('enterprise')).toBe(999);
    expect(canUseRoleScopedInvites('enterprise')).toBe(true);
    expect(canExportCastEvidence('enterprise')).toBe(true);
  });

  it('blocks Starter from casting', () => {
    expect(canStartCast('starter')).toBe(false);
  });
});
