#!/usr/bin/env node
/**
 * Export Firestore collections to JSON for Supabase import.
 * Requires GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.
 *
 * Usage: node scripts/migration/export-firestore.mjs [--out migration/export-firestore.json]
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'gen-lang-client-0690161780';
const outArg = process.argv.find((arg) => arg.startsWith('--out='));
const outPath = outArg?.slice('--out='.length) ?? join(process.cwd(), 'migration/export-firestore.json');

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
      projectId: PROJECT_ID,
    });
  }

  return initializeApp({ projectId: PROJECT_ID });
}

function docToPlain(data) {
  const plain = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value.toDate === 'function') {
      plain[key] = value.toDate().toISOString();
    } else {
      plain[key] = value;
    }
  }
  return plain;
}

async function exportCollection(db, name) {
  const snapshot = await db.collection(name).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...docToPlain(doc.data()) }));
}

async function main() {
  const db = getFirestore(getAdminApp());
  const collections = [
    'profiles',
    'projects',
    'specs',
    'registry',
    'change_requests',
    'releases',
    'audit_logs',
    'route_manifest',
    'billing',
    'optimization_batches',
  ];

  const payload = {
    exportedAt: new Date().toISOString(),
    projectId: PROJECT_ID,
    collections: {},
  };

  for (const name of collections) {
    payload.collections[name] = await exportCollection(db, name);
    console.log(`[INFO] Exported ${name}: ${payload.collections[name].length} documents`);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`[PASS] Wrote ${outPath}`);
}

main().catch((error) => {
  console.error('[FAIL]', error instanceof Error ? error.message : error);
  process.exit(1);
});
