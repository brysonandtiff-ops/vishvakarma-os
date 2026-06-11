#!/usr/bin/env node
/** Renders public/brand/vishvakarma-apple-touch-icon.png (180×180) from synced icon SVG. */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const pngScript = join(scriptDir, 'generate-pwa-png-icons.mjs');
const result = spawnSync(process.execPath, [pngScript], { stdio: 'inherit' });
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
