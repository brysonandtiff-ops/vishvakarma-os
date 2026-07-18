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
  if (!content.includes(phrase)) failures.push(`${label} is missing required hardening phrase: ${phrase}`);
}

function forbidPhrase(content, phrase, label) {
  if (content.includes(phrase)) failures.push(`${label} contains forbidden regression phrase: ${phrase}`);
}

const projectGateway = readRequiredFile(join(root, 'src/backend/supabase/supabaseProjectGateway.ts'), 'src/backend/supabase/supabaseProjectGateway.ts');
const authGateway = readRequiredFile(join(root, 'src/backend/supabase/supabaseAuthGateway.ts'), 'src/backend/supabase/supabaseAuthGateway.ts');
const apiTokenVerifier = readRequiredFile(join(root, 'api/_lib/verifySupabaseToken.ts'), 'api/_lib/verifySupabaseToken.ts');
const appOrigin = readRequiredFile(join(root, 'api/_lib/appOrigin.ts'), 'api/_lib/appOrigin.ts');
const checkoutApi = readRequiredFile(join(root, 'api/stripe/create-checkout-session.ts'), 'api/stripe/create-checkout-session.ts');
const portalApi = readRequiredFile(join(root, 'api/stripe/create-portal-session.ts'), 'api/stripe/create-portal-session.ts');
const webhookApi = readRequiredFile(join(root, 'api/stripe/webhook.ts'), 'api/stripe/webhook.ts');
const collabMigration = readRequiredFile(join(root, 'supabase/migrations/20260213000005_collab_and_storage.sql'), 'supabase/migrations/20260213000005_collab_and_storage.sql');
const securityMigration = readRequiredFile(join(root, 'supabase/migrations/20260711194500_production_security_hardening.sql'), 'supabase/migrations/20260711194500_production_security_hardening.sql');
const collabServer = readRequiredFile(join(root, 'server/collab/presenceServer.ts'), 'server/collab/presenceServer.ts');
const packageText = readRequiredFile(join(root, 'package.json'), 'package.json');
const app = readRequiredFile(join(root, 'src/App.tsx'), 'src/App.tsx');
const main = readRequiredFile(join(root, 'src/main.tsx'), 'src/main.tsx');
const analytics = readRequiredFile(join(root, 'src/lib/analytics.ts'), 'src/lib/analytics.ts');
const consentAnalytics = readRequiredFile(join(root, 'src/components/common/ConsentAnalytics.tsx'), 'src/components/common/ConsentAnalytics.tsx');
const monitoring = readRequiredFile(join(root, 'src/lib/monitoring.ts'), 'src/lib/monitoring.ts');
const viteConfig = readRequiredFile(join(root, 'vite.config.ts'), 'vite.config.ts');
const vercelConfig = readRequiredFile(join(root, 'vercel.json'), 'vercel.json');
const vercelBuild = readRequiredFile(join(root, 'scripts/vercel-build.mjs'), 'scripts/vercel-build.mjs');
const artifactSecurity = readRequiredFile(join(root, 'scripts/security/check-dist-security.mjs'), 'scripts/security/check-dist-security.mjs');

requirePhrase(projectGateway, 'collaborators: [userId]', 'Supabase project gateway');
requirePhrase(projectGateway, 'updateSupabaseProjectCollabSnapshot', 'Supabase project gateway');
requirePhrase(projectGateway, 'getSupabaseProjectCollabSnapshot', 'Supabase project gateway');

requirePhrase(collabMigration, 'collab_snapshot jsonb', 'Supabase collab migration');
requirePhrase(collabMigration, 'collaborators uuid[]', 'Supabase collab migration');
requirePhrase(collabMigration, 'projects_select_member', 'Supabase collab migration');
requirePhrase(collabMigration, "bucket_id = 'materials'", 'Supabase storage migration');

requirePhrase(securityMigration, 'add column if not exists actor_id uuid', 'Security migration');
requirePhrase(securityMigration, 'actor_id = (select auth.uid())', 'Security migration');
requirePhrase(securityMigration, 'revoke all privileges on table public.ai_usage', 'Security migration');
requirePhrase(securityMigration, 'alter function public.is_admin() set schema app_private', 'Security migration');

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

if (packageJson.engines?.node !== '>=20 <25') failures.push('package.json must keep the supported Node engine range at >=20 <25');
if (!String(packageJson.scripts?.['perf:gates'] ?? '').includes('check-pwa-precache.mjs')) failures.push('package.json perf:gates must include the PWA precache budget');
forbidPhrase(packageText, '"firebase"', 'package.json');

requirePhrase(authGateway, 'LEGACY_SUPABASE_SESSION_KEY', 'Supabase auth gateway');
requirePhrase(authGateway, 'clearLegacyTokenSnapshot', 'Supabase auth gateway');
requirePhrase(authGateway, 'Supabase remains the single', 'Supabase auth gateway');
requirePhrase(authGateway, "SUPPORTED_AUTH_PROVIDERS = ['google', 'email']", 'Supabase auth gateway');
requirePhrase(authGateway, 'buildAuthorizedSessionOrSignOut', 'Supabase auth gateway');
requirePhrase(authGateway, 'Password sign-in is disabled', 'Supabase auth gateway');
requirePhrase(authGateway, 'client.auth.signInWithOtp', 'Supabase auth gateway');
requirePhrase(authGateway, 'shouldCreateUser: false', 'Supabase auth gateway');
requirePhrase(authGateway, 'client.auth.verifyOtp', 'Supabase auth gateway');
forbidPhrase(authGateway, 'idToken: string;', 'Supabase auth gateway');
forbidPhrase(authGateway, 'refreshToken: string;', 'Supabase auth gateway');
forbidPhrase(authGateway, 'storage.setItem(SUPABASE_SESSION_KEY', 'Supabase auth gateway');
forbidPhrase(authGateway, 'client.auth.signInWithPassword', 'Supabase auth gateway');

