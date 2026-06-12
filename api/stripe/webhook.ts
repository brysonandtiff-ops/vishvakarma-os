import type Stripe from 'stripe';
import {
  findUserIdByStripeCustomerId,
  resolveUserIdFromStripeMetadata,
  upsertBillingFromSubscription,
} from '../_lib/billingBackend';
import { getStripeClient } from '../_lib/stripeClient';
import { getInvoiceSubscriptionId } from '../_lib/stripeInvoice';

type VercelRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];

  await new Promise<void>((resolve, reject) => {
    req.on?.('data', (...args: unknown[]) => {
      const chunk = args[0];
      if (typeof chunk === 'string') {
        chunks.push(Buffer.from(chunk));
        return;
      }
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }
    });
    req.on?.('end', () => resolve());
    req.on?.('error', reject);
  });

  if (chunks.length > 0) {
    return Buffer.concat(chunks);
  }

  if (typeof req.body === 'string') {
    return Buffer.from(req.body);
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  return Buffer.from(JSON.stringify(req.body ?? {}));
}

async function resolveUserId(
  customerId: string,
  metadata?: Stripe.Metadata | null
): Promise<string | null> {
  const fromMetadata = await resolveUserIdFromStripeMetadata(metadata);
  if (fromMetadata) return fromMetadata;
  return findUserIdByStripeCustomerId(customerId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured.' });
  }

  try {
    const stripe = getStripeClient();
    const signature = req.headers?.['stripe-signature'];
    const sig = Array.isArray(signature) ? signature[0] : signature;

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header.' });
    }

    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (!customerId || !subscriptionId) break;

        const uid =
          session.client_reference_id ??
          (await resolveUserId(customerId, session.metadata));

        if (!uid) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertBillingFromSubscription(uid, subscription, customerId);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
        const uid = await resolveUserId(customerId, subscription.metadata);
        if (!uid) break;
        await upsertBillingFromSubscription(uid, subscription, customerId);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
        const subscriptionId = getInvoiceSubscriptionId(invoice);

        if (!customerId || !subscriptionId) break;

        const uid = await resolveUserId(customerId, invoice.metadata);
        if (!uid) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertBillingFromSubscription(uid, subscription, customerId);
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[stripe/webhook]', error);
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Webhook processing failed.',
    });
  }
}
