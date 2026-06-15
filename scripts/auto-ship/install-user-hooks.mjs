#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const userCursorDir = join(homedir(), '.cursor');
const userHooksDir = join(userCursorDir, 'hooks', 'vishvakarma-auto-ship');
const userHooksJson = join(userCursorDir, 'hooks.json');

const USER_INVOKE = `#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function findGitRoot(startDir = process.cwd(), maxDepth = 20) {
  let current = resolve(startDir);
  for (let depth = 0; depth < maxDepth; depth += 1) {
    if (existsSync(join(current, '.git'))) return current;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function parseShellExitCode(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

export function readStdinJson() {
  return new Promise((resolvePromise) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => {
      if (!data.trim()) return resolvePromise({});
      try { resolvePromise(JSON.parse(data)); } catch { resolvePromise({}); }
    });
  });
}

export async function invokeAutoShip(args) {
  const repoRoot = findGitRoot(process.cwd());
  if (!repoRoot) return { ok: true, skipped: true, reason: 'no-git-root' };
  const script = join(repoRoot, 'scripts', 'auto-ship', 'auto-ship.mjs');
  if (!existsSync(script)) return { ok: true, skipped: true, reason: 'no-auto-ship-script' };
  const argv = ['--trigger=' + args.trigger, '--cwd=' + repoRoot];
  if (args.command) argv.push('--command=' + args.command);
  if (typeof args.exitCode === 'number') argv.push('--exit-code=' + args.exitCode);
  const result = spawnSync(process.execPath, [script, ...argv], {
    cwd: repoRoot,
    encoding: 'utf8',
    shell: false,
  });
  const exitCode = result.status ?? 1;
  return { ok: exitCode === 0, exitCode };
}
`;

const HOOK_ENTRIES = {
  afterShellExecution: {
    file: 'after-shell-exec.mjs',
    timeout: 180,
    body: `import { invokeAutoShip, readStdinJson } from './invoke-auto-ship.mjs';

function parseShellExitCode(raw) {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  return Number.isNaN(parsed) ? 1 : parsed;
}

async function main() {
  const payload = await readStdinJson();
  const command = payload.command ?? payload.shell_command ?? '';
  const exitCode = parseShellExitCode(payload.exit_code ?? payload.exitCode ?? 0);
  await invokeAutoShip({ trigger: 'shell', command: String(command), exitCode });
  process.exit(0);
}
main().catch(() => process.exit(0));`,
  },
  postToolUse: {
    file: 'after-tool-use.mjs',
    timeout: 180,
    body: `import { invokeAutoShip, readStdinJson } from './invoke-auto-ship.mjs';
const MUTATING = /shell|write|strreplace|delete|editnotebook|applypatch|apply_patch/i;
async function main() {
  const payload = await readStdinJson();
  const tool = String(payload.tool_name ?? payload.toolName ?? payload.tool ?? '');
  if (!MUTATING.test(tool)) process.exit(0);
  await invokeAutoShip({ trigger: 'tool' });
  process.exit(0);
}
main().catch(() => process.exit(0));`,
  },
  afterFileEdit: {
    file: 'after-file-edit-ship.mjs',
    timeout: 180,
    body: `import { invokeAutoShip } from './invoke-auto-ship.mjs';
async function main() {
  await invokeAutoShip({ trigger: 'edit' });
  process.exit(0);
}
main().catch(() => process.exit(0));`,
  },
  stop: {
    file: 'on-agent-stop.mjs',
    timeout: 180,
    loop_limit: 1,
    body: `import { invokeAutoShip } from './invoke-auto-ship.mjs';
async function main() {
  const result = await invokeAutoShip({ trigger: 'stop' });
  if (!result.ok) {
    process.stdout.write(JSON.stringify({ followup_message: 'Auto-ship failed. Check .cursor/auto-ship/run.log in the git repo.' }) + '\\n');
  }
  process.exit(0);
}
main().catch(() => process.exit(0));`,
  },
};

function mergeHooks(existing, installed) {
  const merged = { version: 1, hooks: { ...(existing.hooks ?? {}) } };
  for (const [event, defs] of Object.entries(installed)) {
    const current = Array.isArray(merged.hooks[event]) ? merged.hooks[event] : [];
    const filtered = current.filter((entry) => {
      const cmd = typeof entry.command === 'string' ? entry.command : '';
      return !cmd.includes('vishvakarma-auto-ship');
    });
    merged.hooks[event] = [...filtered, ...defs];
  }
  return merged;
}

function main() {
  mkdirSync(userHooksDir, { recursive: true });
  writeFileSync(join(userHooksDir, 'invoke-auto-ship.mjs'), USER_INVOKE, 'utf8');

  for (const spec of Object.values(HOOK_ENTRIES)) {
    writeFileSync(join(userHooksDir, spec.file), spec.body, 'utf8');
  }

  const installed = {};
  for (const [event, spec] of Object.entries(HOOK_ENTRIES)) {
    const entry = {
      command: `node ./hooks/vishvakarma-auto-ship/${spec.file}`,
      timeout: spec.timeout,
    };
    if (spec.loop_limit) entry.loop_limit = spec.loop_limit;
    installed[event] = [entry];
  }

  let existing = { version: 1, hooks: {} };
  if (existsSync(userHooksJson)) {
    try {
      existing = JSON.parse(readFileSync(userHooksJson, 'utf8'));
    } catch {
      existing = { version: 1, hooks: {} };
    }
  }

  const merged = mergeHooks(existing, installed);
  writeFileSync(userHooksJson, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');

  console.log('[auto-ship] Installed user-global hooks:');
  console.log(`  ${userHooksDir}`);
  console.log(`  ${userHooksJson}`);
  console.log('[auto-ship] Restart Cursor to reload hooks.');
}

main();
