import { joinCastByToken, resolveCollabWsUrl } from '../_lib/castBackend';
import {
  ApiRequestError,
  applyApiSecurityHeaders,
  enforceApiMethod,
  sendApiFailure,
  type SecureApiRequest,
  type SecureApiResponse,
} from '../_lib/httpSecurity';

const CAST_TOKEN_PATTERN = /^[0-9a-f]{64}$/i;

function parseToken(req: SecureApiRequest): string {
  if (!req.url) throw new ApiRequestError(400, 'token query parameter is required');

  try {
    const token = new URL(req.url, 'http://localhost').searchParams.get('token')?.trim();
    if (!token) throw new ApiRequestError(400, 'token query parameter is required');
    if (!CAST_TOKEN_PATTERN.test(token)) {
      throw new ApiRequestError(404, 'Cast invitation is invalid or expired.');
    }
    return token;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(400, 'token query parameter is invalid');
  }
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

export default async function handler(req: SecureApiRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['GET'])) return;

  try {
    const token = parseToken(req);
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
    const message = error instanceof Error ? error.message : '';
    if (
      message.includes('Invalid cast token') ||
      message.includes('expired') ||
      message.includes('usage limit') ||
      message.includes('not live') ||
      message.includes('Project not found')
    ) {
      return res.status(404).json({ error: 'Cast invitation is invalid or expired.' });
    }
    return sendApiFailure(res, error, 'cast/join', 'Cast join failed.');
  }
}
