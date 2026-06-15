#!/usr/bin/env node

import { appendFileSync, mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildCommitMessage,
  filterStageablePaths,
  findGitRoot,
  isDirectEntry,
  loadConfig,
  parsePorcelain,
  shouldAcquireDebounceLock,
  shouldSkipCommand,
} from './auto-ship-lib.mjs';

function parseArgs(argv) {
  const options = {
    trigger: 'manual',
    command: '',
    exitCode: 0,
    dryRun: false,
    cwd: process.cwd(),
  };

  for (const arg of argv) {
    if (arg.startsWith('--trigger=')) options.trigger = arg.slice('--trigger='.length);
    else if (arg.startsWith('--command=')) options.command = arg.slice('--command='.length);
    else if (arg.startsWith('--exit-code=')) options.exitCode = Number.parseInt(arg.slice('--exit-code='.length), 10);
    else if (arg === '--dry-run') options.dryRun = true;
    else if (arg.startsWith('--cwd=')) options.cwd = arg.slice('--cwd='.length);
  }

  if (Number.isNaN(options.exitCode)) options.exitCode = 1;
  return options;
}

function logEvent(repoRoot, entry) {
  const logDir = join(repoRoot, '.cursor', 'auto-ship');
  mkdirSync(logDir, { recursive: true });
  appendFileSync(join(logDir, 'run.log'), `${JSON.stringify({ ...entry, at: new Date().toISOString() })}\n`, 'utf8');
}

function git(args, repoRoot) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Porcelain lines often start with a leading space (e.g. " M path"); never trimStart stdout.
  return {
    ok: result.status === 0,
    stdout: result.stdout?.trimEnd() ?? '',
    stderr: result.stderr?.trimEnd() ?? '',
    code: result.status ?? 1,
  };
}

function pnpm(args, repoRoot, timeoutMs) {
  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  return spawnSync(pnpmCmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: timeoutMs,
  });
}

function writeLock(repoRoot, config) {
  const lockPath = join(repoRoot, '.cursor', 'auto-ship', '.lock');
  mkdirSync(join(repoRoot, '.cursor', 'auto-ship'), { recursive: true });
  writeFileSync(lockPath, `${JSON.stringify({ timestamp: Date.now() })}\n`, 'utf8');
  return lockPath;
}

export async function runAutoShip(rawArgv = process.argv.slice(2)) {
  const options = parseArgs(rawArgv);
  const config = loadConfig();

  if (process.env.VISH_AUTO_SHIP === '0') {
    return { ok: true, skipped: true, reason: 'VISH_AUTO_SHIP=0' };
  }

  const repoRoot = findGitRoot(options.cwd);
  if (!repoRoot) {
    return { ok: true, skipped: true, reason: 'no-git-root' };
  }

  const lockPath = join(repoRoot, '.cursor', 'auto-ship', '.lock');
  if (!shouldAcquireDebounceLock(lockPath, config.debounceMs)) {
    logEvent(repoRoot, { trigger: options.trigger, skipped: true, reason: 'debounced' });
    return { ok: true, skipped: true, reason: 'debounced' };
  }

  if (options.command && shouldSkipCommand(options.command, config.skipCommandPatterns)) {
    logEvent(repoRoot, { trigger: options.trigger, skipped: true, reason: 'skip-command', command: options.command });
    return { ok: true, skipped: true, reason: 'skip-command' };
  }

  if (options.exitCode !== 0) {
    logEvent(repoRoot, {
      trigger: options.trigger,
      skipped: true,
      reason: 'non-zero-exit',
      exitCode: options.exitCode,
      command: options.command,
    });
    return { ok: true, skipped: true, reason: 'non-zero-exit' };
  }

  const status = git(['status', '--porcelain'], repoRoot);
  if (!status.ok) {
    logEvent(repoRoot, { trigger: options.trigger, ok: false, reason: 'git-status-failed', stderr: status.stderr });
    return { ok: false, reason: 'git-status-failed' };
  }

  const porcelain = parsePorcelain(status.stdout);
  const stageable = filterStageablePaths(porcelain, config.excludePathPatterns);
  if (stageable.length === 0) {
    logEvent(repoRoot, { trigger: options.trigger, skipped: true, reason: 'clean-or-excluded-only' });
    return { ok: true, skipped: true, reason: 'clean-or-excluded-only' };
  }

  if (options.dryRun) {
    logEvent(repoRoot, {
      trigger: options.trigger,
      dryRun: true,
      stageable,
      message: buildCommitMessage(options.trigger, stageable),
    });
    return { ok: true, dryRun: true, stageable };
  }

  writeLock(repoRoot, config);

  const lint = pnpm(['run', 'lint:types'], repoRoot, config.lintTimeoutMs);
  if (lint.status !== 0) {
    try {
      unlinkSync(lockPath);
    } catch {
      // ignore
    }
    logEvent(repoRoot, {
      trigger: options.trigger,
      ok: false,
      reason: 'lint-failed',
      stderr: `${lint.stdout ?? ''}\n${lint.stderr ?? ''}`.trim(),
    });
    return { ok: false, reason: 'lint-failed' };
  }

  for (const path of stageable) {
    const addResult = git(['add', '--', path], repoRoot);
    if (!addResult.ok) {
      logEvent(repoRoot, { trigger: options.trigger, ok: false, reason: 'git-add-failed', path, stderr: addResult.stderr });
      return { ok: false, reason: 'git-add-failed' };
    }
  }

  const commitMessage = buildCommitMessage(options.trigger, stageable);
  const commit = git(['commit', '-m', commitMessage], repoRoot);
  if (!commit.ok) {
    logEvent(repoRoot, { trigger: options.trigger, ok: false, reason: 'git-commit-failed', stderr: commit.stderr });
    return { ok: false, reason: 'git-commit-failed' };
  }

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], repoRoot);
  const push = git(['push', 'origin', 'HEAD'], repoRoot);
  if (!push.ok) {
    logEvent(repoRoot, {
      trigger: options.trigger,
      ok: false,
      reason: 'git-push-failed',
      branch: branch.stdout,
      stderr: push.stderr,
    });
    return { ok: false, reason: 'git-push-failed', branch: branch.stdout };
  }

  const sha = git(['rev-parse', '--short', 'HEAD'], repoRoot);
  logEvent(repoRoot, {
    trigger: options.trigger,
    ok: true,
    committed: true,
    pushed: true,
    sha: sha.stdout,
    branch: branch.stdout,
    files: stageable.length,
    message: commitMessage,
  });

  return {
    ok: true,
    committed: true,
    pushed: true,
    sha: sha.stdout,
    branch: branch.stdout,
    message: commitMessage,
  };
}

if (isDirectEntry(import.meta.url, process.argv[1])) {
  runAutoShip()
    .then((result) => {
      if (!result.ok && !result.skipped) {
        process.exitCode = 1;
      }
    })
    .catch((error) => {
      console.error('[auto-ship]', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
