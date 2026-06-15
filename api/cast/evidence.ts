import type { IncomingMessage } from 'node:http';
import { fetchCastEvidence, resolveUserPlanTier } from '../_lib/castBackend';
import { verifySupabaseTokenFromRequest } from '../_lib/verifySupabaseToken';

type VercelRequest = IncomingMessage & {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function parseSessionId(req: VercelRequest): string | null {
  if (!req.url) return null;
  try {
    const parsed = new URL(req.url, 'http://localhost');
    return parsed.searchParams.get('sessionId');
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifySupabaseTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tier = await resolveUserPlanTier(user.uid, user.email);
  if (tier !== 'enterprise') {
    return res.status(403).json({ error: 'Cast evidence export requires Enterprise plan' });
  }

  const sessionId = parseSessionId(req);
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required' });
  }

  try {
    const evidence = await fetchCastEvidence(sessionId, user.uid);
    return res.status(200).json({ evidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch cast evidence';
    const status = message === 'Forbidden' ? 403 : 500;
    return res.status(status).json({ error: message });
  }
}
