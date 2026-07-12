import {
  getBillingRecord,
  upsertBillingRecord,
} from '../_lib/billingBackend';
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
import { getPriceIdForPlan, getStripeClient, type CheckoutPlan } from '../_lib/stripeClient';
import { authMetadataUidKey, verifyAuthTokenFromRequest } from '../_lib/verifyAuthToken';
import { STUDIO_TRIAL_DAYS } from '../../src/config/billingPlans';

const EXISTING_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due']);
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;

export function parseCheckoutPlan(body: Record<string, unknown>): CheckoutPlan {
  if (body.plan === undefined) return 'studio';
  if (body.plan === 'studio' || body.plan === 'enterprise') return body.plan;
  throw new ApiRequestError(400, 'Unsupported checkout plan.');
}

function parseRequestId(body: Record<string, unknown>): string | null {
  if (body.requestId === undefined) return null;
  if (typeof body.requestId !== 'string' || !REQUEST_ID_PATTERN.test(body.requestId)) {
    throw new ApiRequestError(400, 'Invalid checkout request identifier.');
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
    return sendApiFailure(
      res,
      error,
      'stripe/create-checkout-session',
      'Failed to create checkout session.',
    );
  }
}
