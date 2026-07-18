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
  it('emits and type-checks API functions plus bundled src dependencies as CommonJS', () => {
    const rootConfig = readConfig('tsconfig.json');
    const apiCheckConfig = readConfig('tsconfig.api-check.json');
    const apiPackage = JSON.parse(readText('api/package.json')) as { type?: string };
    const srcPackage = JSON.parse(readText('src/package.json')) as { type?: string };

    for (const config of [rootConfig, apiCheckConfig]) {
      expect(config.compilerOptions?.module).toBe('CommonJS');
      expect(config.compilerOptions?.moduleResolution).toBe('Node');
    }
    expect(apiPackage.type).toBe('commonjs');
    expect(srcPackage.type).toBe('commonjs');
  });

  it('uses the Stripe v22 CommonJS TypeScript import form in server modules', () => {
    for (const path of [
      'api/_lib/stripeClient.ts',
      'api/_lib/billingBackend.ts',
      'api/_lib/billingSupabase.ts',
      'api/_lib/stripeInvoice.ts',
      'api/stripe/webhook.ts',
    ]) {
      expect(readText(path)).toContain("import Stripe = require('stripe');");
      expect(readText(path)).not.toContain("import type Stripe from 'stripe';");
    }
  });

  it('keeps the browser and Vite configs on ES modules', () => {
    for (const configPath of ['tsconfig.app.json', 'tsconfig.node.json']) {
      const source = readText(configPath);
      expect(source).toMatch(/"module"\s*:\s*"ESNext"/);
      expect(source).toMatch(/"moduleResolution"\s*:\s*"bundler"/);
    }
  });
});
