import type { IncomingMessage } from 'node:http';
import { describe, expect, it, vi } from 'vitest';
import {
  isGoogleSupabaseApiUser,
  isSupportedSupabaseApiUser,
  readBearerToken,
  verifySupabaseBearerToken,
} from './verifySupabaseToken';

type RequestWithHeaders = IncomingMessage & {
  headers: Record<string, string | string[] | undefined>;
};

const request = (authorization?: string) =>
  ({ headers: authorization ? { authorization } : {} }) as RequestWithHeaders;

const user = (provider: string) => ({
  id: 'user-1',
  email: 'architect@firm.com',
  app_metadata: { provider, providers: [provider] },
  identities: [{ provider }],
});

describe('Supabase API verification', () => {
  it('parses a case-insensitive bearer credential', () => {
    expect(readBearerToken(request('bearer sample-123'))).toBe('sample-123');
  });

  it.each([undefined, '', 'Basic abc123', 'Bearer', 'Bearer value with spaces'])(
    'rejects malformed credentials: %s',
    (authorization) => expect(readBearerToken(request(authorization))).toBeNull(),
  );

  it('keeps the Google-specific compatibility helper', () => {
    expect(isGoogleSupabaseApiUser(user('google'))).toBe(true);
    expect(isGoogleSupabaseApiUser(user('email'))).toBe(false);
  });

  it.each(['google', 'email'])('accepts supported identity %s', (provider) => {
    expect(isSupportedSupabaseApiUser(user(provider))).toBe(true);
  });

  it.each(['apple', 'github'])('rejects unsupported identity %s', (provider) => {
    expect(isSupportedSupabaseApiUser(user(provider))).toBe(false);
  });

  it.each(['google', 'email'])('verifies supported %s sessions', async (provider) => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: user(provider) }, error: null });
    await expect(verifySupabaseBearerToken('sample', { getUser })).resolves.toEqual({
      uid: 'user-1',
      email: 'architect@firm.com',
    });
  });

  it('fails closed for unsupported sessions', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: user('apple') }, error: null });
    await expect(verifySupabaseBearerToken('sample', { getUser })).resolves.toBeNull();
  });

  it('fails closed when verification returns no user', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'failed' } });
    await expect(verifySupabaseBearerToken('sample', { getUser })).resolves.toBeNull();
  });
});
