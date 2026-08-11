#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const liveUrl = process.argv[2]?.trim();
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

function run(command, args) {
  console.log(`\n[release] ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('node', ['scripts/security/check-repository-secrets.mjs']);
run('node', ['scripts/deployment/verify-cloudflare-config.mjs']);
run('pnpm', ['run', 'lint:types']);
run('pnpm', ['exec', 'vitest', 'run', ...focusedTests]);
run('pnpm', ['run', 'build']);
run('node', ['scripts/security/check-dist-security.mjs']);
run('pnpm', ['run', 'perf:gates']);

if (liveUrl) {
  run('node', ['scripts/deployment/verify-cloudflare-live.mjs', liveUrl]);
} else {
  console.log('\n[release] Local certification passed. Provide a Pages URL to include live HTTP proof.');
}

console.log('\n[release] VISHVAKARMA Cloudflare release certification PASSED');
