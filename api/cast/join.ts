import type { IncomingMessage } from 'node:http';
import { joinCastByToken, resolveCollabWsUrl } from '../_lib/castBackend';

type VercelRequest = IncomingMessage & {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function parseToken(req: VercelRequest): string | null {
  if (req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      const fromQuery = parsed.searchParams.get('token');
      if (fromQuery) return fromQuery;
    } catch {
      // ignore
    }
  }
  return null;
}

function mapSession(row: Awaited<ReturnType<typeof joinCastByToken>>['session']) {
  return {
    id: row.id,
    projectId: row.project_id,
    hostUserId: row.host_user_id,
    status: row.status,
    presenterLensState: row.presenter_lens_state,
    chronoState: row.chrono_state,
    intentRelayEnabled: row.intent_relay_enabled,
    chronoLockEnabled: row.chrono_lock_enabled,
    viewerCount: row.viewer_count,
    createdAt: row.created_at,
    endedAt: row.ended_at,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = parseToken(req);
  if (!token) {
    return res.status(400).json({ error: 'token query parameter is required' });
  }

  try {
    const joined = await joinCastByToken(token);
    return res.status(200).json({
      session: mapSession(joined.session),
      projectId: joined.projectId,
      projectName: joined.projectName,
      role: joined.role,
      token,
      wsUrl: resolveCollabWsUrl(),
      manifest: joined.manifest,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cast join failed';
    const status = message.includes('Invalid') || message.includes('expired') ? 404 : 500;
    return res.status(status).json({ error: message });
  }
}
