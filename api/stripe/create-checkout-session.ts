import type { IncomingMessage } from 'node:http';
import {
  getBillingRecord,
  upsertBillingRecord,
} from '../_lib/billingBackend';
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

  const referer = req.headers.referer;
  if (typeof referer === 'string') {
    try {
      return new URL(referer).origin;
    } catch {
      // ignore invalid referer
    }
  }

  return process.env.APP_URL?.trim() || 'http://127.0.0.1:5173';
}

function parseCheckoutPlan(body: Record<string, unknown>): CheckoutPlan {
  return body.plan === 'enterprise' ? 'enterprise' : 'studio';
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
    const stripe = getStripeClient();
    const body = parseJsonBody(req);
    const plan = parseCheckoutPlan(body);
    const priceId = getPriceIdForPlan(plan);
    const origin = resolveAppOrigin(req, body);

    const existingBilling = await getBillingRecord(user.uid);
    let customerId = existingBilling?.stripeCustomerId;

    const uidKey = authMetadataUidKey();
    const uidValue = user.uid;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { [uidKey]: uidValue, firebaseUid: uidValue, supabaseUid: uidValue },
      });
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
      metadata: { [uidKey]: uidValue, firebaseUid: uidValue, supabaseUid: uidValue, plan },
    };

    if (plan === 'studio') {
      subscriptionData.trial_period_days = STUDIO_TRIAL_DAYS;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.uid,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: subscriptionData,
      metadata: { [uidKey]: uidValue, firebaseUid: uidValue, supabaseUid: uidValue, plan },
      success_url: `${origin}/profile?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
    });

    if (!session.url) {
      return res.status(500).json({ error: 'Stripe checkout session missing redirect URL' });
    }

    return res.status(200).json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout session';
    console.error('[stripe/create-checkout-session]', message);
    return res.status(500).json({ error: message });
  }
}
