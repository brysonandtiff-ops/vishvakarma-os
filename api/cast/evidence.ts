import {
  fetchCastEvidence,
  resolveUserPlanTier,
} from '../_lib/castBackend';
import { verifyAuthTokenFromRequest } from '../_lib/verifyAuthToken';
import {
  ApiRequestError,
  applyApiSecurityHeaders,
  enforceApiMethod,
  sendApiFailure,
  type SecureApiRequest,
  type SecureApiResponse,
} from '../_lib/httpSecurity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseSessionId(req: SecureApiRequest): string {
  if (!req.url) throw new ApiRequestError(400, 'sessionId query parameter is required');

  try {
    const value = new URL(req.url, 'http://localhost').searchParams.get('sessionId')?.trim();
    if (!value) throw new ApiRequestError(400, 'sessionId query parameter is required');
    if (!UUID_PATTERN.test(value)) {
      throw new ApiRequestError(400, 'sessionId is invalid');
    }
    return value;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(400, 'sessionId query parameter is invalid');
  }
}

export default async function handler(req: SecureApiRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['GET'])) return;

  const user = await verifyAuthTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const tier = await resolveUserPlanTier(user.uid, user.email);
    if (tier !== 'enterprise') {
      return res.status(403).json({
        error: 'Cast evidence export requires Enterprise plan',
      });
    }

    const evidence = await fetchCastEvidence(parseSessionId(req), user.uid);
    return res.status(200).json({ evidence });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'Forbidden') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (message.includes('not found')) {
      return res.status(404).json({ error: 'Cast evidence was not found.' });
    }
    return sendApiFailure(
      res,
      error,
      'cast/evidence',
      'Failed to fetch cast evidence.',
    );
  }
}
