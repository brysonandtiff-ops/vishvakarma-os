#!/usr/bin/env node
/**
 * Verify handoff pack completeness against live repo sources.
 * Run: pnpm run handoff:verify
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const APPENDICES = path.join(ROOT, 'docs/handoff/appendices');
const HANDOFF = path.join(ROOT, 'docs/handoff');

const errors = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

// Required annex files
const annexes = [
  'HANDOFF.md',
  '01-product-and-business.md',
  '02-repository-topology.md',
  '03-architecture-and-data-flow.md',
  '04-application-surface.md',
  '05-data-model-and-migrations.md',
  '06-security-and-compliance.md',
  '07-integrations-and-accounts.md',
  '08-operations-and-deployment.md',
  '09-testing-quality-and-release.md',
  '10-ip-risks-roadmap-and-gaps.md',
  'templates/OPERATOR_ANNEX.template.md',
];

for (const f of annexes) {
  if (!fs.existsSync(path.join(HANDOFF, f))) {
    fail(`Missing handoff file: docs/handoff/${f}`);
  }
}

const appendixFiles = [
  'A-routes-and-api.md',
  'B-environment-variables.md',
  'C-npm-scripts.md',
  'D-database-schema.md',
  'E-verify-scripts.md',
  'F-test-inventory.md',
  'G-dependencies.md',
  'H-file-tree.md',
  'MANIFEST.json',
];

for (const f of appendixFiles) {
  if (!fs.existsSync(path.join(APPENDICES, f))) {
    fail(`Missing appendix: docs/handoff/appendices/${f} — run pnpm run handoff:generate`);
  }
}

// Routes in routes.tsx must appear in appendix A
const routesSrc = read('src/routes.tsx');
const routePaths = [...routesSrc.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);
const appendixA = fs.existsSync(path.join(APPENDICES, 'A-routes-and-api.md'))
  ? read('docs/handoff/appendices/A-routes-and-api.md')
  : '';

for (const p of routePaths) {
  if (!appendixA.includes(`\`${p}\``)) {
    fail(`Route ${p} missing from appendix A`);
  }
}

// npm scripts in package.json must appear in appendix C
const pkg = JSON.parse(read('package.json'));
const appendixC = fs.existsSync(path.join(APPENDICES, 'C-npm-scripts.md'))
  ? read('docs/handoff/appendices/C-npm-scripts.md')
  : '';

for (const name of Object.keys(pkg.scripts)) {
  if (!appendixC.includes(`\`${name}\``)) {
    fail(`npm script ${name} missing from appendix C`);
  }
}

// Migration tables in appendix D
const migrationDir = path.join(ROOT, 'supabase/migrations');
const tables = new Set();
for (const file of fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql'))) {
  const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
  for (const m of sql.matchAll(/create table(?: if not exists)?\s+public\.(\w+)/gi)) {
    tables.add(m[1]);
  }
}
const appendixD = fs.existsSync(path.join(APPENDICES, 'D-database-schema.md'))
  ? read('docs/handoff/appendices/D-database-schema.md')
  : '';

for (const t of tables) {
  if (!appendixD.includes(`\`${t}\``)) {
    fail(`Table ${t} missing from appendix D`);
  }
}

// Stale doc check — SECURITY and DEPLOYMENT should not claim Firebase as production auth
const security = read('SECURITY.md');
if (/Firebase Authentication.*production|Firestore security rules/i.test(security) && !/Supabase Auth/i.test(security)) {
  fail('SECURITY.md still describes Firebase as production auth — reconcile per handoff plan');
}

const deployment = read('docs/release/DEPLOYMENT.md');
if (/Deploy Firestore rules|Set Firebase env/i.test(deployment) && !/Supabase/i.test(deployment)) {
  fail('DEPLOYMENT.md still describes Firebase deploy steps — reconcile per handoff plan');
}

const stripeExample = read('.env.stripe.local.example');
if (/BACKEND_PROVIDER=firebase/i.test(stripeExample)) {
  fail('.env.stripe.local.example still references BACKEND_PROVIDER=firebase');
}

// OPERATOR_ANNEX should be gitignored
const gitignore = read('.gitignore');
if (!gitignore.includes('docs/handoff/OPERATOR_ANNEX.md')) {
  fail('docs/handoff/OPERATOR_ANNEX.md not in .gitignore');
}

// handoff:generate scripts exist
if (!pkg.scripts['handoff:generate'] || !pkg.scripts['handoff:verify']) {
  fail('package.json missing handoff:generate or handoff:verify scripts');
}

// MANIFEST.json sanity
if (fs.existsSync(path.join(APPENDICES, 'MANIFEST.json'))) {
  const manifest = JSON.parse(read('docs/handoff/appendices/MANIFEST.json'));
  if (!manifest.gitSha || manifest.gitSha === 'unknown') {
    warn('MANIFEST.json gitSha is unknown (not a git repo?)');
  }
  if (manifest.counts?.routes !== routePaths.length) {
    warn(`MANIFEST route count (${manifest.counts?.routes}) != parsed routes (${routePaths.length})`);
  }
}

console.log('Handoff completeness verification');
console.log('─'.repeat(40));

if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (errors.length) {
  console.log(`Errors (${errors.length}):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}

console.log('✓ All handoff completeness checks passed');
process.exit(0);
