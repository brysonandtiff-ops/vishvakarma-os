#!/usr/bin/env node
/**
 * Import migration/export-*.json into Firestore using Firebase Admin SDK.
 * Requires: GOOGLE_APPLICATION_CREDENTIALS, FIREBASE_PROJECT_ID (optional override)
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const inputArg = process.argv[2];
const migrationDir = join(process.cwd(), 'migration');

async function resolveInputPath() {
  if (inputArg) return inputArg;
  const files = (await readdir(migrationDir)).filter((name) => name.startsWith('export-') && name.endsWith('.json'));
  if (files.length === 0) {
    throw new Error('No export-*.json found in migration/. Pass a file path argument.');
  }
  files.sort();
  return join(migrationDir, files.at(-1));
}

const inputPath = await resolveInputPath();
const raw = JSON.parse(await readFile(inputPath, 'utf8'));

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!credentialsPath) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account JSON file.');
  process.exit(1);
}

const serviceAccount = JSON.parse(await readFile(credentialsPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: projectId || serviceAccount.project_id,
  });
}

const db = getFirestore();

const collectionMap = {
  profiles: 'profiles',
  projects: 'projects',
  specs: 'specs',
  registry: 'registry',
  change_requests: 'change_requests',
  releases: 'releases',
  audit_logs: 'audit_logs',
  route_manifest: 'route_manifest',
};

for (const [table, collection] of Object.entries(collectionMap)) {
  const rows = raw.tables?.[table] ?? [];
  let written = 0;

  for (const row of rows) {
    const id = row.id;
    if (!id) continue;

    const ownerId = row.user_id || row.ownerId || row.id;
    await db.collection(collection).doc(String(id)).set({
      ...row,
      ownerId,
      migratedAt: new Date().toISOString(),
      migrationSource: 'supabase',
    }, { merge: true });
    written += 1;
  }

  console.log(`Imported ${collection}: ${written} documents`);
}

console.log(`Import complete from ${inputPath}`);
