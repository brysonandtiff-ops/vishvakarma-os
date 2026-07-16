#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (/\.tsx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

function importedHelperNames(source) {
  const names = new Set();
  const pattern = /import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\/helpers['"]/g;
  for (const match of source.matchAll(pattern)) {
    for (const item of match[1].split(',')) {
      const name = item.trim().split(/\s+as\s+/)[0]?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

function exportedNames(source) {
  const names = new Set();
  for (const match of source.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  for (const match of source.matchAll(/export\s+const\s+([A-Za-z_$][\w$]*)/g)) names.add(match[1]);
  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}/g)) {
    for (const item of match[1].split(',')) {
      const name = item.trim().split(/\s+as\s+/).pop()?.trim();
      if (name) names.add(name);
    }
  }
  return names;
}

async function main() {
  const files = await walk('e2e');
  const importers = {};
  const imported = new Set();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const names = [...importedHelperNames(source)].sort();
    if (names.length) {
      importers[file] = names;
      names.forEach((name) => imported.add(name));
    }
  }

  const helpersSource = await readFile('e2e/helpers.ts', 'utf8');
  const exported = exportedNames(helpersSource);
  const missing = [...imported].filter((name) => !exported.has(name)).sort();
  const output = {
    imported: [...imported].sort(),
    exported: [...exported].sort(),
    missing,
    importers,
    inspectedAt: new Date().toISOString(),
  };
  console.log(JSON.stringify(output, null, 2));
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${JSON.stringify(output, null, 2)}</pre>`, 'utf8');
}

main().catch(async (error) => {
  console.error(error);
  await mkdir('dist', { recursive: true });
  await writeFile('dist/index.html', `<pre>${String(error)}</pre>`, 'utf8');
  process.exit(1);
});
