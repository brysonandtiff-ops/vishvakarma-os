#!/usr/bin/env node
/** Run auth-gate and app-smoke Playwright projects with isolated e2e builds. */
import { execSync, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const previewPort = process.env.PLAYWRIGHT_PREVIEW_PORT ?? '4173';
const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${previewPort}`;
const ALL_BROWSERS = ['chromium', 'firefox', 'webkit'];

function parseBrowsers() {
  const raw = process.env.PLAYWRIGHT_BROWSERS ?? 'chromium';
  if (raw === 'all') {
    return ALL_BROWSERS;
  }

  const selected = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const invalid = selected.filter((browser) => !ALL_BROWSERS.includes(browser));
  if (invalid.length > 0) {
    throw new Error(`Unknown PLAYWRIGHT_BROWSERS value(s): ${invalid.join(', ')}`);
  }

  return selected.length > 0 ? selected : ['chromium'];
}

const browsers = parseBrowsers();

const baseEnv = {
  ...process.env,
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_ALLOW_LOCAL_DEMO: '',
  PLAYWRIGHT_BASE_URL: previewUrl,
};

function freePreviewPort() {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${previewPort} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`,
        { stdio: 'ignore' },
      );
    } else {
      execSync(`lsof -ti:${previewPort} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore', shell: true });
    }
  } catch {
    // port already free
  }
}

async function waitForPreview(maxMs = 300_000) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    try {
      const response = await fetch(previewUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.ok || response.status === 404) return;
    } catch {
      // preview still starting
    }
    await delay(500);
  }
  throw new Error(`Preview server did not start at ${previewUrl}`);
}

function run(command, env) {
  execSync(command, {
    stdio: 'inherit',
    env: { ...baseEnv, ...env },
    shell: true,
  });
}

function runPlaywrightAsync(project, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'pnpm',
      ['exec', 'playwright', 'test', `--project=${project}`],
      {
        stdio: 'inherit',
        env: { ...baseEnv, ...env, PLAYWRIGHT_REUSE_SERVER: '1' },
        shell: true,
      },
    );
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Playwright exited with code ${code} for project ${project}`));
    });
  });
}

async function runPlaywrightProject(project, env) {
  freePreviewPort();
  await delay(1000);

  const preview = spawn(
    'pnpm',
    ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', previewPort],
    { env: { ...baseEnv, ...env }, stdio: 'inherit', shell: true },
  );

  const keepalive = setInterval(() => {
    if (preview.exitCode !== null) {
      console.error(`Preview server exited early with code ${preview.exitCode}`);
    }
  }, 15_000);

  try {
    await delay(3000);
    await waitForPreview();
    await runPlaywrightAsync(project, env);
  } finally {
    clearInterval(keepalive);
    if (preview.exitCode === null) {
      preview.kill('SIGTERM');
    }
    freePreviewPort();
    await delay(1000);
  }
}

console.log(`[e2e] Browsers: ${browsers.join(', ')}`);

freePreviewPort();
run('pnpm exec vite build --mode e2e', { VITE_E2E_ALLOW_LOCAL_ACCESS: '' });

for (const browser of browsers) {
  console.log(`[e2e] auth-gate-${browser}`);
  await runPlaywrightProject(`auth-gate-${browser}`, { VITE_E2E_ALLOW_LOCAL_ACCESS: '' });
}

run(
  'pnpm exec vite build --mode e2e-local',
  { VITE_E2E_ALLOW_LOCAL_ACCESS: 'true', VITE_ALLOW_LOCAL_DEMO: 'true' },
);

for (const browser of browsers) {
  console.log(`[e2e] app-smoke-${browser}`);
  await runPlaywrightProject(`app-smoke-${browser}`, {
    VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
    VITE_ALLOW_LOCAL_DEMO: 'true',
  });
}
