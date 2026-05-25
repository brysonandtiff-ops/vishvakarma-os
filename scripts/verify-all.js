#!/usr/bin/env node
// verify:all - Honest release-gate validation for Vishvakarma.OS.
// This script must never mark manual checks as passed.

import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';

const gates = [];

function pass(name, message, details = []) {
  return { name, status: 'PASS', passed: true, message, details };
}

function fail(name, message, details = []) {
  return { name, status: 'FAIL', passed: false, message, details };
}

function manual(name, message, details = []) {
  return { name, status: 'MANUAL', passed: false, message, details };
}

async function fileExists(path) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function readText(path) {
  return readFile(path, 'utf-8');
}

async function checkSpecGate() {
  const name = 'Gate 1: Governing spec present';
  const specPath = join(process.cwd(), 'docs', 'SPEC.md');

  if (!(await fileExists(specPath))) {
    return fail(name, 'SPEC.md is missing or unreadable.', [specPath]);
  }

  const spec = await readText(specPath);
  const requiredTerms = ['Blueprint', 'Governance', 'Release', 'Audit'];
  const missing = requiredTerms.filter((term) => !spec.includes(term));

  if (missing.length > 0) {
    return fail(name, 'SPEC.md is present but missing required governance terms.', missing);
  }

  return pass(name, 'SPEC.md is present and contains core governance language.');
}

async function checkRegistryGate() {
  const name = 'Gate 2: Registry present';
  const registryPath = join(process.cwd(), 'docs', 'REGISTRY.md');

  if (!(await fileExists(registryPath))) {
    return fail(name, 'REGISTRY.md is missing or unreadable.', [registryPath]);
  }

  const registry = await readText(registryPath);
  const requiredEntities = [
    'Project',
    'ProjectManifest',
    'GridSettings',
    'Wall',
    'Opening',
    'Material',
    'Environment',
    'Viewport',
  ];
  const missing = requiredEntities.filter((entity) => !registry.toLowerCase().includes(entity.toLowerCase()));

  if (missing.length > 0) {
    return fail(name, 'Registry is present but missing required entities.', missing);
  }

  return pass(name, 'Registry is present and covers required entities.');
}

async function checkRoutesGate() {
  const name = 'Gate 3: Route manifest present';
  const routesPath = join(process.cwd(), 'src', 'routes.tsx');

  if (!(await fileExists(routesPath))) {
    return fail(name, 'src/routes.tsx is missing.', [routesPath]);
  }

  const routes = await readText(routesPath);
  const requiredRoutes = ['/', '/spec-center', '/registry', '/change-requests', '/releases', '/audit'];
  const missing = requiredRoutes.filter((route) => !routes.includes(route));

  if (missing.length > 0) {
    return fail(name, 'Route manifest is missing required production routes.', missing);
  }

  return pass(name, 'Route manifest contains required production routes.');
}

async function checkSampleGate() {
  const name = 'Gate 4: Sample project validates as JSON';
  const samplePath = join(process.cwd(), 'public', 'samples', 'sample-house-01.json');

  if (!(await fileExists(samplePath))) {
    return fail(name, 'Sample project file is missing.', [samplePath]);
  }

  try {
    const sample = JSON.parse(await readText(samplePath));
    const hasProjectShape = typeof sample === 'object' && sample !== null;

    if (!hasProjectShape) {
      return fail(name, 'Sample JSON does not parse into an object.');
    }

    return pass(name, 'Sample project JSON parses successfully.');
  } catch (error) {
    return fail(name, 'Sample project JSON is invalid.', [String(error)]);
  }
}

async function checkVercelSecurityGate() {
  const name = 'Gate 5: Production security headers configured';
  const vercelPath = join(process.cwd(), 'vercel.json');

  if (!(await fileExists(vercelPath))) {
    return fail(name, 'vercel.json is missing.', [vercelPath]);
  }

  const vercel = await readText(vercelPath);
  const requiredHeaders = [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ];
  const missing = requiredHeaders.filter((header) => !vercel.includes(header));

  if (missing.length > 0) {
    return fail(name, 'Production security headers are incomplete.', missing);
  }

  return pass(name, 'Production security headers are configured.');
}

async function checkEnvTemplateGate() {
  const name = 'Gate 6: Environment template present';
  const envPath = join(process.cwd(), '.env.example');

  if (!(await fileExists(envPath))) {
    return fail(name, '.env.example is missing.', [envPath]);
  }

  const env = await readText(envPath);
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  const missing = required.filter((key) => !env.includes(key));

  if (missing.length > 0) {
    return fail(name, '.env.example is missing required production variables.', missing);
  }

  return pass(name, '.env.example documents required Supabase variables.');
}

function checkManualGate(name, commandOrEvidence) {
  return manual(name, 'Manual or runtime proof is required. This gate is not auto-passed.', [commandOrEvidence]);
}

async function runAllGates() {
  console.log('Running honest release gates for Vishvakarma.OS\n');
  console.log('='.repeat(72));

  gates.push(await checkSpecGate());
  gates.push(await checkRegistryGate());
  gates.push(await checkRoutesGate());
  gates.push(await checkSampleGate());
  gates.push(await checkVercelSecurityGate());
  gates.push(await checkEnvTemplateGate());
  gates.push(checkManualGate('Gate 7: Unit tests green', 'Run: pnpm run test'));
  gates.push(checkManualGate('Gate 8: E2E route smoke green', 'Run: pnpm run test:e2e'));
  gates.push(checkManualGate('Gate 9: Save/load determinism', 'Attach Supabase or local-mode save/load evidence'));
  gates.push(checkManualGate('Gate 10: 2D/3D parity', 'Attach sample project 2D wall/opening count vs 3D render evidence'));
  gates.push(checkManualGate('Gate 11: iPad touch target audit', 'Attach iPad or emulated coarse-pointer screenshots'));
  gates.push(checkManualGate('Gate 12: Performance acceptable', 'Attach build size and runtime interaction evidence'));

  let passCount = 0;
  let manualCount = 0;
  let failCount = 0;

  for (const [index, gate] of gates.entries()) {
    const icon = gate.status === 'PASS' ? 'PASS' : gate.status === 'MANUAL' ? 'MANUAL' : 'FAIL';
    console.log(`\n${index + 1}. [${icon}] ${gate.name}`);
    console.log(`   ${gate.message}`);
    for (const detail of gate.details ?? []) {
      console.log(`   - ${detail}`);
    }

    if (gate.status === 'PASS') passCount += 1;
    if (gate.status === 'MANUAL') manualCount += 1;
    if (gate.status === 'FAIL') failCount += 1;
  }

  console.log('\n' + '='.repeat(72));
  console.log(`Passed: ${passCount}`);
  console.log(`Manual evidence required: ${manualCount}`);
  console.log(`Failed: ${failCount}`);

  if (failCount > 0) {
    console.log('\nRELEASE BLOCKED: failing gates must be fixed.');
    process.exit(1);
  }

  if (manualCount > 0) {
    console.log('\nRELEASE NOT AUTO-CLEARED: manual evidence must be attached before public launch.');
    process.exit(2);
  }

  console.log('\nRELEASE CLEARED: all gates passed with no manual evidence outstanding.');
  process.exit(0);
}

runAllGates().catch((error) => {
  console.error('Fatal error running gates:', error);
  process.exit(1);
});
