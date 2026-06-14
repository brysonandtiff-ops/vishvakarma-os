import { CANONICAL_ORIGIN } from '@/config/canonicalOrigin';
import { backendStatus } from '@/backend/backendConfig';
import {
  buildSupabaseSessionFromAuthSession,
  isSupabaseOAuthCallback,
  type SupabaseSessionSnapshot,
} from '@/backend/supabase/supabaseAuthGateway';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

export type OAuthSignInResult = {
  session: SupabaseSessionSnapshot | null;
  redirecting: boolean;
};

type AuthErrorContext = {
  usedRedirect?: boolean;
};

const OAUTH_REDIRECT_PENDING_KEY = 'vish-oauth-redirect-pending';
const AUTH_RETURN_PATH_KEY = 'vish-auth-return-path';
export const POST_AUTH_DESTINATION = '/editor';
const DEFAULT_AUTH_RETURN_PATH = POST_AUTH_DESTINATION;
const PRODUCTION_AUTH_ORIGIN = CANONICAL_ORIGIN;

export function storeAuthReturnPath(path: string) {
  try {
    const normalized = path.startsWith('/') ? path : DEFAULT_AUTH_RETURN_PATH;
    sessionStorage.setItem(AUTH_RETURN_PATH_KEY, normalized);
  } catch {
    // ignore storage failures
  }
}

export function peekAuthReturnPath(defaultPath = DEFAULT_AUTH_RETURN_PATH) {
  try {
    const stored = sessionStorage.getItem(AUTH_RETURN_PATH_KEY);
    if (stored?.startsWith('/')) return stored;
  } catch {
    // ignore storage failures
  }
  return defaultPath;
}

export function ensureAuthReturnPathStored(path = DEFAULT_AUTH_RETURN_PATH) {
  try {
    if (sessionStorage.getItem(AUTH_RETURN_PATH_KEY)) return;
    storeAuthReturnPath(path);
  } catch {
    // ignore storage failures
  }
}
export function resolvePostAuthDestination(fromState?: string | null): string {
  // Always land in the editor after sign-in (all devices / all entry paths).
  void fromState;
  void peekAuthReturnPath(POST_AUTH_DESTINATION);
  return POST_AUTH_DESTINATION;
}

export function readAndClearAuthReturnPath(defaultPath = DEFAULT_AUTH_RETURN_PATH) {
  try {
    const stored = sessionStorage.getItem(AUTH_RETURN_PATH_KEY);
    sessionStorage.removeItem(AUTH_RETURN_PATH_KEY);
    if (stored?.startsWith('/')) return stored;
  } catch {
    // ignore storage failures
  }
  return defaultPath;
}

export function isOAuthRedirectPending() {
  try {
    const raw = sessionStorage.getItem(OAUTH_REDIRECT_PENDING_KEY);
    if (!raw) return false;
    const started = Number(raw);
    return Number.isFinite(started) && Date.now() - started < 120_000;
  } catch {
    return false;
  }
}

function stripAuthCallbackFromUrl() {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, '/auth');
}

export function markOAuthRedirectPending() {
  try {
    sessionStorage.setItem(OAUTH_REDIRECT_PENDING_KEY, String(Date.now()));
  } catch {
    // ignore storage failures
  }
}

export function clearOAuthRedirectPending() {
  try {
    sessionStorage.removeItem(OAUTH_REDIRECT_PENDING_KEY);
  } catch {
    // ignore storage failures
  }
}

export function consumeOAuthRedirectPending(maxAgeMs = 120_000): boolean {
  try {
    const raw = sessionStorage.getItem(OAUTH_REDIRECT_PENDING_KEY);
    sessionStorage.removeItem(OAUTH_REDIRECT_PENDING_KEY);
    if (!raw) return false;

    const started = Number(raw);
    return Number.isFinite(started) && Date.now() - started < maxAgeMs;
  } catch {
    return false;
  }
}

export function expireStaleOAuthRedirectPending(maxAgeMs = 120_000) {
  try {
    const raw = sessionStorage.getItem(OAUTH_REDIRECT_PENDING_KEY);
    if (!raw) return;

    const started = Number(raw);
    if (!Number.isFinite(started) || Date.now() - started >= maxAgeMs) {
      sessionStorage.removeItem(OAUTH_REDIRECT_PENDING_KEY);
    }
  } catch {
    // ignore storage failures
  }
}

const EMBEDDED_AUTH_UA_PATTERN =
  /Cursor|Electron|VSCode|vscode|Codeium|Windsurf|Obsidian|WebView|; wv\)|\bwv\b|instagram|fbav|line\//i;

