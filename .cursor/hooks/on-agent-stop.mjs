#!/usr/bin/env node

import { invokeAutoShip } from './invoke-auto-ship.mjs';

async function main() {
  const result = await invokeAutoShip({ trigger: 'stop' });

  if (!result.ok && !result.skipped) {
    process.stdout.write(
      `${JSON.stringify({
        followup_message: `Auto-ship failed (${result.reason ?? 'unknown'}). Check .cursor/auto-ship/run.log and fix lint/types before retrying.`,
      })}\n`,
    );
  }

  process.exit(0);
}

main().catch(() => {
  process.exit(0);
});
