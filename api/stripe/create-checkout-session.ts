import type { IncomingMessage } from 'node:http';
import {
  getBillingRecord,
  upsertBillingRecord,
} from '../_lib/billingBackend';
import {
  resolveTrustedAppOrigin,
  UntrustedAppOriginError,
} from '../_lib/appOrigin';
import { getPriceIdForPlan, getStripeClient, type CheckoutPlan } from '../_lib/stripeClient';
import { authMetadataUidKey, verifyAuthTokenFromRequest } from '../_lib/verifyAuthToken';
import { STUDIO_TRIAL_DAYS } from '../../src/config/billingPlans';

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

class InvalidCheckoutRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCheckoutRequestError';
  }
}

const EXISTING_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

function parseJsonBody(req: VercelRequest): Record<string, unknown> {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new InvalidCheckoutRequestError('Request body must be a JSON object.');
      }
      return parsed as Record<string, unknown>;
    } catch (error) {
      if (error instanceof InvalidCheckoutRequestError) throw error;
      throw new InvalidCheckoutRequestError('Request body is not valid JSON.');
    }
  }
  if (typeof req.body === 'object' && !Array.isArray(req.body)) {
    return req.body as Record<string, unknown>;
  }
  throw new InvalidCheckoutRequestError('Request body must be a JSON object.');
}

export function parseCheckoutPlan(body: Record<string, unknown>): CheckoutPlan {
  if (body.plan === undefined) return 'studio';
  if (body.plan === 'studio' || body.plan === 'enterprise') return body.plan;
  throw new InvalidCheckoutRequestError('Unsupported checkout plan.');
}

function parseRequestId(body: Record<string, unknown>): string | null {
  if (body.requestId === undefined) return null;
  if (typeof body.requestId !== 'string' || !REQUEST_ID_PATTERN.test(body.requestId)) {
    throw new InvalidCheckoutRequestError('Invalid checkout request identifier.');
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
    const plan = parseCheckoutPlan(body);
    const requestId = parseRequestId(body);
    const origin = resolveTrustedAppOrigin(req, body);
    const priceId = getPriceIdForPlan(plan);
    const stripe = getStripeClient();

    const existingBilling = await getBillingRecord(user.uid);
    if (
      existingBilling?.stripeSubscriptionId &&
      EXISTING_SUBSCRIPTION_STATUSES.has(existingBilling.status)
    ) {
      return res.status(409).json({
        error: 'An active subscription already exists. Use the billing portal to manage it.',
      });
    }

    let customerId = existingBilling?.stripeCustomerId;
    const uidKey = authMetadataUidKey();
    const uidValue = user.uid;

    if (!customerId) {
      const customer = await stripe.customers.create(
        {
          email: user.email,
          metadata: { [uidKey]: uidValue },
        },
        { idempotencyKey: `vish-customer-${uidValue}` },
      );
      customerId = customer.id;
      await upsertBillingRecord(user.uid, {
        stripeCustomerId: customerId,
        plan: 'starter',
        status: 'none',
      });
    }

    const subscriptionData: {
      metadata: Record<string, string>;
      trial_period_days?: number;
    } = {
      metadata: { [uidKey]: uidValue, plan },
    };

    if (plan === 'studio') {
      subscriptionData.trial_period_days = STUDIO_TRIAL_DAYS;
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'subscription',
        customer: customerId,
        client_reference_id: user.uid,
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: subscriptionData,
        metadata: { [uidKey]: uidValue, plan },
        success_url: `${origin}/profile?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=canceled`,
      },
      requestId
        ? { idempotencyKey: `vish-checkout-${uidValue}-${plan}-${requestId}` }
        : undefined,
    );

    if (!session.url) {
      console.error('[stripe/create-checkout-session] Stripe returned no redirect URL');
      return res.status(502).json({ error: 'Checkout provider did not return a redirect URL.' });
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    if (error instanceof UntrustedAppOriginError) {
      return res.status(403).json({ error: error.message });
    }
    if (error instanceof InvalidCheckoutRequestError) {
      return res.status(400).json({ error: error.message });
    }

    console.error('[stripe/create-checkout-session]', error);
    return res.status(500).json({ error: 'Failed to create checkout session.' });
  }
}
