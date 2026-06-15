#!/usr/bin/env node

import { invokeAutoShip, readStdinJson } from './invoke-auto-ship.mjs';

async function main() {
  const payload = await readStdinJson();
  const command = payload.command ?? payload.shell_command ?? '';
  const exitCode = payload.exit_code ?? payload.exitCode ?? 0;

  await invokeAutoShip({
    trigger: 'shell',
    command: typeof command === 'string' ? command : '',
    exitCode: typeof exitCode === 'number' ? exitCode : Number.parseInt(String(exitCode), 10) || 1,
  });

  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
