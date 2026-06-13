#!/usr/bin/env node
/**
 * Download CC0 scene GLB models into public/models/ for Phase 3 3D viewport.
 * Usage:
 *   node scripts/setup-scene-models.mjs          # fetch missing models
 *   node scripts/setup-scene-models.mjs --verify # exit 1 if any expected file missing
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeColumnGlb } from './generate-column-glb.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERIFY_ONLY = process.argv.includes('--verify');

const KHR = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

/** Registry path -> Khronos glTF Sample Asset (CC0). */
const MODEL_SOURCES = {
  'public/models/furniture/bed.glb': `${KHR}/BoxTextured/glTF-Binary/BoxTextured.glb`,
  'public/models/furniture/sofa.glb': `${KHR}/GlamVelvetSofa/glTF-Binary/GlamVelvetSofa.glb`,
  'public/models/furniture/chair.glb': `${KHR}/SheenChair/glTF-Binary/SheenChair.glb`,
  'public/models/furniture/table.glb': `${KHR}/BoxTextured/glTF-Binary/BoxTextured.glb`,
  'public/models/furniture/desk.glb': `${KHR}/Box/glTF-Binary/Box.glb`,
  'public/models/furniture/wardrobe.glb': `${KHR}/Box/glTF-Binary/Box.glb`,
  'public/models/furniture/dining_table.glb': `${KHR}/BoxTextured/glTF-Binary/BoxTextured.glb`,
  'public/models/furniture/nightstand.glb': `${KHR}/Box/glTF-Binary/Box.glb`,
};

/** Procedurally generated in-repo (not fetched from Khronos). */
const GENERATED_MODELS = ['public/models/furniture/column.glb'];

const LANDSCAPE_SOURCES = {
  'public/models/landscape/tree.glb': `${KHR}/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb`,
  'public/models/landscape/pine.glb': `${KHR}/Lantern/glTF-Binary/Lantern.glb`,
  'public/models/landscape/shrub.glb': `${KHR}/Avocado/glTF-Binary/Avocado.glb`,
  'public/models/landscape/flower.glb': `${KHR}/GlassVaseFlowers/glTF-Binary/GlassVaseFlowers.glb`,
  'public/models/landscape/rock.glb': `${KHR}/DamagedHelmet/glTF-Binary/DamagedHelmet.glb`,
};

const ALL_EXPECTED = [...Object.keys(MODEL_SOURCES), ...GENERATED_MODELS, ...Object.keys(LANDSCAPE_SOURCES)];

const README = `# Scene GLB models (Phase 3)

Bundled CC0 glTF sample assets for the 3D editor viewport. Parametric meshes remain the fallback when a model fails to load.

## Source

Most files are sourced from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets) repository (CC0). \`column.glb\` is procedurally generated (\`scripts/generate-column-glb.mjs\`). Type names map to registry keys; footprint scaling in the viewport fits each model to manifest width/depth.

Refresh assets: \`pnpm run setup:scene-models\`
Verify in CI: \`pnpm run setup:scene-models -- --verify\`
`;

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 100 || buffer.toString('ascii', 0, 4) !== 'glTF') {
    throw new Error(`Invalid GLB payload from ${url}`);
  }
  return buffer;
}

function ensureGeneratedModels(force = false) {
  for (const relativePath of GENERATED_MODELS) {
    const dest = join(ROOT, relativePath);
    if (!force && existsSync(dest)) {
      console.log(`skip ${relativePath} (exists)`);
      continue;
    }
    mkdirSync(dirname(dest), { recursive: true });
    const { size } = writeColumnGlb(dest);
    console.log(`generated ${relativePath} (${size} bytes)`);
  }
}

async function main() {
  const missing = [];
  const downloadSources = { ...MODEL_SOURCES, ...LANDSCAPE_SOURCES };

  if (!VERIFY_ONLY) {
    ensureGeneratedModels();
  }

  for (const [relativePath, url] of Object.entries(downloadSources)) {
    const dest = join(ROOT, relativePath);
    if (VERIFY_ONLY) {
      continue;
    }

    mkdirSync(dirname(dest), { recursive: true });
    if (existsSync(dest)) {
      console.log(`skip ${relativePath} (exists)`);
      continue;
    }

    process.stdout.write(`fetch ${relativePath} ... `);
    try {
      const data = await download(url);
      writeFileSync(dest, data);
      console.log(`ok (${data.length} bytes)`);
    } catch (error) {
      console.log('FAILED');
      console.error(`  ${error instanceof Error ? error.message : error}`);
      missing.push(relativePath);
    }
  }

  if (!VERIFY_ONLY) {
    writeFileSync(join(ROOT, 'public/models/README.md'), README, 'utf8');
  }

  if (VERIFY_ONLY) {
    for (const relativePath of ALL_EXPECTED) {
      if (!existsSync(join(ROOT, relativePath))) missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    console.error(`\nMissing ${missing.length} model(s):`);
    for (const path of missing) console.error(`  - ${path}`);
    process.exit(1);
  }

  console.log(VERIFY_ONLY ? 'All scene models present.' : 'Scene models ready.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
