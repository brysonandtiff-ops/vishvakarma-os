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
      uid: user.id,
      email: user.email ?? '',
      accessToken: session.access_token,
      refreshToken: session.refresh_token ?? '',
      expiresAt: session.expires_at ?? 0,
    })),
  };
});

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
    exchangeCodeForSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 999,
          user: { id: 'user-1', email: 'architect@firm.com' },
        },
      },
      error: null,
    });
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    setSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 999,
          user: { id: 'user-1', email: 'architect@firm.com' },
        },
      },
      error: null,
    });

    const session = await resolveSupabaseOAuthRedirectSession();

    expect(exchangeCodeForSession).toHaveBeenCalledWith('pkce-code');
    expect(setSession).toHaveBeenCalled();
    expect(session).toMatchObject({
      uid: 'user-1',
      email: 'architect@firm.com',
      accessToken: 'access',
    });
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

  it('hard-redirects from /auth to /editor', () => {
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

  it('keeps OAuth callback on the vercel fallback origin the user opened', () => {
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

  it('rehydrates the Supabase client from cached snapshot when getSession is empty', async () => {
    localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify({
        provider: 'supabase',
        uid: 'user-1',
        email: 'architect@firm.com',
        idToken: 'access',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 60_000,
      })
    );
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    setSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'access',
          refresh_token: 'refresh',
          expires_at: 999,
          user: { id: 'user-1', email: 'architect@firm.com' },
        },
      },
      error: null,
    });

    const hydrated = await hydrateSupabaseAuthSession();

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh',
    });
    expect(hydrated).toMatchObject({ uid: 'user-1', email: 'architect@firm.com' });
  });

  it('returns cached snapshot from readCachedAuthBootstrap', () => {
    localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify({
        provider: 'supabase',
        uid: 'user-1',
        email: 'architect@firm.com',
        idToken: 'access',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 60_000,
      })
    );

    expect(readCachedAuthBootstrap()?.uid).toBe('user-1');
  });

  it('detects cached auth session for RouteGuard restore gate', () => {
    expect(hasCachedAuthSession()).toBe(false);

    localStorage.setItem(
      'vishvakarma.os.supabase.session.v1',
      JSON.stringify({
        provider: 'supabase',
        uid: 'user-1',
        email: 'architect@firm.com',
        idToken: 'access',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 60_000,
      })
    );

    expect(hasCachedAuthSession()).toBe(true);
  });
});
