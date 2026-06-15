#!/usr/bin/env node

import { appendFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs, pass, fail, warn, info, dim } from '../lib/cli.mjs';
import { resolveTierSteps } from '../lib/resolve-tier-steps.mjs';
import { runCommandSync } from '../lib/run-command.mjs';
import {
  classifyFailure,
  findRepairsForCodes,
  findRepairsForEnv,
  loadRepairsManifest,
  runPipelineStep,
} from './lib/classify.mjs';

const root = process.cwd();
const pipelinePath = join(root, 'scripts', 'lib', 'pipeline-manifest.json');
const repairsPath = join(root, 'scripts', 'repairbot', 'repairs.json');
const stateDir = join(root, '.repairbot');

function loadPipelineManifest() {
  return JSON.parse(readFileSync(pipelinePath, 'utf8'));
}

function gitDirtyFiles() {
  const result = runCommandSync('git', ['status', '--porcelain'], { cwd: root });
  if (!result.ok) return [];
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3).trim());
}

function hasMergeConflicts() {
  const dirty = gitDirtyFiles();
  return dirty.some((file) => {
    const fullPath = join(root, file);
    if (!existsSync(fullPath)) return false;
    try {
      if (statSync(fullPath).isDirectory()) return false;
      const content = readFileSync(fullPath, 'utf8');
      return content.includes('<<<<<<<') || content.includes('>>>>>>>');
    } catch {
      return false;
    }
  });
}

function canApplyRepair(repair, dirtyFiles, dryRun) {
  if (dryRun) return true;
  if (!repair.requiresCleanGit) return true;
  if (dirtyFiles.length === 0) return true;
  warn(repair.id, `skipped — requires clean git (${dirtyFiles.length} dirty file(s))`);
  return false;
}

function runRepair(repair, dryRun) {
  if (dryRun) {
    warn(repair.id, `dry-run — would run: ${repair.command}`);
    return { ok: true, dryRun: true };
  }

  const outcome = runCommandSync(
    process.platform === 'win32' ? 'cmd.exe' : 'sh',
    process.platform === 'win32' ? ['/d', '/s', '/c', repair.command] : ['-c', repair.command],
    { cwd: root, shell: false },
  );
  return { ok: outcome.ok, dryRun: false, stderr: outcome.stderr, stdout: outcome.stdout };
}

