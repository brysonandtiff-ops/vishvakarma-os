import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('Cloudflare Pages API runtime boundary', () => {
  it('typechecks Pages Functions and shared API handlers as bundled ES modules', () => {
    const config = read('tsconfig.api-check.json');
    expect(config).toContain('"./cloudflare/**/*.ts"');
    expect(config).toContain('"./functions/**/*.ts"');
    expect(config).toMatch(/"module"\s*:\s*"ESNext"/);
    expect(config).toMatch(/"moduleResolution"\s*:\s*"bundler"/);
  });

  it('keeps the Pages router and raw-body adapter provider-neutral', () => {
    const router = read('functions/api/[[path]].ts');
    const adapter = read('cloudflare/nodeHandlerAdapter.ts');

    expect(router).toContain('runNodeHandler');
    expect(router).toContain('NodeStyleHandler');
    expect(adapter).toContain('request.arrayBuffer()');
    expect(adapter).toContain('statusCode = 500');
  });

  it('preserves Stripe handler types across the Pages bundle', () => {
    expect(read('api/_lib/stripeClient.ts')).toContain("import Stripe from 'stripe';");
    expect(read('api/_lib/stripeClient.ts')).toContain('ReturnType<typeof createStripeClient>');

    for (const path of [
      'api/_lib/billingBackend.ts',
      'api/_lib/billingSupabase.ts',
      'api/_lib/stripeInvoice.ts',
      'api/stripe/webhook.ts',
    ]) {
      const source = read(path);
      expect(source).not.toContain("import type Stripe from 'stripe';");
      expect(source).not.toContain("import Stripe = require('stripe');");
      expect(source).not.toMatch(/Stripe\.(Subscription|Metadata|Invoice|Checkout)/);
    }
  });
});
