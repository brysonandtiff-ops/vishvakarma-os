import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  MAX_STRIPE_WEBHOOK_BYTES,
  readRawBody,
  StripeWebhookPayloadTooLargeError,
} from './webhook';

describe('Stripe webhook raw body handling', () => {
  it('returns a small string body unchanged', async () => {
    await expect(readRawBody({ body: '{"type":"checkout.session.completed"}' })).resolves.toEqual(
      Buffer.from('{"type":"checkout.session.completed"}'),
    );
  });

  it('reads a streamed body without re-serializing it', async () => {
    const stream = Readable.from([Buffer.from('first-'), Buffer.from('second')]);

    await expect(readRawBody(stream)).resolves.toEqual(Buffer.from('first-second'));
  });

  it('rejects an oversized pre-buffered payload', async () => {
    await expect(
      readRawBody({ body: Buffer.alloc(MAX_STRIPE_WEBHOOK_BYTES + 1) }),
    ).rejects.toBeInstanceOf(StripeWebhookPayloadTooLargeError);
  });

  it('rejects a streamed payload as soon as the cumulative limit is exceeded', async () => {
    const stream = Readable.from([
      Buffer.alloc(MAX_STRIPE_WEBHOOK_BYTES),
      Buffer.from('x'),
    ]);

    await expect(readRawBody(stream)).rejects.toBeInstanceOf(
      StripeWebhookPayloadTooLargeError,
    );
  });
});
