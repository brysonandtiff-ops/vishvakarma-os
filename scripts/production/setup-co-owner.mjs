#!/usr/bin/env node
/**
 * Promote a Firebase user to co-owner: admin governance role + enterprise billing.
 * Requires: GOOGLE_APPLICATION_CREDENTIALS, optional FIREBASE_PROJECT_ID
 *
 * Prerequisite: the user must have signed in at least once so Firebase Auth has their account.
 */
import { readFile } from 'node:fs/promises';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/production/setup-co-owner.mjs <email>');
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

let user;
try {
  user = await auth.getUserByEmail(email);
} catch (error) {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : null;
  if (code === 'auth/user-not-found') {
    console.error(
      `No Firebase Auth account for ${email}. Ask them to sign in on production once, then rerun this script.`
    );
    process.exit(1);
  }
  throw error;
}

const now = new Date().toISOString();

await auth.setCustomUserClaims(user.uid, { role: 'admin' });
await db.collection('profiles').doc(user.uid).set(
  {
    id: user.uid,
    email: user.email,
    role: 'admin',
    ownerId: user.uid,
    updated_at: now,
  },
  { merge: true }
);
await db.collection('billing').doc(user.uid).set(
  {
    id: user.uid,
    plan: 'enterprise',
    status: 'active',
    updated_at: now,
  },
  { merge: true }
);

console.log(`Promoted ${email} (${user.uid}) to co-owner.`);
console.log('  - profiles.role = admin');
console.log('  - billing.plan = enterprise, billing.status = active');
console.log('Ask them to sign out and back in to refresh their session.');
