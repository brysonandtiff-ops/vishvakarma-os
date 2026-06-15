#!/usr/bin/env node

import { invokeAutoShip } from './invoke-auto-ship.mjs';

async function main() {
  await invokeAutoShip({ trigger: 'edit' });
  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