export function isEmbeddedAuthBrowser(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  if (/HeadlessChrome/i.test(userAgent)) {
    return false;
  }

  return EMBEDDED_AUTH_UA_PATTERN.test(userAgent);
}

export function getEmbeddedAuthBrowserLabel(userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '') {
  if (/Cursor/i.test(userAgent)) return 'Cursor embedded preview';
  if (/VSCode|vscode/i.test(userAgent)) return 'VS Code embedded preview';
  if (/Electron/i.test(userAgent)) return 'embedded app browser';
  if (/instagram|fbav/i.test(userAgent)) return 'in-app browser';
  if (/; wv\)|\bwv\b/i.test(userAgent)) return 'embedded WebView';
  return 'embedded browser';
}

export function isEmbeddedAuthErrorMessage(message: string) {
  return message.toLowerCase().includes('embedded browser');
}

function formatEmbeddedBrowserError() {
  return new Error(
    'Google sign-in is blocked in this embedded browser. Open this page in Chrome or Safari to continue.'
  );
}

export function formatAuthError(error: unknown, context: AuthErrorContext = {}): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('provider is not enabled')) {
    return new Error(
      'Google sign-in is not enabled for this Supabase project. Enable Google under Authentication → Providers.'
    );
  }

  if (lower.includes('redirect') && lower.includes('uri')) {
    return new Error(
      'Google OAuth redirect URI mismatch. Add your /auth URL under Supabase Authentication → URL Configuration → Redirect URLs.'
    );
  }

  if (isEmbeddedAuthBrowser()) {
    return formatEmbeddedBrowserError();
  }

  if (context.usedRedirect) {
    return new Error(
      'Google sign-in did not finish. If you cancelled, try again. Otherwise open this page in Chrome or Safari.'
    );
  }

  return error instanceof Error ? error : new Error(message || 'Supabase sign-in failed.');
}

export function formatOAuthRedirectIncompleteMessage() {
  return 'Google sign-in did not complete. Try again, or open this page in Chrome or Safari (not an embedded preview).';
}

function isLocalAuthOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export function getAuthPageUrl() {
  if (typeof window === 'undefined') return `${PRODUCTION_AUTH_ORIGIN}/auth`;
  if (import.meta.env.DEV || import.meta.env.MODE === 'e2e' || isLocalAuthOrigin(window.location.origin)) {
    return `${window.location.origin}/auth`;
  }
  return `${import.meta.env.VITE_AUTH_REDIRECT_ORIGIN ?? PRODUCTION_AUTH_ORIGIN}/auth`;
}

export async function signInWithGoogleSupabase(): Promise<OAuthSignInResult> {
  if (!backendStatus.isConfigured) {
    throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
  }

  if (isEmbeddedAuthBrowser()) {
    throw formatEmbeddedBrowserError();
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not available.');
  }

  ensureAuthReturnPathStored(DEFAULT_AUTH_RETURN_PATH);
  markOAuthRedirectPending();

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: getAuthPageUrl(),
      skipBrowserRedirect: false,
    },
  });

  if (error) {
    clearOAuthRedirectPending();
    throw formatAuthError(error);
  }

  return { session: null, redirecting: true };
}

export async function signInWithAppleSupabase(): Promise<OAuthSignInResult> {
  if (!backendStatus.isConfigured) {
    throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
  }

  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase client is not available.');
  }

  ensureAuthReturnPathStored(DEFAULT_AUTH_RETURN_PATH);
  markOAuthRedirectPending();

  const { error } = await client.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: getAuthPageUrl(),
    },
  });

  if (error) {
    clearOAuthRedirectPending();
    throw formatAuthError(error);
  }

  return { session: null, redirecting: true };
}

export async function resolveSupabaseOAuthRedirectSession(): Promise<SupabaseSessionSnapshot | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  if (isSupabaseOAuthCallback()) {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      const { data, error } = await client.auth.exchangeCodeForSession(code);
      if (error) throw error;
      if (data.session?.user) {
        clearOAuthRedirectPending();
        stripAuthCallbackFromUrl();
        return buildSupabaseSessionFromAuthSession(data.session, data.session.user);
      }
    }
  }

  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) return null;

  clearOAuthRedirectPending();
  if (isSupabaseOAuthCallback()) {
    stripAuthCallbackFromUrl();
  }
  return buildSupabaseSessionFromAuthSession(data.session, data.session.user);
}
