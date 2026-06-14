import type { IncomingMessage } from 'node:http';
import { getBillingRecord } from '../_lib/billingBackend';
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

function resolveAppOrigin(req: VercelRequest, body: Record<string, unknown>): string {
  const fromBody = typeof body.origin === 'string' ? body.origin.trim() : '';
  if (fromBody) return fromBody;

  const originHeader = req.headers.origin;
  if (typeof originHeader === 'string' && originHeader) return originHeader;

  return process.env.APP_URL?.trim() || 'https://vishvakarma-os.app';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyAuthTokenFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const billing = await getBillingRecord(user.uid);
    const customerId = billing?.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found. Complete checkout first.' });
    }

    const stripe = getStripeClient();
    const origin = resolveAppOrigin(req, parseJsonBody(req));
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/profile`,
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    console.error('[stripe/create-portal-session]', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create billing portal session.',
    });
  }
}
