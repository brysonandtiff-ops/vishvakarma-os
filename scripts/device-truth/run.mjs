#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const evidenceDir = resolve(repoRoot, 'evidence/device-tests');
const args = process.argv.slice(2);
const installBrowsers = args.includes('--install-browsers');
const finalMode = args.includes('--final');
const passthrough = args.filter((arg) => arg !== '--install-browsers' && arg !== '--final');

function command(commandName, commandArgs, options = {}) {
  const result = spawnSync(commandName, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${commandName} ${commandArgs.join(' ')} failed:\n${result.stderr || result.stdout}`);
  }
  return String(result.stdout ?? '').trim();
}

function runStreaming(commandName, commandArgs) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(commandName, commandArgs, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: false,
      env: process.env,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolvePromise({ code: code ?? 1, signal }));
  });
}

async function repositoryTruthGuard() {
  const packageJson = JSON.parse(await readFile(resolve(repoRoot, 'package.json'), 'utf8'));
  if (packageJson.name !== 'vishvakarma-os') {
    throw new Error(`REPOSITORY GUARD FAILED: package.json name is ${packageJson.name ?? '<missing>'}, expected vishvakarma-os.`);
  }

  const gitRoot = command('git', ['-C', repoRoot, 'rev-parse', '--show-toplevel']);
  const branch = command('git', ['-C', repoRoot, 'branch', '--show-current']);
  const head = command('git', ['-C', repoRoot, 'rev-parse', 'HEAD']);
  const remote = command('git', ['-C', repoRoot, 'remote', 'get-url', 'origin']);
  const status = command('git', ['-C', repoRoot, 'status', '--short']);

  const canonicalRemote = /(?:github\.com[:/])brysonandtiff-ops\/vishvakarma-os(?:\.git)?$/i;
  if (!canonicalRemote.test(remote.trim())) {
    throw new Error(`REPOSITORY GUARD FAILED: origin is ${remote}, expected brysonandtiff-ops/vishvakarma-os.`);
  }

  const metadata = {
    repository: 'brysonandtiff-ops/vishvakarma-os',
    localRoot: gitRoot,
    branch,
    head,
    remote,
    worktreeStatus: status || 'CLEAN',
    timestamp: new Date().toISOString(),
    platform: process.platform,
    architecture: process.arch,
    node: process.version,
    evidenceClassification: 'EMULATED_DEVICE_AUTOMATION',
    realDevicesTestedByThisRunner: 0,
    mode: finalMode ? 'FINAL_RETEST' : 'BASELINE',
  };

  await mkdir(evidenceDir, { recursive: true });
  await writeFile(resolve(evidenceDir, 'run-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);

  console.log('\n🛡️ VISHVAKARMA.OS REPOSITORY TRUTH GUARD');
  console.log(`Repo:   ${metadata.repository}`);
  console.log(`Root:   ${gitRoot}`);
  console.log(`Branch: ${branch}`);
  console.log(`HEAD:   ${head}`);
  console.log(`Origin: ${remote}`);
  console.log(`Tree:   ${status ? 'DIRTY (recorded, testing allowed)' : 'CLEAN'}`);
  console.log(`Mode:   ${metadata.mode}`);
  console.log('Truth:  Browser/device profiles are EMULATED unless separately recorded as physical-device evidence.\n');

  return metadata;
}

async function main() {
  await repositoryTruthGuard();

  const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  if (installBrowsers) {
    console.log('📦 Installing Playwright Chromium, Firefox and WebKit...');
    const install = await runStreaming(pnpm, ['exec', 'playwright', 'install', '--with-deps', 'chromium', 'firefox', 'webkit']);
    if (install.code !== 0) process.exit(install.code);
  }

  console.log('🧪 Running Vishvakarma multi-device human truth baseline...');
  const testRun = await runStreaming(pnpm, [
    'exec',
    'playwright',
    'test',
    '--config=playwright.device-truth.config.ts',
    ...passthrough,
  ]);

  console.log('\n📊 Generating truth report even if the test run found failures...');
  const reportArgs = [resolve(scriptDir, 'report.mjs')];
  if (finalMode) reportArgs.push('--final');
  const reportRun = await runStreaming(process.execPath, reportArgs);

  if (reportRun.code !== 0) {
    console.error('Report generation failed.');
    process.exit(reportRun.code);
  }

  if (testRun.code !== 0) {
    console.error('\n❌ DEVICE TRUTH RESULT: failures found. Baseline evidence has been preserved.');
    process.exit(testRun.code);
  }

  console.log('\n✅ DEVICE TRUTH RESULT: automated emulated-device checks passed.');
  console.log('⚠️ This does NOT constitute physical iPhone/iPad/Android hardware proof. Record real-device evidence separately.');
}

main().catch((error) => {
  console.error(`\n⛔ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
