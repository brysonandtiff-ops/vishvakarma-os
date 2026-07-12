#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  process.env.VITE_SUPABASE_PROJECT_REF ??
  'jyocvwipthswfcmvqgqe';
const dryRun = process.argv.includes('--dry-run');

function run(command, args) {
  const result = spawnSync(command, args, {
    env: process.env,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if ((result.status ?? 1) !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status ?? 1}`);
  }
}

function requireAccessToken() {
  if (!process.env.SUPABASE_ACCESS_TOKEN?.trim()) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN is required for hosted Auth and API configuration. Keep it in your shell or secret manager, never Git.',
    );
  }
}

async function main() {
  console.log(`[supabase-platform-hardening] Project: ${projectRef}`);
  console.log('[supabase-platform-hardening] Policy: REST/RLS only, Google SSO, TOTP MFA, HIBP password defense.');

  if (dryRun) {
    run(process.execPath, ['scripts/setup-supabase-auth-hardening.mjs', '--dry-run']);
    console.log('[supabase-platform-hardening] Dry run complete; no remote settings changed.');
    return;
  }

  requireAccessToken();
  run('npx', ['supabase', 'link', '--project-ref', projectRef]);

  // Pushes supabase/config.toml, including removal of graphql_public from exposed
  // API schemas and TOTP enablement for the local/hosted Auth configuration.
  run('npx', ['supabase', 'config', 'push']);

  // The Management API owns hosted-only controls such as HIBP password checks.
  run(process.execPath, ['scripts/setup-supabase-auth-hardening.mjs']);

  console.log('[supabase-platform-hardening] Hosted Supabase hardening applied and verified.');
}

main().catch((error) => {
  console.error(
    '[supabase-platform-hardening] Failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
