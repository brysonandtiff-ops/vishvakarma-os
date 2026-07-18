import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type TypeScriptConfig = {
  compilerOptions?: {
    module?: string;
    moduleResolution?: string;
  };
};

function readText(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

function readConfig(path: string) {
  return JSON.parse(readText(path)) as TypeScriptConfig;
}

describe('Vercel API runtime module boundary', () => {
  it('emits API functions and bundled src dependencies as CommonJS', () => {
    const rootConfig = readConfig('tsconfig.json');
    const apiPackage = JSON.parse(readText('api/package.json')) as { type?: string };
    const srcPackage = JSON.parse(readText('src/package.json')) as { type?: string };

    expect(rootConfig.compilerOptions?.module).toBe('CommonJS');
    expect(rootConfig.compilerOptions?.moduleResolution).toBe('Node');
    expect(apiPackage.type).toBe('commonjs');
    expect(srcPackage.type).toBe('commonjs');
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

  it('avoids Stripe namespace types that break CommonJS function compilation', () => {
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
