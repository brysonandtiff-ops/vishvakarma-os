#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { runCommandSync } from '../../lib/run-command.mjs';
import { runEnvScan } from './env-scan.mjs';

/**
 * @typedef {{ code: string; match: string; needsAgent?: boolean; scanHint?: string }} FailurePattern
 * @typedef {{ id: string; codes: string[]; command: string; confidence: string; requiresCleanGit: boolean; maxAttempts: number }} RepairDefinition
 */

/**
 * @param {string} manifestPath
 */
export function loadRepairsManifest(manifestPath) {
  return JSON.parse(readFileSync(manifestPath, 'utf8'));
}

/**
 * @param {string} haystack
 * @param {FailurePattern[]} patterns
 * @param {string} [stepHint]
 */
export function classifyFailure(haystack, patterns, stepHint = '') {
  /** @type {string[]} */
  const codes = [];
  let needsAgent = false;

  for (const pattern of patterns) {
    if (pattern.scanHint && stepHint && !stepHint.includes(pattern.scanHint)) {
      continue;
    }
    if (haystack.includes(pattern.match)) {
      codes.push(pattern.code);
      if (pattern.needsAgent) needsAgent = true;
    }
  }

  return { codes: [...new Set(codes)], needsAgent };
}

/**
 * @param {string[]} codes
 * @param {RepairDefinition[]} repairs
 */
export function findRepairsForCodes(codes, repairs) {
  const codeSet = new Set(codes);
  return repairs.filter((repair) => repair.codes.some((code) => codeSet.has(code)));
}

/**
 * @param {{ issues: { code: string }[] }} envResult
 * @param {RepairDefinition[]} repairs
 */
export function findRepairsForEnv(envResult, repairs) {
  const codes = envResult.issues.map((issue) => issue.code);
  return findRepairsForCodes(codes, repairs);
}

/**
 * @param {string} step
 */
export function isEnvScanStep(step) {
  return step.includes('env-scan.mjs');
}

/**
 * @param {string} step
 */
export function stepId(step) {
  if (isEnvScanStep(step)) return 'env-scan';
  const match = step.match(/(?:pnpm run |node scripts\/)([a-z0-9:_-]+)/i);
  return match?.[1] ?? step;
}

/**
 * @param {string} step
 * @param {string} root
 */
export function runPipelineStep(step, root = process.cwd()) {
  if (isEnvScanStep(step)) {
    const result = runEnvScan();
    const messages = result.issues.map((issue) => `${issue.code}: ${issue.message}`).join('\n');
    const blockingIssues = result.issues.filter((issue) => issue.blocking);
    return {
      ok: result.ok,
      stdout: messages,
      stderr: blockingIssues.map((issue) => `${issue.code}: ${issue.message}`).join('\n'),
      envResult: result,
      stepId: 'env-scan',
    };
  }

  const outcome = runCommandSync(
    process.platform === 'win32' ? 'cmd.exe' : 'sh',
    process.platform === 'win32' ? ['/d', '/s', '/c', step] : ['-c', step],
    { cwd: root, shell: false },
  );

  return {
    ok: outcome.ok,
    stdout: outcome.stdout,
    stderr: outcome.stderr,
    envResult: null,
    stepId: stepId(step),
  };
}
