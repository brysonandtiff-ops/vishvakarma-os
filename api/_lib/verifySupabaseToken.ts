import type { IncomingMessage } from 'node:http';
import { createClient } from '@supabase/supabase-js';

export type VerifiedSupabaseUser = {
  uid: string;
  email?: string;
};

function readBearerToken(req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith('Bearer ')) return null;
  return value.slice('Bearer '.length).trim();
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
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }
): Promise<VerifiedSupabaseUser | null> {
  const token = readBearerToken(req);
  if (!token) return null;

  const admin = getSupabaseAdmin();
  if (!admin) return null;

  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;

  return {
    uid: data.user.id,
    email: data.user.email ?? undefined,
  };
}
