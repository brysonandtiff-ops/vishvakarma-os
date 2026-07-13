#!/usr/bin/env node

const OWNER = process.env.GITHUB_OWNER?.trim() || 'brysonandtiff-ops';
const TOKEN = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
const API_ROOT = 'https://api.github.com';
const API_VERSION = '2026-03-10';
const verifyOnly = process.argv.includes('--verify-only');
const dryRun = process.argv.includes('--dry-run');

if (!TOKEN) {
  console.error('GITHUB_TOKEN or GH_TOKEN is required.');
  console.error('Use a fine-grained token with Administration: write for every owned repository.');
  process.exit(1);
}

async function github(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${TOKEN}`,
      'X-GitHub-Api-Version': API_VERSION,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'message' in body
        ? body.message
        : text || response.statusText;
    throw new Error(`${response.status} ${message}`);
  }

  return body;
}

async function listOwnedRepositories() {
  const repositories = [];
  for (let page = 1; ; page += 1) {
    const batch = await github(
      `/user/repos?affiliation=owner&per_page=100&page=${page}&sort=full_name`,
    );
    if (!Array.isArray(batch)) throw new Error('GitHub returned an invalid repository list.');

    repositories.push(
      ...batch.filter(
        (repo) =>
          repo &&
          typeof repo === 'object' &&
          repo.owner?.login?.toLowerCase() === OWNER.toLowerCase(),
      ),
    );
    if (batch.length < 100) break;
  }
  return repositories;
}

async function readActionsState(fullName) {
  return github(`/repos/${fullName}/actions/permissions`);
}

async function disableActions(fullName) {
  await github(`/repos/${fullName}/actions/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ enabled: false }),
  });
}

async function main() {
  const repositories = await listOwnedRepositories();
  console.log(`Found ${repositories.length} repositories owned by ${OWNER}.`);

  const failures = [];
  const disabled = [];
  const alreadyDisabled = [];

  for (const repository of repositories) {
    const fullName = repository.full_name;
    try {
      const before = await readActionsState(fullName);
      if (before?.enabled === false) {
        alreadyDisabled.push(fullName);
        console.log(`✓ ${fullName}: already disabled`);
        continue;
      }

      if (verifyOnly) {
        failures.push(`${fullName}: GitHub Actions is enabled`);
        console.error(`✗ ${fullName}: enabled`);
        continue;
      }

      if (dryRun) {
        console.log(`• ${fullName}: would disable`);
        continue;
      }

      await disableActions(fullName);
      const after = await readActionsState(fullName);
      if (after?.enabled !== false) {
        throw new Error('verification returned enabled=true');
      }

      disabled.push(fullName);
      console.log(`✓ ${fullName}: disabled and verified`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${fullName}: ${message}`);
      console.error(`✗ ${fullName}: ${message}`);
    }
  }

  console.log('\nSummary');
  console.log(`  disabled now: ${disabled.length}`);
  console.log(`  already disabled: ${alreadyDisabled.length}`);
  console.log(`  failures: ${failures.length}`);

  if (failures.length > 0) {
    console.error('\nRepositories requiring attention:');
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
