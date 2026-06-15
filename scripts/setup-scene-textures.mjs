#!/usr/bin/env node
/**
 * Download CC0 PBR textures (ambientCG) and HDRI (Poly Haven) into public/.
 * Usage:
 *   node scripts/setup-scene-textures.mjs          # fetch missing assets
 *   node scripts/setup-scene-textures.mjs --verify # exit 1 if any expected file missing
 */

import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERIFY_ONLY = process.argv.includes('--verify');

/** dest folder -> ambientCG asset id */
const TEXTURE_SETS = {
  'public/textures/paint': 'Plaster001',
  'public/textures/plaster': 'Plaster003',
  'public/textures/wood': 'WoodFloor051',
  'public/textures/concrete': 'Concrete033',
  'public/textures/marble': 'Marble016',
  'public/textures/tile': 'Tiles107',
  'public/textures/metal': 'Metal032',
  'public/textures/grass': 'Grass001',
  'public/textures/stone': 'Rock035',
  'public/textures/fabric': 'Fabric022',
  'public/textures/bark': 'Bark006',
};

const HDRI_SOURCE = {
  'public/hdri/studio-arch.hdr':
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr',
};

function expectedFiles() {
  const files = [];
  for (const folder of Object.keys(TEXTURE_SETS)) {
    files.push(`${folder}/color.jpg`, `${folder}/normal.jpg`, `${folder}/roughness.jpg`);
  }
  for (const path of Object.keys(HDRI_SOURCE)) files.push(path);
  return files;
}

const ALL_EXPECTED = expectedFiles();

const README = `# Scene PBR textures (CC0)

Bundled ambientCG CC0 textures for the 3D editor viewport. Procedural canvas patterns remain the fallback when files are missing.

Refresh: \`pnpm run setup:scene-textures\`
Verify: \`pnpm run setup:scene-textures -- --verify\`
`;

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

function extractZip(zipPath, destDir) {
  mkdirSync(destDir, { recursive: true });
  if (process.platform === 'win32') {
    execSync(
      `powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`,
      { stdio: 'pipe' },
    );
  } else {
    execSync(`unzip -o -q "${zipPath}" -d "${destDir}"`, { stdio: 'pipe' });
  }
}

function findMapFile(dir, assetId, kind) {
  const suffix =
    kind === 'color' ? '_Color.' : kind === 'normal' ? '_NormalGL.' : '_Roughness.';
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findMapFile(full, assetId, kind);
      if (nested) return nested;
    } else if (entry.name.includes(assetId) && entry.name.includes(suffix) && entry.name.endsWith('.jpg')) {
      return full;
    }
  }
  return null;
}

async function fetchTextureSet(relativeFolder, assetId) {
  const colorDest = join(ROOT, relativeFolder, 'color.jpg');
  const normalDest = join(ROOT, relativeFolder, 'normal.jpg');
  const roughDest = join(ROOT, relativeFolder, 'roughness.jpg');

  if (existsSync(colorDest) && existsSync(normalDest) && existsSync(roughDest)) {
    console.log(`skip ${relativeFolder} (exists)`);
    return;
  }

  const zipUrl = `https://ambientcg.com/get?file=${assetId}_1K-JPG.zip`;
  const tempRoot = mkdtempSync(join(tmpdir(), 'vish-tex-'));
  const zipPath = join(tempRoot, `${assetId}.zip`);
  const extractDir = join(tempRoot, 'extract');

  try {
    process.stdout.write(`fetch ${relativeFolder} (${assetId}) ... `);
    const zipData = await download(zipUrl);
    writeFileSync(zipPath, zipData);
    extractZip(zipPath, extractDir);

    const colorSrc = findMapFile(extractDir, assetId, 'color');
    const normalSrc = findMapFile(extractDir, assetId, 'normal');
    const roughSrc = findMapFile(extractDir, assetId, 'roughness');

    if (!colorSrc || !normalSrc || !roughSrc) {
      throw new Error('missing maps in zip');
    }

    mkdirSync(join(ROOT, relativeFolder), { recursive: true });
    cpSync(colorSrc, colorDest);
    cpSync(normalSrc, normalDest);
    cpSync(roughSrc, roughDest);
    console.log('ok');
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

async function main() {
  const missing = [];

  if (!VERIFY_ONLY) {
    for (const [folder, assetId] of Object.entries(TEXTURE_SETS)) {
      try {
        await fetchTextureSet(folder, assetId);
      } catch (error) {
        console.log('FAILED');
        console.error(`  ${error instanceof Error ? error.message : error}`);
        missing.push(`${folder}/*`);
      }
    }

    for (const [relativePath, url] of Object.entries(HDRI_SOURCE)) {
      const dest = join(ROOT, relativePath);
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

    writeFileSync(join(ROOT, 'public/textures/README.md'), README, 'utf8');
  }

  if (VERIFY_ONLY) {
    for (const relativePath of ALL_EXPECTED) {
      if (!existsSync(join(ROOT, relativePath))) missing.push(relativePath);
    }
  }

  if (missing.length > 0) {
    console.error(`\nMissing ${missing.length} texture asset(s):`);
    for (const path of missing) console.error(`  - ${path}`);
    process.exit(1);
  }

  console.log(VERIFY_ONLY ? 'All scene textures present.' : 'Scene textures ready.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
