import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Session, User } from '@supabase/supabase-js';
import {
  buildSupabaseSessionFromAuthSession,
  completeSupabaseEmailLinkSignIn,
  GOOGLE_ONLY_AUTH_MESSAGE,
  hydrateSupabaseAuthSession,
  requestSupabaseAccessLink,
  requestSupabasePasswordReset,
  signInWithPasswordSupabase,
} from '@/backend/supabase/supabaseAuthGateway';

const getSession = vi.fn();
const signOut = vi.fn();

vi.mock('@/backend/supabase/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: {
      getSession,
      signOut,
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

describe('Google-only Supabase auth policy', () => {
  beforeEach(() => {
    getSession.mockReset();
    signOut.mockReset();
    signOut.mockResolvedValue({ error: null });
    localStorage.clear();
  });

  it('builds non-sensitive metadata for a Google session', async () => {
    const snapshot = await buildSupabaseSessionFromAuthSession(
      authSession('google'),
      authUser('google'),
    );

    expect(snapshot).toMatchObject({
      provider: 'supabase',
      authProvider: 'google',
      uid: 'user-1',
      email: 'architect@firm.com',
    });
    expect(snapshot).not.toHaveProperty('idToken');
    expect(snapshot).not.toHaveProperty('refreshToken');
  });

  it.each(['email', 'apple', 'github'])(
    'rejects an unsupported provider session: %s',
    async (provider) => {
      await expect(
        buildSupabaseSessionFromAuthSession(
          authSession(provider),
          authUser(provider),
        ),
      ).rejects.toThrow(GOOGLE_ONLY_AUTH_MESSAGE);
    },
  );

  it('signs out an unsupported session discovered during hydration', async () => {
    getSession.mockResolvedValue({
      data: { session: authSession('apple') },
      error: null,
    });

    await expect(hydrateSupabaseAuthSession()).rejects.toThrow(
      GOOGLE_ONLY_AUTH_MESSAGE,
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('disables password, password reset, and magic-link entry points', async () => {
    const password = await signInWithPasswordSupabase('user@example.com', 'password');
    const reset = await requestSupabasePasswordReset(
      'user@example.com',
      'https://vishvakarma-os.app/reset-password',
    );
    const magicLink = await requestSupabaseAccessLink(
      'user@example.com',
      'https://vishvakarma-os.app/auth',
    );

    expect(password.session).toBeNull();
    expect(password.error?.message).toBe(GOOGLE_ONLY_AUTH_MESSAGE);
    expect(reset.error?.message).toBe(GOOGLE_ONLY_AUTH_MESSAGE);
    expect(magicLink.error?.message).toBe(GOOGLE_ONLY_AUTH_MESSAGE);
  });

  it('fails a legacy email-link callback closed and clears the SDK session', async () => {
    localStorage.setItem(
      'vishvakarma.os.supabase.pendingEmail.v1',
      'user@example.com',
    );

    const result = await completeSupabaseEmailLinkSignIn('user@example.com');

    expect(result).toMatchObject({
      status: 'error',
      error: expect.objectContaining({ message: GOOGLE_ONLY_AUTH_MESSAGE }),
    });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(
      localStorage.getItem('vishvakarma.os.supabase.pendingEmail.v1'),
    ).toBeNull();
  });
});
