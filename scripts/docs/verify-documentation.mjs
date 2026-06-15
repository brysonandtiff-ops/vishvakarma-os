#!/usr/bin/env node
/**
 * Verify documentation completeness, link integrity, and stale references.
 * Run: pnpm run docs:verify
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const errors = [];
const warnings = [];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function fail(msg) {
  errors.push(msg);
}

function warn(msg) {
  warnings.push(msg);
}

const pkg = JSON.parse(read('package.json'));
const productVersion = pkg.version;

const REQUIRED_FILES = [
  'docs/README.md',
  'docs/DOCUMENTATION_STANDARDS.md',
  'docs/PROPRIETARY_NOTICE.md',
  'docs/archive/README.md',
  'docs/developer/ONBOARDING.md',
  'docs/developer/ARCHITECTURE.md',
  'docs/developer/API.md',
  'docs/developer/DATA_MODEL.md',
  'docs/developer/TESTING.md',
  'docs/developer/CI_CD.md',
  'docs/developer/CONTRIBUTING_EXTENDED.md',
  'docs/developer/openapi.yaml',
  'docs/operations/README.md',
  'docs/operations/DEPLOYMENT_RUNBOOK.md',
  'docs/operations/ROLLBACK.md',
  'docs/operations/INCIDENT_RESPONSE.md',
  'docs/operations/MONITORING.md',
  'docs/operations/ACCOUNT_TRANSFER.md',
  'docs/operations/ENVIRONMENT_MATRIX.md',
  'docs/user/README.md',
  'docs/user/GETTING_STARTED.md',
  'docs/user/WORKFLOWS.md',
  'docs/user/BILLING_AND_PLANS.md',
  'docs/user/TROUBLESHOOTING.md',
  'docs/compliance/PRIVACY.md',
  'docs/compliance/DATA_PROCESSING.md',
  'docs/compliance/SUPPORT_MATRIX.md',
  'docs/adr/README.md',
  'docs/adr/001-supabase-production-backend.md',
  'docs/adr/002-vite-spa-react-router.md',
  'docs/adr/003-project-manifest-source-of-truth.md',
  'docs/adr/004-thirteen-gate-release-pipeline.md',
  'docs/adr/005-stripe-entitlement-model.md',
  'CODE_OF_CONDUCT.md',
];

for (const file of REQUIRED_FILES) {
  if (!exists(file)) {
    fail(`Missing required doc: ${file}`);
  }
}

function versionMentions(content, version) {
  return content.includes(`v${version}`) || content.includes(`${version}`);
}

const versionFiles = [
  ['docs/SOFTWARE_INVENTORY.md', read('docs/SOFTWARE_INVENTORY.md')],
  ['docs/handoff/HANDOFF.md', read('docs/handoff/HANDOFF.md')],
  ['SECURITY.md', read('SECURITY.md')],
];

for (const [name, content] of versionFiles) {
  if (!versionMentions(content, productVersion)) {
    fail(`${name} does not mention product version ${productVersion}`);
  }
}

if (!read('SECURITY.md').includes('1.5.x')) {
  fail('SECURITY.md supported versions missing 1.5.x');
}

const FIREBASE_PRODUCTION_PATTERNS = [
  /Configure Firebase Auth/i,
  /Deploy Firestore rules/i,
  /Set Firebase env/i,
  /Firebase gateway layer/i,
  /Firestore collection:/i,
];

const CANONICAL_SCAN_DIRS = ['docs/user', 'docs/developer'];
const CANONICAL_FILES = ['README.md', 'CONTRIBUTING.md'];

function hasHistoricalBanner(content) {
  return />\s*\*\*Historical:\*\*/i.test(content) || />\s*\*\*Forward-looking:\*\*/i.test(content);
}

function scanFirebaseProductionClaims(relPath, content) {
  if (hasHistoricalBanner(content)) return;
  if (relPath.includes('MIGRATION') || relPath.includes('archive')) return;

  for (const pattern of FIREBASE_PRODUCTION_PATTERNS) {
    if (pattern.test(content)) {
      fail(`${relPath} contains stale Firebase-as-production reference: ${pattern}`);
    }
  }
}

for (const dir of CANONICAL_SCAN_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of fs.readdirSync(abs)) {
    if (!file.endsWith('.md')) continue;
    const rel = `${dir}/${file}`.replace(/\\/g, '/');
    scanFirebaseProductionClaims(rel, read(rel));
  }
}

for (const file of CANONICAL_FILES) {
  if (exists(file)) {
    scanFirebaseProductionClaims(file, read(file));
  }
}

function resolveLink(fromFile, href) {
  if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
    return null;
  }
  const clean = href.split('#')[0].split('?')[0];
  if (!clean) return null;
  const fromDir = path.dirname(fromFile);
  const resolved = path.normalize(path.join(fromDir, clean)).replace(/\\/g, '/');
  return resolved;
}

function collectMarkdownFiles(dir, acc = []) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return acc;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = `${dir}/${entry.name}`.replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (
        rel.includes('node_modules') ||
        rel.includes('.agents') ||
        rel.startsWith('docs/archive')
      ) {
        continue;
      }
      collectMarkdownFiles(rel, acc);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      acc.push(rel);
    }
  }
  return acc;
}

const linkRoots = ['docs', 'README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'];
const markdownFiles = [];
for (const root of linkRoots) {
  if (root.endsWith('.md')) {
    if (exists(root)) markdownFiles.push(root);
  } else {
    collectMarkdownFiles(root, markdownFiles);
  }
}

const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

for (const file of markdownFiles) {
  const content = read(file);
  for (const match of content.matchAll(linkPattern)) {
    const href = match[2];
    const target = resolveLink(file, href);
    if (!target) continue;
    if (!exists(target) && !exists(`${target}.md`)) {
      fail(`Broken link in ${file}: (${href}) → ${target}`);
    }
  }
}

const manifestPath = 'docs/handoff/appendices/MANIFEST.json';
if (exists(manifestPath)) {
  const manifest = JSON.parse(read(manifestPath));
  let currentSha = 'unknown';
  try {
    currentSha = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    warn('Not a git repo — skipping SHA freshness check');
  }

  if (manifest.gitSha && currentSha !== 'unknown' && manifest.gitSha !== currentSha) {
    warn(
      `Appendix MANIFEST gitSha (${manifest.gitSha.slice(0, 8)}) differs from HEAD (${currentSha.slice(0, 8)}) — run pnpm run handoff:generate`,
    );
  }

  const appendixA = 'docs/handoff/appendices/A-routes-and-api.md';
  if (exists(appendixA)) {
    const stat = fs.statSync(path.join(ROOT, appendixA));
    const ageDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24);
    if (ageDays > 30 && manifest.gitSha !== currentSha) {
      warn(`Appendix A is ${Math.floor(ageDays)} days old and git SHA is stale`);
    }
  }
}

if (!pkg.scripts['docs:verify']) {
  fail('package.json missing docs:verify script');
}

console.log('Documentation verification');
console.log('─'.repeat(40));
console.log(`Product version: ${productVersion}`);

if (warnings.length) {
  console.log(`Warnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
}

if (errors.length) {
  console.log(`Errors (${errors.length}):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}

console.log('✓ All documentation checks passed');
process.exit(0);
