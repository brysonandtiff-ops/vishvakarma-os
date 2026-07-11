import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasCachedAuthSession,
  hydrateSupabaseAuthSession,
  isSupabaseEmailLinkCallback,
  isSupabaseOAuthCallback,
  readCachedAuthBootstrap,
} from '@/backend/supabase/supabaseAuthGateway';
import {
  completePostAuthRedirect,
  getAuthPageUrl,
  POST_AUTH_DESTINATION,
  resolvePostAuthDestination,
  resolveSupabaseOAuthRedirectSession,
} from '@/backend/supabase/supabaseOAuthGateway';

const exchangeCodeForSession = vi.fn();
const getSession = vi.fn();
const setSession = vi.fn();

vi.mock('@/backend/backendConfig', () => ({
  backendStatus: { isConfigured: true, mode: 'connected' as const },
}));

vi.mock('@/backend/supabase/supabaseClient', () => ({
  getSupabaseClient: () => ({
    auth: {
      exchangeCodeForSession,
      getSession,
      setSession,
    },
  }),
}));

vi.mock('@/backend/supabase/supabaseAuthGateway', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/backend/supabase/supabaseAuthGateway')>();
  return {
    ...actual,
    buildSupabaseSessionFromAuthSession: vi.fn(async (session, user) => ({
      provider: 'supabase',
      authProvider: 'google',
      uid: user.id,
      email: user.email ?? '',
      expiresAt: (session.expires_at ?? 0) * 1000,
    })),
  };
});

function googleSupabaseUser() {
  return {
    id: 'user-1',
    email: 'architect@firm.com',
    app_metadata: {
      provider: 'google',
      providers: ['google'],
    },
    identities: [
      {
        provider: 'google',
      },
    ],
  };
}

function legacyTokenSnapshot() {
  return {
    provider: 'supabase',
    authProvider: 'google',
    uid: 'user-1',
    email: 'architect@firm.com',
    idToken: 'legacy-access-token',
    refreshToken: 'legacy-refresh-token',
    expiresAt: Date.now() + 60_000,
  };
}

function activeSupabaseSession() {
  return {
    access_token: 'sdk-access-token',
    refresh_token: 'sdk-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 60,
    user: googleSupabaseUser(),
  };
}

describe('supabase auth callback detection', () => {
  it('treats PKCE OAuth ?code= as OAuth, not email link', () => {
    expect(isSupabaseOAuthCallback('?code=abc')).toBe(true);
    expect(isSupabaseEmailLinkCallback('', '?code=abc')).toBe(false);
  });

  it('treats token_hash magic-link query as email link, not OAuth', () => {
    expect(isSupabaseOAuthCallback('?token_hash=abc&type=magiclink')).toBe(false);
    expect(isSupabaseEmailLinkCallback('', '?token_hash=abc&type=magiclink')).toBe(true);
  });

  it('treats hash magic-link type as email link', () => {
    expect(isSupabaseEmailLinkCallback('#type=magiclink&access_token=abc', '')).toBe(true);
    expect(isSupabaseOAuthCallback('')).toBe(false);
  });
});

describe('resolveSupabaseOAuthRedirectSession', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    getSession.mockReset();
    setSession.mockReset();
    localStorage.clear();
    vi.stubGlobal('window', {
      location: {
        search: '?code=pkce-code',
        origin: 'https://vishvakarma-os.app',
        pathname: '/auth',
      },
      history: {
        replaceState: vi.fn(),
      },
    });
    vi.stubGlobal('document', { title: 'Auth' });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls exchangeCodeForSession when OAuth code is present', async () => {
    const session = activeSupabaseSession();
    exchangeCodeForSession.mockResolvedValue({
      data: { session },
      error: null,
    });
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    setSession.mockResolvedValue({ data: { session }, error: null });

    const result = await resolveSupabaseOAuthRedirectSession();

    expect(exchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
    expect(setSession).toHaveBeenCalledWith({
      access_token: 'sdk-access-token',
      refresh_token: 'sdk-refresh-token',
    });
    expect(result).toMatchObject({
      uid: 'user-1',
      email: 'architect@firm.com',
    });
    expect(result).not.toHaveProperty('idToken');
    expect(result).not.toHaveProperty('refreshToken');
    expect(window.history.replaceState).toHaveBeenCalledWith({}, 'Auth', '/auth');
  });
});

describe('post-auth redirect helpers', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('always resolves post-auth destination to /editor', () => {
    expect(POST_AUTH_DESTINATION).toBe('/editor');
    expect(resolvePostAuthDestination('/projects')).toBe('/editor');
    expect(resolvePostAuthDestination(null)).toBe('/editor');
  });

  it('hard-redirects from /auth to /editor when invoked directly', () => {
    const replace = vi.fn();
    vi.stubGlobal('window', {
      location: {
        pathname: '/auth',
        origin: 'https://vishvakarma-os.app',
        replace,
      },
    });

    expect(completePostAuthRedirect()).toBe(true);
    expect(replace).toHaveBeenCalledWith('https://vishvakarma-os.app/editor');

    vi.unstubAllGlobals();
  });

  it('does not redirect when not on /auth', () => {
    const replace = vi.fn();
    vi.stubGlobal('window', {
      location: {
        pathname: '/editor',
        replace,
      },
    });

    expect(completePostAuthRedirect()).toBe(false);
    expect(replace).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

describe('getAuthPageUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps OAuth callback on the canonical .app origin the user opened', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://vishvakarma-os.app' },
    });
    vi.stubEnv('DEV', false);
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_AUTH_REDIRECT_ORIGIN', 'https://vishvakarma-os.vercel.app');

    expect(getAuthPageUrl()).toBe('https://vishvakarma-os.app/auth');
  });

  it('keeps OAuth callback on the Vercel fallback origin the user opened', () => {
    vi.stubGlobal('window', {
      location: { origin: 'https://vishvakarma-os.vercel.app' },
    });
    vi.stubEnv('DEV', false);
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_AUTH_REDIRECT_ORIGIN', 'https://vishvakarma-os.app');

    expect(getAuthPageUrl()).toBe('https://vishvakarma-os.vercel.app/auth');
  });
});

describe('hydrateSupabaseAuthSession', () => {
  beforeEach(() => {
    getSession.mockReset();
    setSession.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('uses the session owned by supabase-js and removes the legacy duplicate token cache', async () => {
    localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify(legacyTokenSnapshot()),
    );
    getSession.mockResolvedValue({ data: { session: activeSupabaseSession() }, error: null });

    const hydrated = await hydrateSupabaseAuthSession();

    expect(hydrated).toMatchObject({ uid: 'user-1', email: 'architect@firm.com' });
    expect(hydrated).not.toHaveProperty('idToken');
    expect(hydrated).not.toHaveProperty('refreshToken');
    expect(setSession).not.toHaveBeenCalled();
    expect(localStorage.getItem('vishvakarma.os.supabase.session.v1')).toBeNull();
  });

  it('does not trust or restore a legacy application token snapshot', async () => {
    localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify(legacyTokenSnapshot()),
    );
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    await expect(hydrateSupabaseAuthSession()).resolves.toBeNull();
    expect(setSession).not.toHaveBeenCalled();
    expect(localStorage.getItem('vishvakarma.os.supabase.session.v1')).toBeNull();
  });

  it('never exposes a cached bootstrap session as proof of authentication', () => {
    localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify(legacyTokenSnapshot()),
    );

    expect(readCachedAuthBootstrap()).toBeNull();
    expect(hasCachedAuthSession()).toBe(false);
    expect(localStorage.getItem('vishvakarma.os.supabase.session.v1')).toBeNull();
  });
});
