import { describe, expect, it } from 'vitest';
import { forbiddenTrackedPathReason } from './forbidden-tracked-paths.mjs';

describe('S.I.R.E. LAW 105 — tracked credential material never returns to source', () => {
  it.each([
    '.local/cloudflare-auth/storage-state.json',
    'tools/.local/supabase-login.clixml',
    '.wrangler/state/v3/d1/database.sqlite',
    '.vercel/project.json',
    'dist/assets/app.js',
    'packages/example/dist/bundle.js',
    'scripts/legacy/stripe-server-key.clixml',
    'playwright/.auth/user.json',
    'e2e/storage_state.json',
    'e2e/storage-state.json',
    'playwright/auth.json',
    '.LOCAL\\cloudflare-proof\\snapshot.clixml',
  ])('rejects forbidden tracked path %s', (filename) => {
    expect(forbiddenTrackedPathReason(filename)).toBeTruthy();
  });

  it.each([
    'src/pages/EditorPage.tsx',
    'scripts/security/check-repository-secrets.mjs',
    'docs/security/incident.md',
    '.env.example',
    'public/samples/house.json',
    'src/components/LocalDraft.tsx',
    'src/styles/distribution.css',
  ])('does not reject ordinary source path %s', (filename) => {
    expect(forbiddenTrackedPathReason(filename)).toBeNull();
  });

  it('does not interpret unknown or empty paths as a secret', () => {
    expect(forbiddenTrackedPathReason(undefined)).toBeNull();
    expect(forbiddenTrackedPathReason('')).toBeNull();
  });
});
