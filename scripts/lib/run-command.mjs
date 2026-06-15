#!/usr/bin/env node

import { execSync, spawnSync } from 'node:child_process';

export function runCommand(command, options = {}) {
  const {
    cwd = process.cwd(),
    env = process.env,
    stdio = ['ignore', 'pipe', 'pipe'],
    throwOnError = true,
  } = options;

  try {
    const stdout = execSync(command, {
      cwd,
      env,
      encoding: 'utf8',
      stdio,
    });
    return {
      ok: true,
      stdout: typeof stdout === 'string' ? stdout.trim() : '',
      stderr: '',
      code: 0,
    };
  } catch (error) {
    const stdout = error.stdout?.toString?.().trim() ?? '';
    const stderr = error.stderr?.toString?.().trim() ?? '';
    if (throwOnError) {
      const message = stderr || stdout || error.message;
      throw new Error(message);
    }
    return {
      ok: false,
      stdout,
      stderr,
      code: typeof error.status === 'number' ? error.status : 1,
    };
  }
}

export function runCommandSync(command, args = [], options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? process.env,
    encoding: 'utf8',
    stdio: options.stdio ?? ['ignore', 'pipe', 'pipe'],
  });

  return {
    ok: result.status === 0,
    stdout: result.stdout?.trim() ?? '',
    stderr: result.stderr?.trim() ?? '',
    code: result.status ?? 1,
  };
}

export async function getCommitSha() {
  try {
    return runCommand('git rev-parse HEAD').stdout;
  } catch {
    return 'unknown';
  }
}

export async function dirSizeBytes(dir) {
  try {
    const command =
      process.platform === 'win32'
        ? `powershell -Command "(Get-ChildItem -Recurse '${dir}' | Measure-Object -Property Length -Sum).Sum"`
        : `du -sb "${dir}" | cut -f1`;
    const output = runCommand(command).stdout;
    return Number.parseInt(output, 10) || 0;
  } catch {
    return 0;
  }
}
