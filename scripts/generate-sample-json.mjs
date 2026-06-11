#!/usr/bin/env node
/**
 * Export builder-based showcase templates to public/samples/*.json
 * Run: node scripts/generate-sample-json.mjs
 */
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public', 'samples');

async function main() {
  const {
    buildFurnitureShowcaseTemplate,
    buildLandscapeGardenTemplate,
    buildMepLightingShowcaseTemplate,
    buildFullFeatureShowcaseTemplate,
  } = await import('../src/core/templateBuilder.ts');

  const manifests = {
    'furniture-showcase': buildFurnitureShowcaseTemplate(),
    'landscape-garden': buildLandscapeGardenTemplate(),
    'mep-lighting-showcase': buildMepLightingShowcaseTemplate(),
    'full-feature-showcase': buildFullFeatureShowcaseTemplate(),
  };

  for (const [id, manifest] of Object.entries(manifests)) {
    const path = join(outDir, `${id}.json`);
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
    console.log(`Wrote ${path}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
