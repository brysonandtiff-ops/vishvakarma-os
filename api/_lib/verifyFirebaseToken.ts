import type { IncomingMessage } from 'node:http';
import { getAdminAuth } from './firebaseAdmin';

export type VerifiedFirebaseUser = {
  uid: string;
  email?: string;
};

function readBearerToken(req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }) {
  const header = req.headers.authorization ?? req.headers.Authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith('Bearer ')) return null;
  return value.slice('Bearer '.length).trim();
}

export async function verifyFirebaseTokenFromRequest(
  req: IncomingMessage & { headers: Record<string, string | string[] | undefined> }
): Promise<VerifiedFirebaseUser | null> {
  const token = readBearerToken(req);
  if (!token) return null;

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return null;
  }
}
