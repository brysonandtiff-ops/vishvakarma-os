import type { Session, User } from '@supabase/supabase-js';
import { CANONICAL_AUTH_URL, VERCEL_FALLBACK_ORIGIN } from '@/config/canonicalOrigin';
import { backendStatus } from '@/backend/backendConfig';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

const SUPABASE_PENDING_EMAIL_KEY = 'vishvakarma.os.supabase.pendingEmail.v1';
const SUPABASE_SESSION_KEY = 'vishvakarma.os.supabase.session.v1';
const PRODUCTION_AUTH_URL = CANONICAL_AUTH_URL;

export interface SupabaseSessionSnapshot {
  provider: 'supabase';
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

function hasBrowserStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isProtectedVercelPreviewUrl(value: string) {
  try {
    const url = new URL(value);
    const fallbackHost = new URL(VERCEL_FALLBACK_ORIGIN).hostname;
    return url.hostname.endsWith('.vercel.app') && url.hostname !== fallbackHost;
  } catch {
    return false;
  }
}

function normalizeEmailRedirectUrl(redirectTo: string) {
  if (isProtectedVercelPreviewUrl(redirectTo)) return PRODUCTION_AUTH_URL;
  return redirectTo;
}

function normalizeSupabaseAuthError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('fetch failed') || message.includes('failed to fetch') || message.includes('networkerror')) {
      return new Error(
        'Magic-link request could not reach Supabase Auth. Check Supabase environment variables and deployment network access.'
      );
    }

    if (message.includes('invalid login credentials')) {
      return new Error('This sign-in link is invalid or expired. Request a new secure access link.');
    }

    if (message.includes('email rate limit')) {
      return new Error('Too many access-link attempts. Try again later.');
    }

    return error;
  }

  return new Error('Magic-link request failed for an unknown reason.');
}

export function writeSupabaseSessionSnapshot(session: SupabaseSessionSnapshot) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
}

export function readSupabaseSessionSnapshot(): SupabaseSessionSnapshot | null {
  if (!hasBrowserStorage()) return null;

  const raw = window.localStorage.getItem(SUPABASE_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SupabaseSessionSnapshot>;
    if (parsed.provider !== 'supabase') return null;
    if (!parsed.uid || !parsed.email || !parsed.idToken || !parsed.expiresAt) return null;
    if (Date.now() >= parsed.expiresAt) return null;

    return {
      provider: 'supabase',
      uid: parsed.uid,
      email: parsed.email,
      idToken: parsed.idToken,
      refreshToken: parsed.refreshToken ?? '',
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function clearSupabaseSessionSnapshot() {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(SUPABASE_SESSION_KEY);
  window.localStorage.removeItem(SUPABASE_PENDING_EMAIL_KEY);
}

export async function buildSupabaseSessionFromAuthSession(
  session: Session,
  user: User
): Promise<SupabaseSessionSnapshot> {
  const expiresAt = session.expires_at
    ? session.expires_at * 1000
    : Date.now() + 3600 * 1000;

  const snapshot: SupabaseSessionSnapshot = {
    provider: 'supabase',
    uid: user.id,
    email: user.email ?? '',
    idToken: session.access_token,
    refreshToken: session.refresh_token ?? '',
    expiresAt,
  };

  writeSupabaseSessionSnapshot(snapshot);
  return snapshot;
}

/** Restore Supabase client session from storage, rehydrating the SDK when needed. */
export async function hydrateSupabaseAuthSession(): Promise<SupabaseSessionSnapshot | null> {
  const client = getSupabaseClient();
  const cached = readSupabaseSessionSnapshot();

  if (!client) {
    return cached;
  }

  const { data, error } = await client.auth.getSession();
  if (!error && data.session?.user) {
    return buildSupabaseSessionFromAuthSession(data.session, data.session.user);
  }

  if (!cached) {
    return null;
  }

  if (cached.idToken) {
    const { data: restored, error: restoreError } = await client.auth.setSession({
      access_token: cached.idToken,
      refresh_token: cached.refreshToken,
    });

    if (!restoreError && restored.session?.user) {
      return buildSupabaseSessionFromAuthSession(restored.session, restored.session.user);
    }
  }

  return cached;
}

export function readCachedAuthBootstrap(): SupabaseSessionSnapshot | null {
  if (!backendStatus.isConfigured) return null;
  return readSupabaseSessionSnapshot();
}

export function storePendingSupabaseEmail(email: string) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(SUPABASE_PENDING_EMAIL_KEY, email.trim().toLowerCase());
}

export function readPendingSupabaseEmail() {
  if (!hasBrowserStorage()) return null;
  return window.localStorage.getItem(SUPABASE_PENDING_EMAIL_KEY);
}

export function clearPendingSupabaseEmail() {
  if (!hasBrowserStorage()) return;
  window.localStorage.removeItem(SUPABASE_PENDING_EMAIL_KEY);
}

/** PKCE OAuth return — query `code` without email OTP `token_hash`. */
export function isSupabaseOAuthCallback(
  search = typeof window !== 'undefined' ? window.location.search : ''
) {
  const params = new URLSearchParams(search);
  return params.has('code') && !params.has('token_hash');
}

/** Email magic-link return — not OAuth PKCE `?code=`. */
export function isSupabaseEmailLinkCallback(
  hash = typeof window !== 'undefined' ? window.location.hash : '',
  search = typeof window !== 'undefined' ? window.location.search : ''
) {
  if (isSupabaseOAuthCallback(search)) return false;

  const params = new URLSearchParams(search);
  return hash.includes('type=magiclink') || params.has('token_hash');
}

export async function requestSupabaseAccessLink(email: string, redirectTo: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
  }

  const normalized = email.trim().toLowerCase();
  storePendingSupabaseEmail(normalized);

  const { error } = await client.auth.signInWithOtp({
    email: normalized,
    options: {
      emailRedirectTo: normalizeEmailRedirectUrl(redirectTo),
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: normalizeSupabaseAuthError(error) };
  }

  return { error: null };
}

type EmailLinkResult =
  | { status: 'completed' }
  | { status: 'needs_email' }
  | { status: 'error'; error: Error };

export async function completeSupabaseEmailLinkSignIn(email?: string): Promise<EmailLinkResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { status: 'error', error: new Error('Supabase backend is not configured.') };
  }

  const { data, error } = await client.auth.getSession();

  if (error) {
    return { status: 'error', error: normalizeSupabaseAuthError(error) };
  }

  if (data.session?.user) {
    await buildSupabaseSessionFromAuthSession(data.session, data.session.user);
    clearPendingSupabaseEmail();
    return { status: 'completed' };
  }

  const pendingEmail = email?.trim().toLowerCase() || readPendingSupabaseEmail();
  if (!pendingEmail) {
    return { status: 'needs_email' };
  }

  return {
    status: 'error',
    error: new Error('Email link sign-in could not be completed. Open the link on the same device or request a new link.'),
  };
}

export async function resolveSupabaseSessionForApi() {
  const cached = readSupabaseSessionSnapshot();
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw normalizeSupabaseAuthError(error);
  }

  if (data.session?.user) {
    return buildSupabaseSessionFromAuthSession(data.session, data.session.user);
  }

  if (cached) return cached;
  throw new Error('Supabase session is not available.');
}

export async function signOutSupabaseAuth() {
  const client = getSupabaseClient();
  clearSupabaseSessionSnapshot();
  if (client) {
    await client.auth.signOut();
  }
}
