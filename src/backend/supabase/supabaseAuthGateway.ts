import type { Session, User, UserIdentity } from '@supabase/supabase-js';
import { CANONICAL_AUTH_URL, VERCEL_FALLBACK_ORIGIN } from '@/config/canonicalOrigin';
import { backendStatus } from '@/backend/backendConfig';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

const SUPABASE_PENDING_EMAIL_KEY = 'vishvakarma.os.supabase.pendingEmail.v1';
const LEGACY_SUPABASE_SESSION_KEY = 'vishvakarma.os.supabase.session.v1';
const PRODUCTION_AUTH_URL = CANONICAL_AUTH_URL;
const REQUIRED_AUTH_PROVIDER = 'google';

/**
 * Non-sensitive auth metadata used by React state. Supabase remains the single
 * source of truth for access and refresh tokens.
 */
export interface SupabaseSessionSnapshot {
  provider: 'supabase';
  authProvider: 'google';
  uid: string;
  email: string;
  expiresAt: number;
}

function getBrowserStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function clearLegacyTokenSnapshot() {
  getBrowserStorage()?.removeItem(LEGACY_SUPABASE_SESSION_KEY);
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
      return new Error('Invalid email or password. Try again or use a magic link.');
    }

    if (message.includes('email not confirmed')) {
      return new Error('Confirm your email address before signing in with a password.');
    }

    if (message.includes('email rate limit')) {
      return new Error('Too many access-link attempts. Try again later.');
    }

    return error;
  }

  return new Error('Magic-link request failed for an unknown reason.');
}

function getSupabaseAuthProviders(user: User): string[] {
  const providers = new Set<string>();
  const appProvider = user.app_metadata?.provider;
  const appProviders = user.app_metadata?.providers;

  if (typeof appProvider === 'string') providers.add(appProvider);
  if (Array.isArray(appProviders)) {
    for (const provider of appProviders) {
      if (typeof provider === 'string') providers.add(provider);
    }
  }

  for (const identity of user.identities ?? []) {
    const provider = (identity as UserIdentity).provider;
    if (typeof provider === 'string') providers.add(provider);
  }

  return Array.from(providers).map((provider) => provider.toLowerCase());
}

export function isGoogleSupabaseUser(user: User): boolean {
  return getSupabaseAuthProviders(user).includes(REQUIRED_AUTH_PROVIDER);
}

function assertGoogleSupabaseUser(user: User) {
  if (isGoogleSupabaseUser(user)) return;

  throw new Error(
    'Vishvakarma.OS only accepts Google SSO sessions through Supabase. Sign out, then continue with Google SSO.'
  );
}

/** @deprecated Tokens are owned by supabase-js and are never copied by application code. */
export function writeSupabaseSessionSnapshot(_session: SupabaseSessionSnapshot) {
  clearLegacyTokenSnapshot();
}

/** @deprecated Legacy token snapshots are deleted rather than trusted. */
export function readSupabaseSessionSnapshot(): SupabaseSessionSnapshot | null {
  clearLegacyTokenSnapshot();
  return null;
}

export function clearSupabaseSessionSnapshot() {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.removeItem(LEGACY_SUPABASE_SESSION_KEY);
  storage.removeItem(SUPABASE_PENDING_EMAIL_KEY);
}

export async function buildSupabaseSessionFromAuthSession(
  session: Session,
  user: User
): Promise<SupabaseSessionSnapshot> {
  assertGoogleSupabaseUser(user);
  clearLegacyTokenSnapshot();

  const expiresAt = session.expires_at
    ? session.expires_at * 1000
    : Date.now() + 3600 * 1000;

  return {
    provider: 'supabase',
    authProvider: REQUIRED_AUTH_PROVIDER,
    uid: user.id,
    email: user.email ?? '',
    expiresAt,
  };
}

/** Restore auth metadata from the session persisted and refreshed by supabase-js. */
export async function hydrateSupabaseAuthSession(): Promise<SupabaseSessionSnapshot | null> {
  clearLegacyTokenSnapshot();
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) throw normalizeSupabaseAuthError(error);
  if (!data.session?.user) return null;

  return buildSupabaseSessionFromAuthSession(data.session, data.session.user);
}

/** @deprecated Local storage metadata is not accepted as proof of authentication. */
export function readCachedAuthBootstrap(): SupabaseSessionSnapshot | null {
  clearLegacyTokenSnapshot();
  return null;
}

/** @deprecated Route access waits for the Supabase SDK session instead. */
export function hasCachedAuthSession(): boolean {
  clearLegacyTokenSnapshot();
  return false;
}

export function storePendingSupabaseEmail(email: string) {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.setItem(SUPABASE_PENDING_EMAIL_KEY, email.trim().toLowerCase());
}

export function readPendingSupabaseEmail() {
  const storage = getBrowserStorage();
  if (!storage) return null;
  return storage.getItem(SUPABASE_PENDING_EMAIL_KEY);
}

export function clearPendingSupabaseEmail() {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.removeItem(SUPABASE_PENDING_EMAIL_KEY);
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

export async function signInWithPasswordSupabase(email: string, password: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
  }

  const normalized = email.trim().toLowerCase();
  const { data, error } = await client.auth.signInWithPassword({
    email: normalized,
    password,
  });

  if (error) {
    return { error: normalizeSupabaseAuthError(error), session: null };
  }

  if (!data.session?.user) {
    return { error: new Error('Password sign-in did not return a session.'), session: null };
  }

  try {
    const session = await buildSupabaseSessionFromAuthSession(data.session, data.session.user);
    return { error: null, session };
  } catch (guardError) {
    await client.auth.signOut();
    clearSupabaseSessionSnapshot();
    return { error: guardError instanceof Error ? guardError : new Error('Google SSO is required.'), session: null };
  }
}

export async function requestSupabasePasswordReset(email: string, redirectTo: string) {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.');
  }

  const normalized = email.trim().toLowerCase();
  const { error } = await client.auth.resetPasswordForEmail(normalized, {
    redirectTo: normalizeEmailRedirectUrl(redirectTo),
  });

  if (error) {
    return { error: normalizeSupabaseAuthError(error) };
  }

  return { error: null };
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
    try {
      await buildSupabaseSessionFromAuthSession(data.session, data.session.user);
      clearPendingSupabaseEmail();
      return { status: 'completed' };
    } catch (guardError) {
      await client.auth.signOut();
      clearSupabaseSessionSnapshot();
      return { status: 'error', error: guardError instanceof Error ? guardError : new Error('Google SSO is required.') };
    }
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
  clearLegacyTokenSnapshot();
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

  throw new Error('Supabase session is not available.');
}

export async function signOutSupabaseAuth() {
  const client = getSupabaseClient();
  clearSupabaseSessionSnapshot();
  if (client) {
    await client.auth.signOut();
  }
}
