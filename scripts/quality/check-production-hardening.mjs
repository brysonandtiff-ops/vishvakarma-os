#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${label}`);
    return '';
  }

  return readFileSync(path, 'utf8');
}

function requirePhrase(content, phrase, label) {
  if (!content.includes(phrase)) {
    failures.push(`${label} is missing required hardening phrase: ${phrase}`);
  }
}

function forbidPhrase(content, phrase, label) {
  if (content.includes(phrase)) {
    failures.push(`${label} contains forbidden regression phrase: ${phrase}`);
  }
}

const projectGateway = readRequiredFile(
  join(root, 'src/backend/supabase/supabaseProjectGateway.ts'),
  'src/backend/supabase/supabaseProjectGateway.ts',
);
const authGateway = readRequiredFile(
  join(root, 'src/backend/supabase/supabaseAuthGateway.ts'),
  'src/backend/supabase/supabaseAuthGateway.ts',
);
const collabMigration = readRequiredFile(
  join(root, 'supabase/migrations/20260213000005_collab_and_storage.sql'),
  'supabase/migrations/20260213000005_collab_and_storage.sql',
);
const collabServer = readRequiredFile(
  join(root, 'server/collab/presenceServer.ts'),
  'server/collab/presenceServer.ts',
);
const packageText = readRequiredFile(join(root, 'package.json'), 'package.json');
const app = readRequiredFile(join(root, 'src/App.tsx'), 'src/App.tsx');
const main = readRequiredFile(join(root, 'src/main.tsx'), 'src/main.tsx');
const viteConfig = readRequiredFile(join(root, 'vite.config.ts'), 'vite.config.ts');
const vercelBuild = readRequiredFile(
  join(root, 'scripts/vercel-build.mjs'),
  'scripts/vercel-build.mjs',
);
const artifactSecurity = readRequiredFile(
  join(root, 'scripts/security/check-dist-security.mjs'),
  'scripts/security/check-dist-security.mjs',
);

requirePhrase(projectGateway, 'collaborators: [userId]', 'Supabase project gateway');
requirePhrase(projectGateway, 'updateSupabaseProjectCollabSnapshot', 'Supabase project gateway');
requirePhrase(projectGateway, 'getSupabaseProjectCollabSnapshot', 'Supabase project gateway');

requirePhrase(collabMigration, 'collab_snapshot jsonb', 'Supabase collab migration');
requirePhrase(collabMigration, 'collaborators uuid[]', 'Supabase collab migration');
requirePhrase(collabMigration, 'projects_select_member', 'Supabase collab migration');
requirePhrase(collabMigration, "bucket_id = 'materials'", 'Supabase storage migration');

requirePhrase(collabServer, 'function normalizeOrigin', 'Collaboration presence server');
requirePhrase(collabServer, 'ALLOWED_ORIGINS.includes(normalized)', 'Collaboration presence server');
requirePhrase(collabServer, "process.env.ALLOW_MISSING_ORIGIN === 'true'", 'Collaboration presence server');
forbidPhrase(collabServer, 'origin.startsWith(allowed)', 'Collaboration presence server');

let packageJson = {};
try {
  packageJson = JSON.parse(packageText);
} catch {
  failures.push('package.json is not valid JSON');
}

if (packageJson.engines?.node !== '>=20 <25') {
  failures.push('package.json must keep the supported Node engine range at >=20 <25');
}
if (!String(packageJson.scripts?.['perf:gates'] ?? '').includes('check-pwa-precache.mjs')) {
  failures.push('package.json perf:gates must include the PWA precache budget');
}
forbidPhrase(packageText, '"firebase"', 'package.json');

requirePhrase(authGateway, 'LEGACY_SUPABASE_SESSION_KEY', 'Supabase auth gateway');
requirePhrase(authGateway, 'clearLegacyTokenSnapshot', 'Supabase auth gateway');
requirePhrase(authGateway, 'Supabase remains the single', 'Supabase auth gateway');
forbidPhrase(authGateway, 'idToken: string;', 'Supabase auth gateway');
forbidPhrase(authGateway, 'refreshToken: string;', 'Supabase auth gateway');
forbidPhrase(authGateway, 'storage.setItem(SUPABASE_SESSION_KEY', 'Supabase auth gateway');

requirePhrase(app, 'QA_TOOLS_ENABLED', 'App QA boundary');
requirePhrase(app, "lazy(() => import('@/components/qa/QaTools'))", 'App QA boundary');
forbidPhrase(main, 'DeviceValidationPanel', 'Production entrypoint');
forbidPhrase(main, 'vish-device-validation.css', 'Production entrypoint');

requirePhrase(viteConfig, 'filterEntryModulePreloads', 'Vite build configuration');
requirePhrase(viteConfig, 'VISH_BUILD_SOURCEMAPS', 'Vite build configuration');
requirePhrase(viteConfig, "sourcemap: buildSourceMaps ? 'hidden' : false", 'Vite build configuration');

requirePhrase(vercelBuild, "process.env.VERCEL === '1'", 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'scripts/security/check-dist-security.mjs', 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'pnpm run perf:gates', 'Vercel build orchestrator');

requirePhrase(artifactSecurity, 'service_role', 'Artifact security scanner');
requirePhrase(artifactSecurity, 'productionQaMarkers', 'Artifact security scanner');
requirePhrase(artifactSecurity, 'source maps are present', 'Artifact security scanner');

if (existsSync(join(root, 'firestore.rules'))) {
  failures.push('firestore.rules still exists — Firebase config should be removed.');
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS production hardening check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS production hardening check passed.');
console.log('Auth token ownership, QA boundaries, artifact security, PWA budgets, collaboration, and runtime policy are guarded.');
