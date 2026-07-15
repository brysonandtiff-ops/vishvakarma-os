import type { Session, User, UserIdentity } from '@supabase/supabase-js';
import { backendStatus } from '@/backend/backendConfig';
import { getSupabaseClient } from '@/backend/supabase/supabaseClient';

const SUPABASE_PENDING_EMAIL_KEY = 'vishvakarma.os.supabase.pendingEmail.v1';
const LEGACY_SUPABASE_SESSION_KEY = 'vishvakarma.os.supabase.session.v1';
const REQUIRED_AUTH_PROVIDER = 'google';
export const GOOGLE_ONLY_AUTH_MESSAGE =
  'Vishvakarma.OS only accepts Google SSO sessions through Supabase. Sign out, then continue with Google SSO.';

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

function googleOnlyAuthError() {
  return new Error(GOOGLE_ONLY_AUTH_MESSAGE);
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

export function isGoogleSupabaseUser(user: User): boolean {
  return getSupabaseAuthProviders(user).includes(REQUIRED_AUTH_PROVIDER);
}

function assertGoogleSupabaseUser(user: User) {
  if (isGoogleSupabaseUser(user)) return;
  throw googleOnlyAuthError();
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

/** @deprecated Google SSO does not require pending email state. */
export function storePendingSupabaseEmail(email: string) {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.setItem(SUPABASE_PENDING_EMAIL_KEY, email.trim().toLowerCase());
}

/** @deprecated Google SSO does not require pending email state. */
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
  search = typeof window !== 'undefined' ? window.location.search : '',
) {
  const params = new URLSearchParams(search);
  return params.has('code') && !params.has('token_hash');
}

/** Legacy email-link callbacks are recognized only so they can fail closed. */
export function isSupabaseEmailLinkCallback(
  hash = typeof window !== 'undefined' ? window.location.hash : '',
  search = typeof window !== 'undefined' ? window.location.search : '',
) {
  if (isSupabaseOAuthCallback(search)) return false;

  const params = new URLSearchParams(search);
  return hash.includes('type=magiclink') || params.has('token_hash');
}

/** @deprecated Password sign-in is disabled; Google SSO is the only supported method. */
export async function signInWithPasswordSupabase(_email: string, _password: string) {
  return { error: googleOnlyAuthError(), session: null };
}

/** @deprecated Password reset is disabled because password sign-in is unsupported. */
export async function requestSupabasePasswordReset(_email: string, _redirectTo: string) {
  return { error: googleOnlyAuthError() };
}

/** @deprecated Magic-link sign-in is disabled; Google SSO is the only supported method. */
export async function requestSupabaseAccessLink(_email: string, _redirectTo: string) {
  clearPendingSupabaseEmail();
  return { error: googleOnlyAuthError() };
}

type EmailLinkResult =
  | { status: 'completed' }
  | { status: 'needs_email' }
  | { status: 'error'; error: Error };

/** @deprecated Legacy magic links fail closed and never create an application session. */
export async function completeSupabaseEmailLinkSignIn(
  _email?: string,
): Promise<EmailLinkResult> {
  clearPendingSupabaseEmail();
  const client = getSupabaseClient();
  await client?.auth.signOut().catch(() => undefined);
  clearSupabaseSessionSnapshot();
  return { status: 'error', error: googleOnlyAuthError() };
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