function writeState(payload) {
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(join(stateDir, 'last-run.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  appendFileSync(join(stateDir, 'history.jsonl'), `${JSON.stringify(payload)}\n`, 'utf8');
}

function resolveRepairsForFailure(stepResult, repairsManifest) {
  if (stepResult.envResult) {
    return {
      repairs: findRepairsForEnv(stepResult.envResult, repairsManifest.repairs),
      codes: stepResult.envResult.issues.map((issue) => issue.code),
      needsAgent: false,
    };
  }

  const haystack = `${stepResult.stdout}\n${stepResult.stderr}`;
  const classified = classifyFailure(haystack, repairsManifest.patterns, stepResult.stepId);
  return {
    repairs: findRepairsForCodes(classified.codes, repairsManifest.repairs),
    codes: classified.codes,
    needsAgent: classified.needsAgent && classified.codes.length > 0,
  };
}

function runTierOnce({ tierName, dryRun, repairsManifest, attemptBudget }) {
  const pipeline = loadPipelineManifest();
  const steps = resolveTierSteps(pipeline.tiers, tierName, { mergeExtends: true });
  if (steps.length === 0) {
    throw new Error(`Pipeline tier has no steps: ${tierName}`);
  }

  const dirtyFiles = gitDirtyFiles();
  const scanResults = [];
  const appliedRepairs = [];
  const escalations = [];
  const attemptedRepairs = new Map();

  for (const step of steps) {
    const stepResult = runPipelineStep(step, root);
    if (stepResult.ok) {
      pass(stepResult.stepId);
      scanResults.push({ step, stepId: stepResult.stepId, ok: true });
      continue;
    }

    fail(stepResult.stepId, 'check failed');
    const diagnosis = resolveRepairsForFailure(stepResult, repairsManifest);
    scanResults.push({
      step,
      stepId: stepResult.stepId,
      ok: false,
      codes: diagnosis.codes,
      needsAgent: diagnosis.needsAgent,
    });

    if (diagnosis.needsAgent && diagnosis.repairs.length === 0) {
      escalations.push({
        step: stepResult.stepId,
        codes: diagnosis.codes,
        snippet: `${stepResult.stderr || stepResult.stdout}`.split('\n').slice(0, 8).join('\n'),
      });
      return { ok: false, scanResults, appliedRepairs, escalations, stoppedAt: stepResult.stepId };
    }

    if (diagnosis.repairs.length === 0) {
      escalations.push({
        step: stepResult.stepId,
        codes: diagnosis.codes,
        snippet: `${stepResult.stderr || stepResult.stdout}`.split('\n').slice(0, 8).join('\n'),
      });
      return { ok: false, scanResults, appliedRepairs, escalations, stoppedAt: stepResult.stepId };
    }

    let repaired = false;
    for (const repair of diagnosis.repairs) {
      const attempts = attemptedRepairs.get(repair.id) ?? 0;
      if (attempts >= repair.maxAttempts || attempts >= attemptBudget) {
        continue;
      }
      if (!canApplyRepair(repair, dirtyFiles, dryRun)) {
        continue;
      }

      attemptedRepairs.set(repair.id, attempts + 1);
      const outcome = runRepair(repair, dryRun);
      appliedRepairs.push({ id: repair.id, ok: outcome.ok, dryRun: outcome.dryRun });
      if (outcome.ok) {
        pass(repair.id, dryRun ? 'dry-run' : 'repair applied');
        repaired = true;
      } else {
        fail(repair.id, outcome.stderr || outcome.stdout || 'repair command failed');
      }
    }

    if (!repaired) {
      return { ok: false, scanResults, appliedRepairs, escalations, stoppedAt: stepResult.stepId };
    }

    const rerun = dryRun ? { ok: true, stepId: stepResult.stepId } : runPipelineStep(step, root);
    if (rerun.ok) {
      pass(stepResult.stepId, 'passed after repair');
      scanResults.push({ step, stepId: stepResult.stepId, ok: true, rerun: true });
      continue;
    }

    fail(stepResult.stepId, 'still failing after repair');
    return { ok: false, scanResults, appliedRepairs, escalations, stoppedAt: stepResult.stepId };
  }

  return { ok: true, scanResults, appliedRepairs, escalations, stoppedAt: null };
}

async function main() {
  const { flags, options } = parseArgs();
  const tierName = options.tier ?? options.t ?? 'repairbot:fast';
  const dryRun = flags.has('dry-run');
  const watch = flags.has('watch');
  const maxRounds = Number(options.rounds ?? 3);
  const intervalMs = Number(options.interval ?? 120_000);
  const attemptBudget = Number(options['attempt-budget'] ?? 1);

  if (hasMergeConflicts()) {
    fail('repairbot', 'merge conflict markers detected — resolve manually before repairs');
    process.exit(1);
  }

  const repairsManifest = loadRepairsManifest(repairsPath);
  const startedAt = Date.now();

  info(`RepairBot tier: ${tierName}${dryRun ? ' (dry-run)' : ''}`);
  console.log('');

  const run = () => {
    let lastOutcome = null;

    for (let round = 1; round <= maxRounds; round += 1) {
      if (maxRounds > 1) {
        dim(`Round ${round}/${maxRounds}`);
      }

      lastOutcome = runTierOnce({
        tierName,
        dryRun,
        repairsManifest,
        attemptBudget,
      });

      if (lastOutcome.ok) break;
      if (round === maxRounds) break;
      if (lastOutcome.appliedRepairs.length === 0) break;
    }

    const payload = {
      at: new Date().toISOString(),
      tier: tierName,
      dryRun,
      durationMs: Date.now() - startedAt,
      ok: lastOutcome?.ok ?? false,
      stoppedAt: lastOutcome?.stoppedAt ?? null,
      scans: lastOutcome?.scanResults ?? [],
      repairs: lastOutcome?.appliedRepairs ?? [],
      escalations: lastOutcome?.escalations ?? [],
    };

    writeState(payload);

    if (payload.ok) {
      pass('repairbot', `${tierName} healthy`);
    } else {
      fail('repairbot', payload.stoppedAt ? `blocked at ${payload.stoppedAt}` : 'checks failed');
      if (payload.escalations.length > 0) {
        warn('repairbot', `${payload.escalations.length} issue(s) need agent/human review`);
      }
    }

    return payload;
  };

  const first = run();
  if (!watch) {
    process.exit(first.ok ? 0 : 1);
  }

  setInterval(() => {
    run();
  }, intervalMs);
}

main().catch((error) => {
  fail('repairbot', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
