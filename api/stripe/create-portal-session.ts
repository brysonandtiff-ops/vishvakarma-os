import type { IncomingMessage } from 'node:http';
import { getBillingRecord } from '../_lib/billingBackend';
import {
  resolveTrustedAppOrigin,
  UntrustedAppOriginError,
} from '../_lib/appOrigin';
import { getStripeClient } from '../_lib/stripeClient';
import { verifyAuthTokenFromRequest } from '../_lib/verifyAuthToken';

type VercelRequest = IncomingMessage & {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
};

class InvalidPortalRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPortalRequestError';
  }
}

const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function parseJsonBody(req: VercelRequest): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new InvalidPortalRequestError('Request body must be a JSON object.');
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      if (error instanceof InvalidPortalRequestError) throw error;
      throw new InvalidPortalRequestError('Request body is not valid JSON.');
    }
  }
  if (typeof req.body === 'object' && !Array.isArray(req.body)) {
    return req.body as Record<string, unknown>;
  }
  throw new InvalidPortalRequestError('Request body must be a JSON object.');
}

function parseRequestId(body: Record<string, unknown>): string | null {
  if (body.requestId === undefined) return null;
  if (typeof body.requestId !== 'string' || !REQUEST_ID_PATTERN.test(body.requestId)) {
    throw new InvalidPortalRequestError('Invalid billing portal request identifier.');
  }
  return body.requestId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader?.('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader?.('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuthTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = parseJsonBody(req);
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
    if (error instanceof InvalidPortalRequestError) {
      return res.status(400).json({ error: error.message });
    }

    console.error('[stripe/create-portal-session]', error);
    return res.status(500).json({ error: 'Failed to create billing portal session.' });
  }
}
