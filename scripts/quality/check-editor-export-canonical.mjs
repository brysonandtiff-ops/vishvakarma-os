#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const editorPath = join(root, 'src/pages/EditorPage.tsx');
const helperPath = join(root, 'src/core/projectExport.ts');

const failures = [];

if (!existsSync(helperPath)) {
  failures.push('Missing canonical project export helper: src/core/projectExport.ts');
}

if (!existsSync(editorPath)) {
  failures.push('Missing editor page: src/pages/EditorPage.tsx');
} else {
  const editor = readFileSync(editorPath, 'utf8');

  if (!editor.includes('buildProjectExportFilename') || !editor.includes('serializeProjectManifest')) {
    failures.push('EditorPage export must use buildProjectExportFilename and serializeProjectManifest from the canonical export helper.');
  }

  if (editor.includes('JSON.stringify(manifest, null, 2)')) {
    failures.push('EditorPage still contains inline JSON export serialization. Use serializeProjectManifest(manifest).');
  }

  if (editor.includes("`${manifest.name.replace(/\\s+/g, '-').toLowerCase()}-floor-plan.json`")) {
    failures.push('EditorPage still contains inline export filename logic. Use buildProjectExportFilename(manifest).');
  }
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS editor export canonical check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS editor export canonical check passed.');
console.log('EditorPage export is wired to the canonical export helper.');
