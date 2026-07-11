#!/usr/bin/env node

import { readdir, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { runCommand } from './lib/run-command.mjs';

const root = process.cwd();
const textureRoot = join(root, 'public', 'textures');
const removableTextureExtensions = new Set(['.jpg', '.jpeg']);
const isVercelBuild = process.env.VERCEL === '1';

async function removeLegacyJpegTextures(directory) {
  let removed = 0;
  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return 0;
    }
    throw error;
  }

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      removed += await removeLegacyJpegTextures(entryPath);
      continue;
    }

    if (entry.isFile() && removableTextureExtensions.has(extname(entry.name).toLowerCase())) {
      await rm(entryPath, { force: true });
      removed += 1;
    }
  }

  return removed;
}

const focusedTests = [
  'src/test/releaseGateHardening.test.ts',
  'src/test/vercelBuildGate.test.ts',
  'src/backend/supabase/mappers.test.ts',
];

const steps = [
  { label: 'Lint', command: 'pnpm run lint' },
  {
    label: 'Focused regression tests',
    command: `pnpm exec vitest run ${focusedTests.join(' ')}`,
  },
  { label: 'Production build', command: 'pnpm run build' },
  { label: 'Performance budgets', command: 'pnpm run perf:gates' },
];

async function main() {
  if (isVercelBuild) {
    const removedTextures = await removeLegacyJpegTextures(textureRoot);
    console.log(`[vercel-build] Removed ${removedTextures} legacy JPEG texture file(s).`);
  } else {
    console.log('[vercel-build] Local run detected; skipping destructive texture cleanup.');
  }

  for (const step of steps) {
    console.log(`\n[vercel-build] ${step.label}`);
    runCommand(step.command, { stdio: 'inherit' });
  }

  console.log('\n[vercel-build] All quality and build gates passed.');
}

main().catch((error) => {
  console.error(
    '[vercel-build] Failed:',
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
