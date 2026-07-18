import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import {
  buildSupabaseSessionFromAuthSession,
  completeSupabaseEmailLinkSignIn,
  hydrateSupabaseAuthSession,
  requestSupabaseAccessLink,
  requestSupabasePasswordReset,
  signInWithPasswordSupabase,
  SUPPORTED_AUTH_MESSAGE,
} from '@/backend/supabase/supabaseAuthGateway';

const getSession = vi.fn();
const signOut = vi.fn();
const signInWithOtp = vi.fn();
const verifyOtp = vi.fn();

vi.mock('@/backend/supabase/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession,
      signOut,
      signInWithOtp,
      verifyOtp,
    },
  }),
}));

function authUser(provider: string): User {
  return {
    id: 'user-1',
    email: 'architect@firm.com',
    app_metadata: { provider, providers: [provider] },
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2026-07-11T00:00:00.000Z',
    identities: [{ provider }],
  } as User;
}

function authSession(provider: string): Session {
  return {
    access_token: 'sdk-access-token',
    refresh_token: 'sdk-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: authUser(provider),
  } as Session;
}

describe('Supabase production auth policy', () => {
  beforeEach(() => {
    getSession.mockReset();
    signOut.mockReset();
    signInWithOtp.mockReset();
    verifyOtp.mockReset();
    signOut.mockResolvedValue({ error: null });
    signInWithOtp.mockResolvedValue({ data: { user: null, session: null }, error: null });
    localStorage.clear();
    window.history.replaceState({}, '', '/auth');
  });

  it.each(['google', 'email'])(
    'builds non-sensitive metadata for an approved %s session',
    async (provider) => {
      const snapshot = await buildSupabaseSessionFromAuthSession(
        authSession(provider),
        authUser(provider),
      );

      expect(snapshot).toMatchObject({
        provider: 'supabase',
        authProvider: provider,
        uid: 'user-1',
        email: 'architect@firm.com',
      });
      expect(snapshot).not.toHaveProperty('idToken');
      expect(snapshot).not.toHaveProperty('refreshToken');
    },
  );

  it.each(['apple', 'github'])('rejects an unsupported provider session: %s', async (provider) => {
    await expect(
      buildSupabaseSessionFromAuthSession(authSession(provider), authUser(provider)),
    ).rejects.toThrow(SUPPORTED_AUTH_MESSAGE);
  });

  it('signs out an unsupported session discovered during hydration', async () => {
    getSession.mockResolvedValue({
      data: { session: authSession('apple') },
      error: null,
    });

    await expect(hydrateSupabaseAuthSession()).rejects.toThrow(SUPPORTED_AUTH_MESSAGE);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('keeps password and password reset disabled', async () => {
    const password = await signInWithPasswordSupabase('user@example.com', 'password');
    const reset = await requestSupabasePasswordReset(
      'user@example.com',
      'https://vishvakarma-os.app/reset-password',
    );

    expect(password.session).toBeNull();
    expect(password.error?.message).toContain('Password sign-in is disabled');
    expect(reset.error?.message).toContain('Password reset is unavailable');
  });

  it('requests an existing-account-only email magic link', async () => {
    const result = await requestSupabaseAccessLink(
      ' Architect@Firm.com ',
      'https://vishvakarma-os.app/auth',
    );

    expect(result.error).toBeNull();
    expect(signInWithOtp).toHaveBeenCalledWith({
      email: 'architect@firm.com',
      options: {
        emailRedirectTo: 'https://vishvakarma-os.app/auth',
        shouldCreateUser: false,
      },
    });
    expect(localStorage.getItem('vishvakarma.os.supabase.pendingEmail.v1')).toBe(
      'architect@firm.com',
    );
  });

  it('completes a token-hash email callback and clears pending state', async () => {
    localStorage.setItem(
      'vishvakarma.os.supabase.pendingEmail.v1',
      'architect@firm.com',
    );
    window.history.replaceState({}, '', '/auth?token_hash=secure-token-hash&type=email');
    verifyOtp.mockResolvedValue({
      data: { session: authSession('email'), user: authUser('email') },
      error: null,
    });

    const result = await completeSupabaseEmailLinkSignIn();

    expect(result).toEqual({ status: 'completed' });
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: 'secure-token-hash',
      type: 'email',
    });
    expect(
      localStorage.getItem('vishvakarma.os.supabase.pendingEmail.v1'),
    ).toBeNull();
  });

  it('fails closed when an email callback resolves to an unsupported session', async () => {
    window.history.replaceState({}, '', '/auth?token_hash=secure-token-hash&type=email');
    verifyOtp.mockResolvedValue({
      data: { session: authSession('github'), user: authUser('github') },
      error: null,
    });

    const result = await completeSupabaseEmailLinkSignIn();

    expect(result).toMatchObject({
      status: 'error',
      error: expect.objectContaining({ message: SUPPORTED_AUTH_MESSAGE }),
    });
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
