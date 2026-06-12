import type { IncomingMessage } from 'node:http';
import { verifyFirebaseTokenFromRequest } from './verifyFirebaseToken';
import { verifySupabaseTokenFromRequest } from './verifySupabaseToken';

export type VerifiedAuthUser = {
  uid: string;
  email?: string;
};

function resolveServerBackendProvider() {
  const explicit = (process.env.BACKEND_PROVIDER ?? process.env.VITE_BACKEND_PROVIDER ?? 'supabase')
    .trim()
    .toLowerCase();
  return explicit === 'firebase' ? 'firebase' : 'supabase';
}

export async function verifyAuthTokenFromRequest(
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }
): Promise<VerifiedAuthUser | null> {
  if (resolveServerBackendProvider() === 'firebase') {
    return verifyFirebaseTokenFromRequest(req);
  }

  return verifySupabaseTokenFromRequest(req);
}

export function authMetadataUidKey() {
  return resolveServerBackendProvider() === 'firebase' ? 'firebaseUid' : 'supabaseUid';
}
