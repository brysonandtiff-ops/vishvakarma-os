#!/usr/bin/env node

import { isMutatingTool } from '../../scripts/auto-ship/auto-ship-lib.mjs';
import { invokeAutoShip, readStdinJson } from './invoke-auto-ship.mjs';

async function main() {
  const payload = await readStdinJson();
  const toolName =
    payload.tool_name ?? payload.toolName ?? payload.tool ?? payload.name ?? '';

  if (!isMutatingTool(String(toolName))) {
    process.exit(0);
  }

  await invokeAutoShip({ trigger: 'tool' });
  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
