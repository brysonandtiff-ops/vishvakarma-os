#!/usr/bin/env node

import { parseShellExitCode } from '../../scripts/auto-ship/auto-ship-lib.mjs';
import { invokeAutoShip, readStdinJson } from './invoke-auto-ship.mjs';

async function main() {
  const payload = await readStdinJson();
  const command = payload.command ?? payload.shell_command ?? '';
  const exitCode = parseShellExitCode(payload.exit_code ?? payload.exitCode ?? 0);

  await invokeAutoShip({
    trigger: 'shell',
    command: typeof command === 'string' ? command : '',
    exitCode,
  });

  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
