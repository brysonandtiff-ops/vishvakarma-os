#!/usr/bin/env node
/** Run auth-gate and app-smoke Playwright projects with isolated e2e builds. */
import { execSync } from 'node:child_process';

const baseEnv = {
  ...process.env,
  VITE_BACKEND_PROVIDER: 'supabase',
  VITE_SUPABASE_URL: '',
  VITE_SUPABASE_ANON_KEY: '',
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_ALLOW_LOCAL_DEMO: '',
  PLAYWRIGHT_REUSE_SERVER: '',
};

function run(command, env) {
  execSync(command, {
    stdio: 'inherit',
    env: { ...baseEnv, ...env },
    shell: true,
  });
}

run('pnpm exec vite build --mode e2e', { VITE_E2E_ALLOW_LOCAL_ACCESS: '' });
run('pnpm exec playwright test --project=auth-gate', { VITE_E2E_ALLOW_LOCAL_ACCESS: '' });

run('pnpm exec vite build --mode e2e', { VITE_E2E_ALLOW_LOCAL_ACCESS: 'true' });
run('pnpm exec playwright test --project=app-smoke', { VITE_E2E_ALLOW_LOCAL_ACCESS: 'true' });
