'use strict';

const childProcess = require('node:child_process');
const { syncBuiltinESMExports } = require('node:module');

const originalSpawnSync = childProcess.spawnSync;

/**
 * Node cannot execute Windows .cmd/.bat files directly with spawnSync on every
 * supported Windows/Node combination. Route only those scripts through the
 * native command processor. Each token is passed as a separate spawn argument,
 * so Node/Windows performs the quoting instead of us constructing escaped
 * command text by hand.
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

  return originalSpawnSync(
    process.env.ComSpec || 'cmd.exe',
    ['/d', '/c', commandText, ...args.map((value) => String(value))],
    options,
  );
};

// Ensure later ESM named imports from node:child_process receive the patched
// function, including the import used by vish-supercharged-core.mjs.
syncBuiltinESMExports();
