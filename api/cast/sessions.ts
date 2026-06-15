import type { IncomingMessage } from 'node:http';
import {
  assertProjectAccess,
  createCastSession,
  endCastSession,
  resolveCollabWsUrl,
  resolveUserPlanTier,
} from '../_lib/castBackend';
import { verifySupabaseTokenFromRequest } from '../_lib/verifySupabaseToken';

type VercelRequest = IncomingMessage & {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

function parseJsonBody(req: VercelRequest): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }
  return {};
}

function resolveAppOrigin(req: VercelRequest): string {
  const originHeader = req.headers.origin;
  if (typeof originHeader === 'string' && originHeader) return originHeader;
  return process.env.APP_URL?.trim() || 'https://vishvakarma-os.app';
}

function mapSession(row: Awaited<ReturnType<typeof createCastSession>>['session']) {
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
  const user = await verifySupabaseTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tier = await resolveUserPlanTier(user.uid, user.email);
  if (tier === 'starter') {
    return res.status(403).json({ error: 'Akasha Cast requires Studio or Enterprise plan' });
  }

  if (req.method === 'POST') {
    try {
      const body = parseJsonBody(req);
      const projectId = typeof body.projectId === 'string' ? body.projectId : '';
      if (!projectId) {
        return res.status(400).json({ error: 'projectId is required' });
      }

      await assertProjectAccess(user.uid, projectId);

      const inviteRole =
        body.inviteRole === 'family' || body.inviteRole === 'council_reviewer'
          ? body.inviteRole
          : 'viewer';

      if (inviteRole !== 'viewer' && tier !== 'enterprise') {
        return res.status(403).json({ error: 'Role-scoped invites require Enterprise plan' });
      }

      const { session, token } = await createCastSession({
        hostUserId: user.uid,
        projectId,
        inviteRole,
      });

      const origin = resolveAppOrigin(req);
      return res.status(200).json({
        session: mapSession(session),
        token,
        shareUrl: `${origin}/cast/${token}`,
        wsUrl: resolveCollabWsUrl(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create cast session';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const body = parseJsonBody(req);
      const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      await endCastSession(sessionId, user.uid);
      return res.status(200).json({ ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end cast session';
      return res.status(500).json({ error: message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
