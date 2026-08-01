import { Buffer } from 'node:buffer';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  applyApiSecurityHeaders,
  enforceApiMethod,
  type SecureApiRequest,
  type SecureApiResponse,
} from '../_lib/httpSecurity';
import stripeWebhook from './webhook';

type ProofRequest = SecureApiRequest & {
  url?: string;
};

type CapturedResponse = {
  statusCode: number;
  body: unknown;
};

const PROOF_TOKEN_HEADER = 'x-vish-proof-token';

function firstHeader(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return typeof value === 'string' ? value : null;
}

export function constantTimeSecretEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.byteLength !== rightBuffer.byteLength) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createStripeProofSignature(
  payload: string,
  webhookSecret: string,
  timestamp: number,
): string {
  const digest = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

async function invokeWebhookProof(
  payload: string,
  signature: string,
): Promise<CapturedResponse> {
  const captured: CapturedResponse = {
    statusCode: 200,
    body: null,
  };

  const response = {} as SecureApiResponse;
  response.status = (code: number) => {
    captured.statusCode = code;
    return response;
  };
  response.setHeader = () => undefined;
  response.json = (body: unknown) => {
    captured.body = body;
  };

  await stripeWebhook(
    {
      method: 'POST',
      headers: { 'stripe-signature': signature },
      body: Buffer.from(payload),
    },
    response,
  );

  return captured;
}

/**
 * Ephemeral release-proof endpoint.
 *
 * It is inert unless CLOUDFLARE_PROOF_TOKEN is temporarily configured. The
 * release controller uploads a random token, calls this endpoint once, and
 * immediately deletes the token. The Stripe webhook secret never leaves the
 * Cloudflare runtime.
 */
export default async function handler(req: ProofRequest, res: SecureApiResponse) {
  applyApiSecurityHeaders(res);
  if (!enforceApiMethod(req, res, ['POST'])) return;

  const expectedProofToken = process.env.CLOUDFLARE_PROOF_TOKEN?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const suppliedProofToken = firstHeader(req.headers[PROOF_TOKEN_HEADER])?.trim();

  // Return the same response for missing configuration and invalid tokens so
  // the endpoint does not reveal whether proof mode is armed.
  if (
    !expectedProofToken ||
    !webhookSecret ||
    !suppliedProofToken ||
    !constantTimeSecretEquals(suppliedProofToken, expectedProofToken)
  ) {
    return res.status(404).json({ error: 'Endpoint not found.' });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: `evt_vish_cloudflare_proof_${timestamp}`,
    object: 'event',
    created: timestamp,
    data: { object: {} },
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
    type: 'vish.cloudflare.webhook_proof',
  });
  const signature = createStripeProofSignature(payload, webhookSecret, timestamp);
  const captured = await invokeWebhookProof(payload, signature);
  const body = captured.body as { received?: unknown } | null;

  if (captured.statusCode !== 200 || body?.received !== true) {
    console.error('[stripe/proof-webhook] Internal signed webhook proof failed', {
      statusCode: captured.statusCode,
    });
    return res.status(502).json({ error: 'Signed webhook proof failed.' });
  }

  return res.status(200).json({
    ok: true,
    received: true,
    proof: 'server-side-stripe-signature',
  });
}
