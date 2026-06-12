import type { IncomingMessage } from 'node:http';
import { verifySupabaseTokenFromRequest } from './verifySupabaseToken';

export type VerifiedAuthUser = {
  uid: string;
  email?: string;
};

export async function verifyAuthTokenFromRequest(
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }
): Promise<VerifiedAuthUser | null> {
  return verifySupabaseTokenFromRequest(req);
}

export function authMetadataUidKey() {
  return 'supabaseUid';
}
