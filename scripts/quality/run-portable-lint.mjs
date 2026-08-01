import { spawnSync } from 'node:child_process';
import { release } from 'node:os';

const tasks = {
  dependencies: {
    label: 'Biome',
    command: 'biome',
    args: ['lint', '--only=correctness/noUndeclaredDependencies', '.'],
  },
  structure: {
    label: 'ast-grep',
    command: 'ast-grep',
    args: ['scan'],
  },
};

const taskName = process.argv[2];
const task = tasks[taskName];

if (!task) {
  console.error(
    `Unknown portable lint task "${taskName ?? ''}". Expected dependencies or structure.`,
  );
  process.exit(2);
}

const isAndroid =
  Boolean(process.env.ANDROID_ROOT) ||
  process.platform === 'android' ||
  release().toLowerCase().includes('android');

if (isAndroid) {
  console.log(`${task.label} skipped: Termux Android environment`);
  process.exit(0);
}

const packageManagerScript = process.env.npm_execpath;
const command = packageManagerScript
  ? process.execPath
  : process.platform === 'win32'
    ? `${task.command}.cmd`
    : task.command;
const args = packageManagerScript
  ? [packageManagerScript, 'exec', task.command, ...task.args]
  : task.args;

const result = spawnSync(command, args, {
  env: process.env,
  shell: !packageManagerScript && process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) {
  console.error(`${task.label} failed to start: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
