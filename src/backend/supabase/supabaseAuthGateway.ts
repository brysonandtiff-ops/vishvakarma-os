import type { Session, User, UserIdentity } from '@supabase/supabase-js';
import { backendStatus } from '@/backend/backendConfig';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

const SUPABASE_PENDING_EMAIL_KEY = 'vishvakarma.os.supabase.pendingEmail.v1';
const LEGACY_SUPABASE_SESSION_KEY = 'vishvakarma.os.supabase.session.v1';
const SUPPORTED_AUTH_PROVIDERS = ['google', 'email'] as const;

export type SupportedAuthProvider = (typeof SUPPORTED_AUTH_PROVIDERS)[number];

export const SUPPORTED_AUTH_MESSAGE =
  'Vishvakarma.OS accepts approved Google SSO or secure email magic-link sessions through Supabase.';
/** @deprecated Kept for compatibility with older error and test imports. */
export const GOOGLE_ONLY_AUTH_MESSAGE = SUPPORTED_AUTH_MESSAGE;

/**
 * Non-sensitive auth metadata used by React state. Supabase remains the single
 * source of truth for access and refresh tokens.
 */
export interface SupabaseSessionSnapshot {
  provider: 'supabase';
  authProvider: SupportedAuthProvider;
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

function unsupportedAuthProviderError() {
  return new Error(SUPPORTED_AUTH_MESSAGE);
}

function normalizeSupabaseAuthError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes('fetch failed') ||
      message.includes('failed to fetch') ||
      message.includes('networkerror')
    ) {
      return new Error(
        'Secure sign-in could not reach Supabase Auth. Check the connection and deployment configuration.',
      );
    }

    return error;
  }

  return new Error('Supabase Auth failed for an unknown reason.');
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

function resolveSupportedAuthProvider(user: User): SupportedAuthProvider | null {
  const providers = getSupabaseAuthProviders(user);
  if (providers.includes('google')) return 'google';
  if (providers.includes('email')) return 'email';
  return null;
}

export function isGoogleSupabaseUser(user: User): boolean {
  return getSupabaseAuthProviders(user).includes('google');
}

export function isEmailSupabaseUser(user: User): boolean {
  return getSupabaseAuthProviders(user).includes('email');
}

export function isSupportedSupabaseUser(user: User): boolean {
  return resolveSupportedAuthProvider(user) !== null;
}

function assertSupportedSupabaseUser(user: User): SupportedAuthProvider {
  const provider = resolveSupportedAuthProvider(user);
  if (provider) return provider;
  throw unsupportedAuthProviderError();
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
  user: User,
): Promise<SupabaseSessionSnapshot> {
  const authProvider = assertSupportedSupabaseUser(user);
  clearLegacyTokenSnapshot();

  const expiresAt = session.expires_at
    ? session.expires_at * 1000
    : Date.now() + 3600 * 1000;

  return {
    provider: 'supabase',
    authProvider,
    uid: user.id,
    email: user.email ?? '',
    expiresAt,
  };
}

async function buildAuthorizedSessionOrSignOut(
  client: NonNullable<ReturnType<typeof getSupabaseClient>>,
  session: Session,
  user: User,
) {
  try {
    return await buildSupabaseSessionFromAuthSession(session, user);
  } catch (error) {
    clearSupabaseSessionSnapshot();
    await client.auth.signOut().catch(() => undefined);
    throw error;
  }
}

/** Restore auth metadata from the session persisted and refreshed by supabase-js. */
export async function hydrateSupabaseAuthSession(): Promise<SupabaseSessionSnapshot | null> {
  clearLegacyTokenSnapshot();
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error) throw normalizeSupabaseAuthError(error);
  if (!data.session?.user) return null;

  return buildAuthorizedSessionOrSignOut(client, data.session, data.session.user);
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

/** PKCE auth return — query `code` without email OTP `token_hash`. */
export function isSupabaseOAuthCallback(
  search = typeof window !== 'undefined' ? window.location.search : '',
) {
  const params = new URLSearchParams(search);
  return params.has('code') && !params.has('token_hash');
}

export function isSupabaseEmailLinkCallback(
  hash = typeof window !== 'undefined' ? window.location.hash : '',
  search = typeof window !== 'undefined' ? window.location.search : '',
) {
  if (isSupabaseOAuthCallback(search)) return false;

  const params = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  return (
    hashParams.get('type') === 'magiclink' ||
    hashParams.get('type') === 'email' ||
    params.has('token_hash')
  );
}

/** Password sign-in remains disabled; use Google SSO or email magic link. */
export async function signInWithPasswordSupabase(_email: string, _password: string) {
  return {
    error: new Error('Password sign-in is disabled. Use Google SSO or a secure email magic link.'),
    session: null,
  };
}

/** Password reset remains disabled because password sign-in is unsupported. */
export async function requestSupabasePasswordReset(_email: string, _redirectTo: string) {
  return {
    error: new Error('Password reset is unavailable. Request a secure email sign-in link instead.'),
  };
}

export async function requestSupabaseAccessLink(email: string, redirectTo: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { error: new Error('Enter a valid email address.') };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      error: new Error(
        backendStatus.configurationError ?? 'Supabase backend is not configured.',
      ),
    };
  }

  storePendingSupabaseEmail(normalizedEmail);
  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: false,
    },
  });

  if (error) {
    clearPendingSupabaseEmail();
    return { error: normalizeSupabaseAuthError(error) };
  }

  return { error: null };
}

type EmailLinkResult =
  | { status: 'completed' }
  | { status: 'needs_email' }
  | { status: 'error'; error: Error };

export async function completeSupabaseEmailLinkSignIn(
  email?: string,
): Promise<EmailLinkResult> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      status: 'error',
      error: new Error(backendStatus.configurationError ?? 'Supabase backend is not configured.'),
    };
  }

  try {
    const params = new URLSearchParams(
      typeof window !== 'undefined' ? window.location.search : '',
    );
    const tokenHash = params.get('token_hash');

    if (tokenHash) {
      const { data, error } = await client.auth.verifyOtp({
        token_hash: tokenHash,
        type: 'email',
      });
      if (error) throw error;
      if (!data.session?.user) {
        throw new Error('Supabase did not return a session for this email link.');
      }
      await buildAuthorizedSessionOrSignOut(client, data.session, data.session.user);
      clearPendingSupabaseEmail();
      return { status: 'completed' };
    }

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (data.session?.user) {
      await buildAuthorizedSessionOrSignOut(client, data.session, data.session.user);
      clearPendingSupabaseEmail();
      return { status: 'completed' };
    }

    const pendingEmail = email?.trim().toLowerCase() || readPendingSupabaseEmail();
    if (!pendingEmail) return { status: 'needs_email' };

    return {
      status: 'error',
      error: new Error('The email sign-in link is incomplete or expired. Request a new link.'),
    };
  } catch (error) {
    clearPendingSupabaseEmail();
    await client.auth.signOut().catch(() => undefined);
    clearSupabaseSessionSnapshot();
    return { status: 'error', error: normalizeSupabaseAuthError(error) };
  }
}

export async function resolveSupabaseSessionForApi() {
  clearLegacyTokenSnapshot();
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      backendStatus.configurationError ?? 'Supabase backend is not configured.',
    );
  }

  const { data, error } = await client.auth.getSession();
  if (error) {
    throw normalizeSupabaseAuthError(error);
  }

  if (data.session?.user) {
    return buildAuthorizedSessionOrSignOut(client, data.session, data.session.user);
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
