import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MANIFEST_PATH = join(process.cwd(), 'src', 'governance', 'gates', 'gate-manifest.json');

export function loadGateManifest() {
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
}

export function getGateManifestPath() {
  return MANIFEST_PATH;
}
