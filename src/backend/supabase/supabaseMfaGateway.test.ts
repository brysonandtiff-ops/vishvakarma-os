import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  enrollTotpFactor,
  getMfaStatus,
  unenrollTotpFactor,
  verifyTotpFactor,
} from '@/backend/supabase/supabaseMfaGateway';

const mocks = vi.hoisted(() => ({
  getAuthenticatorAssuranceLevel: vi.fn(),
  listFactors: vi.fn(),
  enroll: vi.fn(),
  challengeAndVerify: vi.fn(),
  unenroll: vi.fn(),
}));

vi.mock('@/backend/supabase/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: { mfa: mocks } }),
}));

describe('Supabase TOTP MFA gateway', () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockReset();
  });

  it('returns only verified TOTP factors and assurance levels', async () => {
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: 'aal1', nextLevel: 'aal2' },
      error: null,
    });
    mocks.listFactors.mockResolvedValue({
      data: {
        all: [
          { id: 'verified', factor_type: 'totp', status: 'verified', friendly_name: 'Work phone' },
          { id: 'pending', factor_type: 'totp', status: 'unverified' },
          { id: 'phone', factor_type: 'phone', status: 'verified' },
        ],
      },
      error: null,
    });

    await expect(getMfaStatus()).resolves.toEqual({
      currentLevel: 'aal1',
      nextLevel: 'aal2',
      verifiedTotpFactors: [
        { id: 'verified', friendlyName: 'Work phone', status: 'verified' },
      ],
    });
  });

  it('normalizes enrollment data', async () => {
    mocks.enroll.mockResolvedValue({
      data: {
        id: 'factor-1',
        totp: {
          qr_code: 'data:image/svg+xml;base64,abc',
          secret: 'SECRET',
          uri: 'otpauth://totp/Vishvakarma',
        },
      },
      error: null,
    });

    await expect(enrollTotpFactor('Primary')).resolves.toEqual({
      factorId: 'factor-1',
      qrCode: 'data:image/svg+xml;base64,abc',
      secret: 'SECRET',
      uri: 'otpauth://totp/Vishvakarma',
    });
    expect(mocks.enroll).toHaveBeenCalledWith({
      factorType: 'totp',
      friendlyName: 'Primary',
    });
  });

  it('validates and verifies a six digit code', async () => {
    mocks.challengeAndVerify.mockResolvedValue({ data: {}, error: null });

    await verifyTotpFactor('factor-1', ' 123 456 ');
    expect(mocks.challengeAndVerify).toHaveBeenCalledWith({
      factorId: 'factor-1',
      code: '123456',
    });

    await expect(verifyTotpFactor('factor-1', '12ab')).rejects.toThrow(
      '6-digit code',
    );
  });

  it('unenrolls the selected factor', async () => {
    mocks.unenroll.mockResolvedValue({ data: {}, error: null });
    await unenrollTotpFactor('factor-1');
    expect(mocks.unenroll).toHaveBeenCalledWith({ factorId: 'factor-1' });
  });
});
