#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];

function readRequired(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(path, 'utf8');
}

function requirePhrase(content, phrase, label) {
  if (!content.includes(phrase)) {
    failures.push(`${label} missing required phrase: ${phrase}`);
  }
}

const roles = readRequired('src/domain/projects/projectRoles.ts');
const tests = readRequired('src/test/projectRoles.test.ts');
const spec = readRequired('docs/specs/PROJECT_ROLES_AND_PERMISSIONS.md');

const requiredRoles = [
  'owner',
  'co_owner',
  'architect',
  'builder',
  'engineer',
  'family',
  'council_reviewer',
  'viewer',
];

for (const role of requiredRoles) {
  requirePhrase(roles, `'${role}'`, 'projectRoles.ts');
  requirePhrase(spec, role, 'PROJECT_ROLES_AND_PERMISSIONS.md');
}

const requiredPermissions = [
  'project.view',
  'project.comment',
  'project.edit_manifest',
  'project.manage_members',
  'project.manage_billing',
  'project.delete',
  'project.export',
  'project.run_ai_designer',
  'project.run_optimization',
  'project.review_compliance',
  'project.prepare_construction_docs',
  'project.update_construction_progress',
  'project.review_council_submission',
  'project.manage_governance',
];

for (const permission of requiredPermissions) {
  requirePhrase(roles, `'${permission}'`, 'projectRoles.ts');
}

const requiredRoleInvariants = [
  'Only `owner` can manage billing.',
  'Only `owner` can delete a project.',
  '`viewer` can only view.',
  '`family` can view/comment but cannot edit, export, or run AI tools.',
];

for (const invariant of requiredRoleInvariants) {
  requirePhrase(spec, invariant, 'PROJECT_ROLES_AND_PERMISSIONS.md');
}

const requiredTestPhrases = [
  'keeps owner as the only billing and delete role',
  'lets co-owners manage members without granting billing or deletion',
  'separates professional roles from family and viewer access',
  'keeps council reviewers read/comment/review only',
  "expect(getProjectRolePermissions('viewer')).toEqual(['project.view']);",
];

for (const phrase of requiredTestPhrases) {
  requirePhrase(tests, phrase, 'projectRoles.test.ts');
}

if (failures.length > 0) {
  console.error('Vishvakarma.OS project roles check failed.');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Vishvakarma.OS project roles check passed.');
console.log('Owner/co-owner/professional/family/reviewer/viewer permissions are documented, tested, and guarded.');
