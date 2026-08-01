'use strict';

const childProcess = require('node:child_process');
const { syncBuiltinESMExports } = require('node:module');

const originalSpawnSync = childProcess.spawnSync;

function quoteForCmd(value) {
  const text = String(value ?? '');
  if (text.length === 0) return '""';
  return `"${text.replaceAll('"', '""')}"`;
}

/**
 * Node cannot execute Windows .cmd/.bat files directly with spawnSync on every
 * supported Windows/Node combination. Route only those commands through the
 * native command processor while leaving normal executables untouched.
 */
childProcess.spawnSync = function windowsCompatibleSpawnSync(
  command,
  args = [],
  options = {},
) {
  const commandText = String(command);
  const isWindowsCommandScript =
    process.platform === 'win32' && /\.(?:cmd|bat)$/i.test(commandText);

  if (!isWindowsCommandScript) {
    return originalSpawnSync(command, args, options);
  }

  const commandLine = [
    'call',
    quoteForCmd(commandText),
    ...args.map(quoteForCmd),
  ].join(' ');

  return originalSpawnSync(
    process.env.ComSpec || 'cmd.exe',
    ['/d', '/s', '/c', commandLine],
    options,
  );
};

// Ensure later ESM named imports from node:child_process receive the patched
// function, including the import used by vish-supercharged-core.mjs.
syncBuiltinESMExports();
