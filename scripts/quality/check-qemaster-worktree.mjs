import { execFileSync } from 'node:child_process';

const ALLOWED_DIRTY_PREFIXES = [
  'docs/demo/screenshots/',
  'docs/design/page-references/screenshots/',
  'docs/release/evidence/screenshots/',
  'docs/release/evidence/',
  'public/marketing/',
  'test-results/',
  'playwright-report',
];

const BLOCKED_DIRTY_PREFIXES = [
  'src/',
  'e2e/',
  'scripts/',
  'playwright.',
  'package.json',
  'pnpm-lock.yaml',
  'vite.config',
  'tsconfig',
];

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function normalizeStatusLine(line) {
  return line.slice(3).replace(/\\/g, '/');
}

const branch = git(['branch', '--show-current']);
const status = git(['status', '--porcelain']).split('\n').filter(Boolean);

const dirtyRuntimeFiles = status
  .map(normalizeStatusLine)
  .filter((file) => !ALLOWED_DIRTY_PREFIXES.some((prefix) => file.startsWith(prefix)))
  .filter((file) => BLOCKED_DIRTY_PREFIXES.some((prefix) => file.startsWith(prefix)));

if (dirtyRuntimeFiles.length > 0) {
  console.error('\n[qemaster] Runtime/source files are dirty before QE.');
  console.error(`[qemaster] Current branch: ${branch}`);
  console.error('[qemaster] These local files can change app boot, routing, auth, or test behavior:');
  for (const file of dirtyRuntimeFiles) {
    console.error(`  - ${file}`);
  }
  console.error('\n[qemaster] Save or stash them before running qemaster, then re-run:');
  console.error('  git switch -c local/save-before-qemaster-2');
  console.error('  git add <files-you-want-to-keep>');
  console.error('  git commit -m "wip: preserve local changes before qemaster"');
  console.error('  git fetch origin');
  console.error('  git switch -C qe/auth-route-smoke-clean origin/qe/auth-route-smoke-clean');
  console.error('  pnpm run qemaster\n');
  process.exit(1);
}

console.log(`[qemaster] Worktree preflight passed on ${branch}.`);
