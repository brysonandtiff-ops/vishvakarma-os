import {
  assertProjectAccess,
  createCastSession,
  endCastSession,
  resolveCollabWsUrl,
  resolveUserPlanTier,
  type CastInviteRole,
} from '../_lib/castBackend';
import { verifyAuthTokenFromRequest } from '../_lib/verifyAuthToken';
import {
  ApiRequestError,
  applyApiSecurityHeaders,
  enforceApiMethod,
  parseBoundedJsonBody,
  sendApiFailure,
  type SecureApiRequest,
  type SecureApiResponse,
} from '../_lib/httpSecurity';
import {
  resolveTrustedAppOrigin,
  UntrustedAppOriginError,
} from '../_lib/appOrigin';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INVITE_ROLES = new Set<CastInviteRole>([
  'viewer',
  'family',
  'council_reviewer',
]);

function requireUuid(value: unknown, field: string): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value.trim())) {
    throw new ApiRequestError(400, `${field} is invalid`);
  }
  return value.trim();
}

function parseInviteRole(value: unknown): CastInviteRole {
  if (value === undefined) return 'viewer';
  if (typeof value !== 'string' || !INVITE_ROLES.has(value as CastInviteRole)) {
    throw new ApiRequestError(400, 'inviteRole is invalid');
  }
  return value as CastInviteRole;
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

export default async function handler(req: SecureApiRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['POST', 'DELETE'])) return;

  const user = await verifyAuthTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const tier = await resolveUserPlanTier(user.uid, user.email);
    if (tier === 'starter') {
      return res.status(403).json({
        error: 'Akasha Cast requires Studio or Enterprise plan',
      });
    }

    const body = parseBoundedJsonBody(req);

    if (req.method === 'POST') {
      const projectId = requireUuid(body.projectId, 'projectId');
      const inviteRole = parseInviteRole(body.inviteRole);

      await assertProjectAccess(user.uid, projectId);
      if (inviteRole !== 'viewer' && tier !== 'enterprise') {
        return res.status(403).json({
          error: 'Role-scoped invites require Enterprise plan',
        });
      }

      const { session, token } = await createCastSession({
        hostUserId: user.uid,
        projectId,
        inviteRole,
      });
      const origin = resolveTrustedAppOrigin(req, body);

      return res.status(200).json({
        session: mapSession(session),
        token,
        shareUrl: `${origin}/cast/${token}`,
        wsUrl: resolveCollabWsUrl(),
      });
    }

    const sessionId = requireUuid(body.sessionId, 'sessionId');
    await endCastSession(sessionId, user.uid);
    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof UntrustedAppOriginError) {
      return res.status(403).json({ error: error.message });
    }

    const message = error instanceof Error ? error.message : '';
    if (message === 'Forbidden') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (
      message.includes('not found') ||
      message.includes('not found or forbidden')
    ) {
      return res.status(404).json({ error: 'Cast session was not found.' });
    }

    return sendApiFailure(
      res,
      error,
      'cast/sessions',
      req.method === 'DELETE'
        ? 'Failed to end cast session.'
        : 'Failed to create cast session.',
    );
  }
}
