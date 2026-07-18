import {
  findUserIdByStripeCustomerId,
  resolveUserIdFromStripeMetadata,
  upsertBillingFromSubscription,
} from '../_lib/billingBackend';
import {
  applyApiSecurityHeaders,
  enforceApiMethod,
  type SecureApiRequest,
  type SecureApiResponse,
} from '../_lib/httpSecurity';
import { getStripeClient } from '../_lib/stripeClient';
import { getInvoiceSubscriptionId } from '../_lib/stripeInvoice';
import {
  expandableId,
  type StripeCheckoutSessionShape,
  type StripeInvoiceShape,
  type StripeMetadataShape,
  type StripeSubscriptionShape,
} from '../_lib/stripeShapes';

type WebhookRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export const MAX_STRIPE_WEBHOOK_BYTES = 1024 * 1024;

export class StripeWebhookPayloadTooLargeError extends Error {
  constructor() {
    super('Stripe webhook payload exceeds the allowed size.');
    this.name = 'StripeWebhookPayloadTooLargeError';
  }
}

function enforceBodyLimit(buffer: Buffer) {
  if (buffer.byteLength > MAX_STRIPE_WEBHOOK_BYTES) {
    throw new StripeWebhookPayloadTooLargeError();
  }
  return buffer;
}

export async function readRawBody(req: WebhookRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  if (req.on) {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      req.on?.('data', (...args: unknown[]) => {
        if (settled) return;
        const chunk = args[0];
        const buffer =
          typeof chunk === 'string'
            ? Buffer.from(chunk)
            : Buffer.isBuffer(chunk)
              ? chunk
              : null;

        if (!buffer) return;
        totalBytes += buffer.byteLength;
        if (totalBytes > MAX_STRIPE_WEBHOOK_BYTES) {
          fail(new StripeWebhookPayloadTooLargeError());
          return;
        }
        chunks.push(buffer);
      });
      req.on?.('end', () => {
        if (settled) return;
        settled = true;
        resolve();
      });
      req.on?.('error', fail);
    });
  }

  if (chunks.length > 0) {
    return enforceBodyLimit(Buffer.concat(chunks));
  }

  if (typeof req.body === 'string') {
    return enforceBodyLimit(Buffer.from(req.body));
  }

  if (Buffer.isBuffer(req.body)) {
    return enforceBodyLimit(req.body);
  }

  return enforceBodyLimit(Buffer.from(JSON.stringify(req.body ?? {})));
}

async function resolveUserId(
  customerId: string,
  metadata?: StripeMetadataShape | null,
): Promise<string | null> {
  const fromMetadata = await resolveUserIdFromStripeMetadata(metadata);
  if (fromMetadata) return fromMetadata;
  return findUserIdByStripeCustomerId(customerId);
}

export default async function handler(req: WebhookRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req as SecureApiRequest, res, ['POST'])) return;

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(503).json({ error: 'Webhook is temporarily unavailable.' });
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
        const session = event.data.object as unknown as StripeCheckoutSessionShape;
        const customerId = expandableId(session.customer);
        const subscriptionId = expandableId(session.subscription);

        if (!customerId || !subscriptionId) break;

        const uid =
          session.client_reference_id ??
          (await resolveUserId(customerId, session.metadata));

        if (!uid) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertBillingFromSubscription(
          uid,
          subscription as unknown as StripeSubscriptionShape,
          customerId,
        );
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as unknown as StripeSubscriptionShape;
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id;
        const uid = await resolveUserId(customerId, subscription.metadata);
        if (!uid) break;
        await upsertBillingFromSubscription(uid, subscription, customerId);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as StripeInvoiceShape;
        const customerId = expandableId(invoice.customer);
        const subscriptionId = getInvoiceSubscriptionId(invoice);

        if (!customerId || !subscriptionId) break;

        const uid = await resolveUserId(customerId, invoice.metadata);
        if (!uid) break;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertBillingFromSubscription(
          uid,
          subscription as unknown as StripeSubscriptionShape,
          customerId,
        );
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    if (error instanceof StripeWebhookPayloadTooLargeError) {
      return res.status(413).json({ error: 'Webhook payload is too large.' });
    }

    console.error('[stripe/webhook]', error);
    return res.status(400).json({ error: 'Webhook verification or processing failed.' });
  }
}
