#!/usr/bin/env node
/**
 * Promote a Firebase user to admin by setting Firestore profile role and custom claims.
 * Requires: GOOGLE_APPLICATION_CREDENTIALS, optional FIREBASE_PROJECT_ID
 */
import { readFile } from 'node:fs/promises';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/production/setup-admin.mjs <email>');
  process.exit(1);
}

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credentialsPath) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to a Firebase service account JSON file.');
  process.exit(1);
}

const serviceAccount = JSON.parse(await readFile(credentialsPath, 'utf8'));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
}

const auth = getAuth();
const db = getFirestore();
const user = await auth.getUserByEmail(email);

await auth.setCustomUserClaims(user.uid, { role: 'admin' });
await db.collection('profiles').doc(user.uid).set(
  {
    id: user.uid,
    email: user.email,
    role: 'admin',
    ownerId: user.uid,
    updated_at: new Date().toISOString(),
  },
  { merge: true }
);

console.log(`Promoted ${email} (${user.uid}) to admin.`);
