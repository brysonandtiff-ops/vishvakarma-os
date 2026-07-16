#!/usr/bin/env node

import { readdir, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { runCommand } from './lib/run-command.mjs';

const root = process.cwd();
const textureRoot = join(root, 'public', 'textures');
const removableTextureExtensions = new Set(['.jpg', '.jpeg']);
const isVercelBuild = process.env.VERCEL === '1';
const isCertificationBuild = isVercelBuild;

async function removeLegacyJpegTextures(directory) {
  let removed = 0;
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return 0;
    }
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

const focusedTests = [
  'src/test/releaseGateHardening.test.ts',
  'src/test/vercelBuildGate.test.ts',
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

const steps = [
  { label: 'Lint', command: 'pnpm run lint' },
  // hardening:gates includes the recursive API endpoint inventory.
  { label: 'Production hardening', command: 'pnpm run hardening:gates' },
  {
    label: 'Focused regression tests',
    command: `pnpm exec vitest run ${focusedTests.join(' ')}`,
  },
  { label: 'Full unit suite', command: 'pnpm run test' },
  { label: 'Production build', command: 'pnpm run build' },
  {
    label: 'Artifact security',
    command: 'node scripts/security/check-dist-security.mjs',
  },
  { label: 'Performance budgets', command: 'pnpm run perf:gates' },
];

const certificationSteps = [
  {
    label: 'Install browser runtimes and system dependencies',
    command: 'pnpm exec playwright install --with-deps chromium firefox webkit',
  },
  {
    label: 'Chromium, Firefox, and WebKit E2E',
    command: 'pnpm run test:e2e',
    env: { PLAYWRIGHT_BROWSERS: 'all' },
  },
  {
    label: 'Accessibility browser audit',
    command: 'pnpm run test:e2e:a11y',
  },
  {
    label: 'Editor performance browser audit',
    command: 'pnpm run test:e2e:perf',
  },
  {
    label: 'Production auth route verification',
    command: 'pnpm run verify:production-auth-flow',
    env: { PRODUCTION_AUTH_URL: 'https://vishvakarma-os.app/auth' },
  },
  { label: 'Strict release gates', command: 'pnpm run release:gates:strict' },
  { label: 'Strict launch evidence gates', command: 'pnpm run launch:evidence:strict' },
];

function runStep(step) {
  console.log(`\n[vercel-build] ${step.label}`);
  runCommand(step.command, {
    stdio: 'inherit',
    env: { ...process.env, ...(step.env ?? {}) },
  });
}

async function main() {
  if (isVercelBuild) {
    const removedTextures = await removeLegacyJpegTextures(textureRoot);
    console.log(`[vercel-build] Removed ${removedTextures} legacy JPEG texture file(s).`);
  } else {
    console.log('[vercel-build] Local run detected; skipping destructive texture cleanup.');
  }

  for (const step of steps) runStep(step);

  if (isCertificationBuild) {
    const hasManagementToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN?.trim());
    console.log(
      `[vercel-certification] Supabase management credential: ${hasManagementToken ? 'configured' : 'not configured'}`,
    );

    if (hasManagementToken) {
      runStep({
        label: 'Hosted Supabase HIBP and TOTP hardening',
        command: 'pnpm run setup:supabase-auth:hardening',
      });
    } else {
      console.warn(
        '[vercel-certification] Hosted Auth mutation skipped because SUPABASE_ACCESS_TOKEN is unavailable.',
      );
    }

    for (const step of certificationSteps) runStep(step);
    console.log('\n[vercel-certification] Browser and strict release certification passed.');
  }

  console.log('\n[vercel-build] All quality and build gates passed.');
}

main().catch((error) => {
  console.error(
    '[vercel-build] Failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
