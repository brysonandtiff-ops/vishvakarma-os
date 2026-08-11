#!/usr/bin/env node

import { readdir, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { runCommand } from './lib/run-command.mjs';

const root = process.cwd();
const textureRoot = join(root, 'public', 'textures');
const srcRuntimePackagePath = join(root, 'src', 'package.json');
const removableTextureExtensions = new Set(['.jpg', '.jpeg']);
const isVercelBuild = process.env.VERCEL === '1';
const isCloudflareBuild = process.env.CF_PAGES === '1';

async function removeLegacyJpegTextures(directory) {
  let removed = 0;
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return 0;
    throw error;
  }
  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      removed += await removeLegacyJpegTextures(entryPath);
      continue;
    }
    if (entry.isFile() && removableTextureExtensions.has(extname(entry.name).toLowerCase())) {
      await rm(entryPath, { force: true });
      removed += 1;
    }
  }
  return removed;
}

async function writeVercelSrcRuntimeBoundary() {
  await writeFile(srcRuntimePackagePath, `${JSON.stringify({ private: true, type: 'commonjs' }, null, 2)}\n`, 'utf8');
  console.log('[build] Wrote Vercel CommonJS runtime boundary.');
}

const focusedTests = [
  'src/test/releaseGateHardening.test.ts',
  'src/test/vercelBuildGate.test.ts',
  'src/test/vercelApiRuntimeModule.test.ts',
  'src/test/serverRuntimeAliasBoundary.test.ts',
  'src/test/emailMagicLinkFallback.test.ts',
  'src/test/productionAuthVerifier.test.ts',
  'src/test/repositorySecretGuard.test.ts',
  'src/test/qaToolsGate.test.ts',
  'src/test/analyticsConsent.test.tsx',
  'src/test/monitoringPrivacy.test.ts',
  'src/test/pwaUpdateSafety.test.ts',
  'src/test/routeCssBoundary.test.ts',
  'src/test/supabaseApiVisibility.test.ts',
  'src/test/supabaseAuthHardeningConfig.test.ts',
  'src/backend/supabase/supabaseAuthCallback.test.ts',
  'src/backend/supabase/supabaseAuthPolicy.test.ts',
  'src/backend/supabase/supabaseMfaGateway.test.ts',
  'src/backend/supabase/mappers.test.ts',
  'src/components/auth/MfaChallengeGate.test.tsx',
  'src/services/billing/stripeCheckout.test.ts',
  'api/endpointHandlers.test.ts',
  'api/_lib/appOrigin.test.ts',
  'api/_lib/httpSecurity.test.ts',
  'api/_lib/verifySupabaseToken.test.ts',
  'api/stripe/create-checkout-session.test.ts',
  'api/stripe/webhook.test.ts',
];

const focusedRegressionCommand = `pnpm exec vitest run ${focusedTests.join(' ')}`;

const vercelSteps = [
  { label: 'Repository secret guard', command: 'node scripts/security/check-repository-secrets.mjs' },
  { label: 'Lint', command: 'pnpm run lint' },
  { label: 'Production hardening', command: 'pnpm run hardening:gates' },
  { label: 'Focused regression tests', command: focusedRegressionCommand },
  { label: 'Full unit suite', command: 'pnpm run test' },
  { label: 'Production build', command: 'pnpm run build' },
  { label: 'Artifact security', command: 'node scripts/security/check-dist-security.mjs' },
  { label: 'Performance budgets', command: 'pnpm run perf:gates' },
];

const cloudflareSteps = [
  { label: 'Repository secret guard', command: 'node scripts/security/check-repository-secrets.mjs' },
  { label: 'Cloudflare configuration certification', command: 'node scripts/deployment/verify-cloudflare-config.mjs' },
  { label: 'Application and Pages runtime typecheck', command: 'pnpm run lint:types' },
  { label: 'Production-focused regression tests', command: focusedRegressionCommand },
  { label: 'Production build', command: 'pnpm run build' },
  { label: 'Artifact security', command: 'node scripts/security/check-dist-security.mjs' },
  { label: 'Bundle budget', command: 'node scripts/performance/check-bundle-budget.mjs' },
];

async function main() {
  if (isVercelBuild) {
    const removedTextures = await removeLegacyJpegTextures(textureRoot);
    console.log(`[build] Removed ${removedTextures} legacy JPEG texture file(s).`);
  } else {
    console.log('[build] Cloudflare/local run detected; skipping destructive texture cleanup.');
  }
  const steps = isCloudflareBuild ? cloudflareSteps : vercelSteps;
  for (const step of steps) {
    console.log(`\n[build] ${step.label}`);
    runCommand(step.command, { stdio: 'inherit' });
  }
  if (isVercelBuild) await writeVercelSrcRuntimeBoundary();
  console.log(`\n[build] ${isCloudflareBuild ? 'Cloudflare' : 'Vercel/local'} quality and build gates passed.`);
}

main().catch((error) => {
  console.error('[build] Failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
