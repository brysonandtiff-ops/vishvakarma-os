import { getBillingRecord } from '../_lib/billingBackend';
import {
  resolveTrustedAppOrigin,
  UntrustedAppOriginError,
} from '../_lib/appOrigin';
import {
  ApiRequestError,
  applyApiSecurityHeaders,
  enforceApiMethod,
  parseBoundedJsonBody,
  sendApiFailure,
  type SecureApiRequest,
  type SecureApiResponse,
} from '../_lib/httpSecurity';
import { getStripeClient } from '../_lib/stripeClient';
import { verifyAuthTokenFromRequest } from '../_lib/verifyAuthToken';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function parseRequestId(body: Record<string, unknown>): string | null {
  if (body.requestId === undefined) return null;
  if (typeof body.requestId !== 'string' || !REQUEST_ID_PATTERN.test(body.requestId)) {
    throw new ApiRequestError(400, 'Invalid billing portal request identifier.');
  }
  return body.requestId;
}

export default async function handler(req: SecureApiRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['POST'])) return;

  const user = await verifyAuthTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = parseBoundedJsonBody(req);
    const origin = resolveTrustedAppOrigin(req, body);
    const requestId = parseRequestId(body);
    const billing = await getBillingRecord(user.uid);
    const customerId = billing?.stripeCustomerId;

    if (!customerId || !customerId.startsWith('cus_')) {
      return res.status(400).json({ error: 'No Stripe customer found. Complete checkout first.' });
    }

    const stripe = getStripeClient();
    const portalSession = await stripe.billingPortal.sessions.create(
      {
        customer: customerId,
        return_url: `${origin}/profile`,
      },
      requestId
        ? { idempotencyKey: `vish-portal-${user.uid}-${requestId}` }
        : undefined,
    );

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    if (error instanceof UntrustedAppOriginError) {
      return res.status(403).json({ error: error.message });
    }
    return sendApiFailure(
      res,
      error,
      'stripe/create-portal-session',
      'Failed to create billing portal session.',
    );
  }
}