requirePhrase(apiTokenVerifier, 'isSupportedSupabaseApiUser', 'Supabase API token verifier');
requirePhrase(apiTokenVerifier, 'verifySupabaseBearerToken', 'Supabase API token verifier');
requirePhrase(apiTokenVerifier, "SUPPORTED_AUTH_PROVIDERS = new Set(['google', 'email'])", 'Supabase API token verifier');
requirePhrase(apiTokenVerifier, 'MAX_BEARER_TOKEN_LENGTH', 'Supabase API token verifier');

requirePhrase(appOrigin, 'resolveTrustedAppOrigin', 'Trusted app origin policy');
requirePhrase(appOrigin, 'UntrustedAppOriginError', 'Trusted app origin policy');
requirePhrase(appOrigin, 'VERCEL_TEAM_SUFFIX', 'Trusted app origin policy');
requirePhrase(appOrigin, "env.VERCEL !== '1'", 'Trusted app origin policy');

for (const [content, label] of [[checkoutApi, 'Stripe checkout API'], [portalApi, 'Stripe portal API']]) {
  requirePhrase(content, 'resolveTrustedAppOrigin', label);
  requirePhrase(content, 'applyApiSecurityHeaders', label);
  requirePhrase(content, 'UntrustedAppOriginError', label);
  forbidPhrase(content, 'const fromBody', label);
}
requirePhrase(checkoutApi, 'EXISTING_SUBSCRIPTION_STATUSES', 'Stripe checkout API');
requirePhrase(checkoutApi, 'idempotencyKey', 'Stripe checkout API');
requirePhrase(webhookApi, 'MAX_STRIPE_WEBHOOK_BYTES', 'Stripe webhook API');
requirePhrase(webhookApi, 'StripeWebhookPayloadTooLargeError', 'Stripe webhook API');
requirePhrase(webhookApi, 'applyApiSecurityHeaders', 'Stripe webhook API');
forbidPhrase(webhookApi, 'error instanceof Error ? error.message', 'Stripe webhook API');

requirePhrase(app, 'QA_TOOLS_ENABLED', 'App QA boundary');
requirePhrase(app, "lazy(() => import('@/components/qa/QaTools'))", 'App QA boundary');
requirePhrase(app, '<ConsentAnalytics />', 'App analytics boundary');
forbidPhrase(app, "import { Analytics } from '@vercel/analytics/react'", 'App analytics boundary');
forbidPhrase(main, 'DeviceValidationPanel', 'Production entrypoint');
forbidPhrase(main, 'vish-device-validation.css', 'Production entrypoint');

requirePhrase(analytics, 'ANALYTICS_CONSENT_EVENT', 'Analytics consent policy');
requirePhrase(analytics, "import('@vercel/analytics')", 'Analytics consent policy');
forbidPhrase(analytics, "import { track } from '@vercel/analytics'", 'Analytics consent policy');
requirePhrase(consentAnalytics, 'hasAnalyticsConsent', 'Consent analytics component');
requirePhrase(consentAnalytics, "import('@vercel/analytics/react')", 'Consent analytics component');
requirePhrase(monitoring, "import('@sentry/react')", 'Monitoring privacy policy');
requirePhrase(monitoring, 'sendDefaultPii: false', 'Monitoring privacy policy');
requirePhrase(monitoring, 'redactMonitoringUrl', 'Monitoring privacy policy');
requirePhrase(monitoring, 'sanitizeMonitoringContext', 'Monitoring privacy policy');
forbidPhrase(monitoring, "import * as Sentry from '@sentry/react'", 'Monitoring privacy policy');

requirePhrase(viteConfig, 'filterEntryModulePreloads', 'Vite build configuration');
requirePhrase(viteConfig, 'VISH_BUILD_SOURCEMAPS', 'Vite build configuration');
requirePhrase(viteConfig, "process.env.VERCEL !== '1'", 'Vite build configuration');
requirePhrase(viteConfig, "sourcemap: buildSourceMaps ? 'hidden' : false", 'Vite build configuration');

requirePhrase(vercelConfig, 'private, no-store, max-age=0', 'Vercel headers');
requirePhrase(vercelConfig, 'public, max-age=0, must-revalidate', 'Vercel headers');
requirePhrase(vercelConfig, 'X-Permitted-Cross-Domain-Policies', 'Vercel headers');

requirePhrase(vercelBuild, "process.env.VERCEL === '1'", 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'scripts/security/check-dist-security.mjs', 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'api/_lib/verifySupabaseToken.test.ts', 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'api/stripe/webhook.test.ts', 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'src/test/emailMagicLinkFallback.test.ts', 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'src/test/analyticsConsent.test.tsx', 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'src/test/monitoringPrivacy.test.ts', 'Vercel build orchestrator');
requirePhrase(vercelBuild, 'pnpm run perf:gates', 'Vercel build orchestrator');

requirePhrase(artifactSecurity, 'service_role', 'Artifact security scanner');
requirePhrase(artifactSecurity, 'productionQaMarkers', 'Artifact security scanner');
requirePhrase(artifactSecurity, 'source maps are present', 'Artifact security scanner');
requirePhrase(artifactSecurity, "process.env.VERCEL === '1'", 'Artifact security scanner');

if (existsSync(join(root, 'firestore.rules'))) failures.push('firestore.rules still exists — Firebase config should be removed.');

if (failures.length > 0) {
  console.error('Vishvakarma.OS production hardening check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS production hardening check passed.');
console.log('Auth, API origins, billing, telemetry privacy, artifact security, QA boundaries, PWA budgets, collaboration, and runtime policy are guarded.');
