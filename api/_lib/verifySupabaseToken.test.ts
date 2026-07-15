import type { IncomingMessage } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import {
  isGoogleSupabaseApiUser,
  readBearerToken,
  verifySupabaseBearerToken,
} from './verifySupabaseToken';

type RequestWithHeaders = IncomingMessage & {
  headers: Record<string, string | string[] | undefined>;
};

function request(authorization?: string) {
  return {
    headers: authorization ? { authorization } : {},
  } as RequestWithHeaders;
}

function user(provider: string) {
  return {
    id: 'user-1',
    email: 'architect@firm.com',
    app_metadata: { provider, providers: [provider] },
    identities: [{ provider }],
  };
}

describe('Supabase API bearer verification', () => {
  it('parses a single case-insensitive Bearer token', () => {
    expect(readBearerToken(request('bearer token-123'))).toBe('token-123');
  });

  it.each([
    undefined,
    '',
    'Basic abc123',
    'Bearer',
    'Bearer token with spaces',
    `Bearer ${'x'.repeat(8_193)}`,
  ])('rejects malformed bearer credentials: %s', (authorization) => {
    expect(readBearerToken(request(authorization))).toBeNull();
  });

  it('recognizes Google provider metadata from every supported Supabase location', () => {
    expect(isGoogleSupabaseApiUser(user('google'))).toBe(true);
    expect(
      isGoogleSupabaseApiUser({
        id: 'user-1',
        app_metadata: { providers: ['email', 'GOOGLE'] },
        identities: [],
      }),
    ).toBe(true);
    expect(
      isGoogleSupabaseApiUser({
        id: 'user-1',
        app_metadata: {},
        identities: [{ provider: 'google' }],
      }),
    ).toBe(true);
  });

  it.each(['email', 'apple', 'github'])('rejects non-Google Supabase identities: %s', (provider) => {
    expect(isGoogleSupabaseApiUser(user(provider))).toBe(false);
  });

  it('returns a verified user only for a Google session', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: user('google') },
      error: null,
    });

    await expect(verifySupabaseBearerToken('token', { getUser })).resolves.toEqual({
      uid: 'user-1',
      email: 'architect@firm.com',
    });
    expect(getUser).toHaveBeenCalledWith('token');
  });

  it('fails closed for a valid non-Google Supabase token', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: user('apple') },
      error: null,
    });

    await expect(verifySupabaseBearerToken('token', { getUser })).resolves.toBeNull();
  });

  it('fails closed when Supabase cannot verify the token', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid JWT' },
    });

    await expect(verifySupabaseBearerToken('token', { getUser })).resolves.toBeNull();
  });
});
