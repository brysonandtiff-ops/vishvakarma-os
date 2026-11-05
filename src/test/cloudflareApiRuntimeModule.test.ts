import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function readText(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

const legacyProvider = ['ver', 'cel'].join('');

describe('Cloudflare Pages API runtime boundary', () => {
  it('routes hardened Node-style API handlers through the Pages adapter', () => {
    const router = readText('functions/api/[[path]].ts');
    const adapter = readText('cloudflare/nodeHandlerAdapter.ts');

    expect(router).toContain("from '../../cloudflare/nodeHandlerAdapter'");
    expect(router).toContain('runNodeHandler');
    expect(router).toContain('NodeStyleHandler');
    expect(router.toLowerCase()).not.toContain(legacyProvider);

    expect(adapter).toContain('request.arrayBuffer()');
    expect(adapter).toContain('statusCode = 500');
    expect(adapter).toContain("'Cache-Control': 'private, no-store, max-age=0'");
    expect(adapter).toContain("'X-Content-Type-Options': 'nosniff'");
    expect(adapter.toLowerCase()).not.toContain(legacyProvider);
  });

  it('keeps source-level API checks and the browser toolchain on ES modules', () => {
    for (const configPath of [
      'tsconfig.api-check.json',
      'tsconfig.app.json',
      'tsconfig.node.json',
    ]) {
      const source = readText(configPath);
      expect(source).toMatch(/"module"\s*:\s*"ESNext"/);
      expect(source).toMatch(/"moduleResolution"\s*:\s*"bundler"/);
    }
  });

  it('avoids Stripe namespace types that break cross-runtime compilation', () => {
    expect(readText('api/_lib/stripeClient.ts')).toContain("import Stripe from 'stripe';");
    expect(readText('api/_lib/stripeClient.ts')).toContain('ReturnType<typeof createStripeClient>');

    for (const path of [
      'api/_lib/billingBackend.ts',
      'api/_lib/billingSupabase.ts',
      'api/_lib/stripeInvoice.ts',
      'api/stripe/webhook.ts',
    ]) {
      const source = readText(path);
      expect(source).not.toContain("import type Stripe from 'stripe';");
      expect(source).not.toContain("import Stripe = require('stripe');");
      expect(source).not.toMatch(/Stripe\.(Subscription|Metadata|Invoice|Checkout)/);
    }

    expect(readText('api/_lib/stripeShapes.ts')).toContain('StripeSubscriptionShape');
  });
});
