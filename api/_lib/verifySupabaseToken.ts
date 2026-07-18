import type { IncomingMessage } from 'node:http';
import { createClient } from '@supabase/supabase-js';

export type VerifiedSupabaseUser = {
  uid: string;
  email?: string;
};

type SupabaseApiUser = {
  id: string;
  email?: string | null;
  app_metadata?: { provider?: unknown; providers?: unknown };
  identities?: Array<{ provider?: unknown }> | null;
};

type SupabaseAuthVerifier = {
  getUser: (jwt?: string) => Promise<{
    data: { user: SupabaseApiUser | null };
    error: { message: string } | null;
  }>;
};

const MAX_BEARER_TOKEN_LENGTH = 8_192;
const SUPPORTED_AUTH_PROVIDERS = new Set(['google', 'email']);

export function readBearerToken(
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> },
) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  const value = Array.isArray(header) ? header[0] : header;
  const match = value?.match(/^Bearer\s+([^\s]+)$/i);
  const token = match?.[1]?.trim();
  if (!token || token.length > MAX_BEARER_TOKEN_LENGTH) return null;
  return token;
}

function authProviders(user: SupabaseApiUser) {
  const providers = new Set<string>();
  const appProvider = user.app_metadata?.provider;
  const appProviders = user.app_metadata?.providers;

  if (typeof appProvider === 'string') providers.add(appProvider.toLowerCase());
  if (Array.isArray(appProviders)) {
    for (const provider of appProviders) {
      if (typeof provider === 'string') providers.add(provider.toLowerCase());
    }
  }
  for (const identity of user.identities ?? []) {
    if (typeof identity.provider === 'string') providers.add(identity.provider.toLowerCase());
  }
  return providers;
}

export function isSupportedSupabaseApiUser(user: SupabaseApiUser): boolean {
  const providers = authProviders(user);
  return [...SUPPORTED_AUTH_PROVIDERS].some((provider) => providers.has(provider));
}

export function isGoogleSupabaseApiUser(user: SupabaseApiUser): boolean {
  return authProviders(user).has('google');
}

export async function verifySupabaseBearerToken(
  token: string,
  auth: SupabaseAuthVerifier,
): Promise<VerifiedSupabaseUser | null> {
  const { data, error } = await auth.getUser(token);
  if (error || !data.user || !isSupportedSupabaseApiUser(data.user)) return null;
  return { uid: data.user.id, email: data.user.email ?? undefined };
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function verifySupabaseTokenFromRequest(
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> },
): Promise<VerifiedSupabaseUser | null> {
  const token = readBearerToken(req);
  if (!token) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  return verifySupabaseBearerToken(token, admin.auth as unknown as SupabaseAuthVerifier);
}
