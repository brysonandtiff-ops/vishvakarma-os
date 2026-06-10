import { describe, expect, it } from 'vitest';
import { resolveAuthWinner, type AuthCapabilitiesManifest } from '@/backend/authCapabilities';

describe('authCapabilities', () => {
  const googleWinnerManifest: AuthCapabilitiesManifest = {
    testedAt: '2026-06-10T00:00:00.000Z',
    deploymentUrl: 'https://vishvakarma-os.vercel.app',
    emailLink: { config: true, liveSend: false },
    google: { config: true, liveSignIn: true },
    winner: 'google',
  };

  it('prefers build-time winner override when set', () => {
    expect(resolveAuthWinner(googleWinnerManifest, 'email')).toBe('email');
  });

  it('falls back to manifest winner when no build override exists', () => {
    expect(resolveAuthWinner(googleWinnerManifest, null)).toBe('google');
  });

  it('returns none when manifest is missing and no override exists', () => {
    expect(resolveAuthWinner(null, null)).toBe('none');
  });
});
