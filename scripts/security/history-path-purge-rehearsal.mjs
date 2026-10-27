#!/usr/bin/env node
/**
 * S.I.R.E. LAW 105 Ω — destructive history filtering must first be proved
 * ONLY against a synthetic repository generated in a private temporary dir.
 *
 * Not a credential revoke, not a GitHub history rewrite, not a deploy tool.
 * This file has no execution mode for a real user's repository.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const HISTORICAL_FORBIDDEN_PATH_REGEXES = Object.freeze([
  '(?i)^(?:[^/]+/)*\\.local/',
  '(?i)^(?:[^/]+/)*\\.wrangler/',
  '(?i)^(?:[^/]+/)*\\.vercel/',
  '(?i)^(?:[^/]+/)*dist/',
  '(?i)^(?:[^/]+/)*[^/]+\\.clixml$',
  '(?i)^(?:[^/]+/)*storage[-_]state(?:\\.[^/]*)?$',
  '(?i)^(?:[^/]+/)*playwright/(?:[^/]+/)*\\.auth/',
  '(?i)^(?:[^/]+/)*playwright/(?:[^/]+/)*auth\\.json$',
]);

export function isHistoricalPurgePath(path) {
  if (typeof path !== 'string' || !path) return false;
  const canonical = path.replaceAll('\\', '/');
  return HISTORICAL_FORBIDDEN_PATH_REGEXES.some((pattern) =>
    new RegExp(pattern.replace(/^\(\?i\)/, ''), 'i').test(canonical),
  );
}

export function getSyntheticHistoryFilterArgs() {
  return ['--force', '--invert-paths',
    ...HISTORICAL_FORBIDDEN_PATH_REGEXES.flatMap((regex) => ['--path-regex', regex])];
}

function command(cwd, program, args) {
  return execFileSync(program, args, {
    cwd,
    encoding: 'utf8',
    timeout: 5 * 60 * 1000,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/** Only ever rewrites the temporary fixture made inside this function. */
export function runSyntheticHistoryPurgeRehearsal(filterRepoExecutable) {
  if (!filterRepoExecutable || typeof filterRepoExecutable !== 'string') {
    throw new Error('A specific installed git-filter-repo executable is required');
  }
  const temp = mkdtempSync(join(tmpdir(), 'sire-PURELY-SYNTHETIC-history-purge-'));
  const root = join(temp, 'fictional.git-worktree');
  const kept = 'src/verified-source.ts';
  const banned = [
    '.local/cloud-credential.txt',
    'nested/.wrangler/state.dat',
    '.vercel/project.json',
    'ui/dist/generated.js',
    'scripts/fake.clixml',
    'e2e/storage-state.json',
    'playwright/.auth/user.json',
    'tools/playwright/auth.json',
  ];
  try {
    mkdirSync(root, { recursive: true });
    command(root, 'git', ['init', '--quiet', '--initial-branch=main']);
    command(root, 'git', ['config', 'user.name', 'Synthetic Recovery Test']);
    command(root, 'git', ['config', 'user.email', 'test@example.invalid']);

    function stage(path, content) {
      const dest = join(root, path);
      mkdirSync(join(dest, '..'), { recursive: true });
      writeFileSync(dest, content);
    }
    stage(kept, 'export const mode = "synthetic-only";\n');
    for (const path of banned) {
      stage(path, 'FICTIONAL TEST FIXTURE - NO REAL SECRET\n');
    }
    command(root, 'git', ['add', '-A']);
    command(root, 'git', ['commit', '--quiet', '-m', 'synthetic branch with fake forbidden paths']);
    command(root, 'git', ['tag', 'synthetic-before']);
    command(root, 'git', ['branch', 'synthetic-backup-branch']);
    stage(kept, 'export const mode = "synthetic-revised";\n');
    command(root, 'git', ['add', '-A']);
    command(root, 'git', ['commit', '--quiet', '-m', 'synthetic clean feature commit']);
    const priorRefCount = command(root, 'git', ['for-each-ref','--format=%(refname)'])
      .split('\n').filter(Boolean).length;

    command(root, filterRepoExecutable, getSyntheticHistoryFilterArgs());
    command(root, 'git', ['fsck', '--full', '--no-progress']);
    const remainingPaths = command(root, 'git', [
      'log', '--all', '--pretty=format:', '--name-only', '-z',
    ]).split('\0').filter(Boolean).map((path) => path.trim()).filter(Boolean);
    const stillForbidden = remainingPaths.filter(isHistoricalPurgePath);
    const keptSource = command(root, 'git', ['show', 'HEAD:' + kept]);
    const currentRefs = command(root, 'git', ['for-each-ref','--format=%(refname)'])
      .split('\n').filter(Boolean);

    if (stillForbidden.length !== 0 ||
        !remainingPaths.includes(kept) ||
        !keptSource.includes('synthetic-revised') ||
        !currentRefs.includes('refs/heads/main') ||
        !currentRefs.includes('refs/heads/synthetic-backup-branch') ||
        !currentRefs.includes('refs/tags/synthetic-before')) {
      throw new Error('Synthetic rewrite failed forbidden-path elimination or preservation checks');
    }

    return {
      result: 'SYNTHETIC_PATH_REWRITE_VERIFIED',
      removed_fixture_path_count: banned.length,
      retained_source_verified: true,
      original_ref_count: priorRefCount,
      surviving_ref_count: currentRefs.length,
      forbidden_paths_in_synthetic_history: stillForbidden.length,
      mirror_or_real_source_rewritten: false,
      production_git_refs_pushed: false,
      secret_values_or_real_history_copied: false,
      real_project_rewrite_authorized: false,
      remaining_holds: [
        'Provider-side credential rotations and two current-source findings privately triaged',
        'Owner-controlled encrypted full-history backup verified and retained',
        'Owner approval and coordination for rewriting public PR refs/clones',
        'Exact real-history plan, dry-run, and complete post-rewrite re-certification',
      ],
    };
  } finally {
    rmSync(temp, { recursive: true, force: true, maxRetries: 3 });
  }
}

const args = process.argv.slice(2);
if (args.length > 0) {
  if (args[0] !== '--synthetic-only' || args.length !== 2 ||
      process.env.SIRE_SYNTHETIC_HISTORY_REHEARSAL !== '1') {
    console.error('Refusing operation: only explicit synthetic-only mode is implemented.');
    process.exitCode = 2;
  } else {
    try {
      console.log(JSON.stringify(runSyntheticHistoryPurgeRehearsal(args[1]), null, 2));
    } catch {
      console.error('Synthetic-only history test failed; no production history touched.');
      process.exitCode = 1;
    }
  }
}
