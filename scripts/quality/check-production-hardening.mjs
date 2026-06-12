#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function readRequiredFile(path, label) {
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${label}`);
    return '';
  }

  return readFileSync(path, 'utf8');
}

function requirePhrase(content, phrase, label) {
  if (!content.includes(phrase)) {
    failures.push(`${label} is missing required hardening phrase: ${phrase}`);
  }
}

function forbidPhrase(content, phrase, label) {
  if (content.includes(phrase)) {
    failures.push(`${label} contains forbidden regression phrase: ${phrase}`);
  }
}

const projectGateway = readRequiredFile(
  join(root, 'src/backend/firebase/firestoreProjectGateway.ts'),
  'src/backend/firebase/firestoreProjectGateway.ts',
);
const firestoreRules = readRequiredFile(join(root, 'firestore.rules'), 'firestore.rules');
const collabServer = readRequiredFile(join(root, 'server/collab/presenceServer.ts'), 'server/collab/presenceServer.ts');
const packageJson = readRequiredFile(join(root, 'package.json'), 'package.json');

requirePhrase(projectGateway, 'ownerId: existing.ownerId', 'Firestore project gateway');
requirePhrase(projectGateway, 'collaborators: existing.collaborators ?? []', 'Firestore project gateway');
requirePhrase(projectGateway, 'created_at: existing.created_at', 'Firestore project gateway');
forbidPhrase(projectGateway, 'ownerId: getCurrentOwnerId(),', 'Firestore project gateway');

requirePhrase(firestoreRules, 'function projectIdentityIsStable()', 'Firestore rules');
requirePhrase(firestoreRules, 'request.resource.data.ownerId == resource.data.ownerId', 'Firestore rules');
requirePhrase(firestoreRules, 'request.resource.data.created_at == resource.data.created_at', 'Firestore rules');
requirePhrase(firestoreRules, 'function collaboratorListIsStable()', 'Firestore rules');
requirePhrase(firestoreRules, 'request.resource.data.collaborators == resource.data.collaborators', 'Firestore rules');
requirePhrase(firestoreRules, 'isOwnerOnCreate(docId)', 'Firestore rules');

requirePhrase(collabServer, 'function normalizeOrigin', 'Collaboration presence server');
requirePhrase(collabServer, 'ALLOWED_ORIGINS.includes(normalized)', 'Collaboration presence server');
requirePhrase(collabServer, "process.env.ALLOW_MISSING_ORIGIN === 'true'", 'Collaboration presence server');
forbidPhrase(collabServer, 'origin.startsWith(allowed)', 'Collaboration presence server');

requirePhrase(packageJson, '"node": "20.x"', 'package.json');

if (failures.length > 0) {
  console.error('Vishvakarma.OS production hardening check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS production hardening check passed.');
console.log('Project ownership, Firestore rule immutability, collab origin checks, and Node runtime pin are guarded.');
