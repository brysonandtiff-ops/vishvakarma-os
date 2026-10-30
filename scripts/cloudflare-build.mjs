#!/usr/bin/env node

import { runCommand } from './lib/run-command.mjs';

const focusedTests = [
  'src/test/releaseGateHardening.test.ts',
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

const cloudflareSteps = [
  { label: 'Repository secret guard', command: 'node scripts/security/check-repository-secrets.mjs' },
  { label: 'Cloudflare configuration certification', command: 'node scripts/deployment/verify-cloudflare-config.mjs' },
  { label: 'Application and Pages runtime typecheck', command: 'pnpm run lint:types' },
  { label: 'Production-focused regression tests', command: focusedRegressionCommand },
  { label: 'Production build', command: 'pnpm run build' },
  { label: 'Artifact security', command: 'node scripts/security/check-dist-security.mjs' },
  { label: 'Performance budgets', command: 'pnpm run perf:gates' },
];

async function main() {
  console.log('[build] Cloudflare Pages quality pipeline.');
  for (const step of cloudflareSteps) {
    console.log(`\n[build] ${step.label}`);
    runCommand(step.command, { stdio: 'inherit' });
  }
  console.log('\n[build] Cloudflare quality and build gates passed.');
}

main().catch((error) => {
  console.error('[build] Failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
