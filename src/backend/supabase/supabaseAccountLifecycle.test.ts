import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MIN_ACCOUNT_PASSWORD_LENGTH,
  createSupabaseAccount,
  getSupabaseRecoverySession,
  sendSupabasePasswordRecovery,
  signOutAfterPasswordRecovery,
  updateSupabaseAccountPassword,
  validateAccountPassword,
} from '@/backend/supabase/supabaseAccountLifecycle';

const signUp = vi.fn();
const resetPasswordForEmail = vi.fn();
const getSession = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();

vi.mock('@/backend/supabase/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: {
      signUp,
      resetPasswordForEmail,
      getSession,
      updateUser,
      signOut,
    },
  }),
}));

describe('Supabase account lifecycle', () => {
  beforeEach(() => {
    signUp.mockReset();
    resetPasswordForEmail.mockReset();
    getSession.mockReset();
    updateUser.mockReset();
    signOut.mockReset();
    signUp.mockResolvedValue({
      data: { session: null, user: { id: 'user-1' } },
      error: null,
    });
    resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    getSession.mockResolvedValue({
      data: { session: { access_token: 'verified' } },
      error: null,
    });
    updateUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    signOut.mockResolvedValue({ error: null });
  });

  it('enforces a strong password before contacting Supabase', () => {
    expect(MIN_ACCOUNT_PASSWORD_LENGTH).toBeGreaterThanOrEqual(12);
    expect(validateAccountPassword('short')).toContain('at least');
    expect(validateAccountPassword('alllowercase123')).toContain('uppercase');
    expect(validateAccountPassword('ALLUPPERCASE123')).toContain('lowercase');
    expect(validateAccountPassword('NoNumbersHere')).toContain('number');
    expect(validateAccountPassword('StrongPassword123')).toBeNull();
  });

  it('creates a confirmed-email account request with a trusted redirect', async () => {
    const result = await createSupabaseAccount(
      ' Architect@Firm.com ',
      'StrongPassword123',
      'https://vishvakarma-os.pages.dev/auth?confirmed=1',
    );

    expect(signUp).toHaveBeenCalledWith({
      email: 'architect@firm.com',
      password: 'StrongPassword123',
      options: {
        emailRedirectTo: 'https://vishvakarma-os.pages.dev/auth?confirmed=1',
      },
    });
    expect(result.needsEmailConfirmation).toBe(true);
  });

  it('sends recovery to the public reset route', async () => {
    await sendSupabasePasswordRecovery(
      ' Architect@Firm.com ',
      'https://vishvakarma-os.pages.dev/reset-password',
    );

    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'architect@firm.com',
      { redirectTo: 'https://vishvakarma-os.pages.dev/reset-password' },
    );
  });

  it('returns the verified recovery session', async () => {
    await expect(getSupabaseRecoverySession()).resolves.toEqual({
      access_token: 'verified',
    });
  });

  it('updates the password only when a Supabase session exists', async () => {
    await updateSupabaseAccountPassword('StrongerPassword456');
    expect(updateUser).toHaveBeenCalledWith({ password: 'StrongerPassword456' });

    getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
    await expect(
      updateSupabaseAccountPassword('StrongerPassword456'),
    ).rejects.toThrow('recovery link');
  });

  it('signs out after a completed password recovery', async () => {
    await signOutAfterPasswordRecovery();
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
