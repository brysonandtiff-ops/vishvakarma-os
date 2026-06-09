#!/usr/bin/env node
/** Build e2e-local preview and run Playwright with a stable reuse server (Windows-safe). */
import { execSync, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const previewPort = process.env.PLAYWRIGHT_PREVIEW_PORT ?? '4173';
const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${previewPort}`;
const playwrightArgs = process.argv.slice(2);

if (playwrightArgs.length === 0) {
  console.error('Usage: node scripts/run-local-preview-playwright.mjs <playwright test args>');
  process.exit(1);
}

const baseEnv = {
  ...process.env,
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_ALLOW_LOCAL_DEMO: 'true',
  VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
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

function runPlaywrightAsync(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['exec', 'playwright', 'test', ...args], {
      stdio: 'inherit',
      env: { ...baseEnv, PLAYWRIGHT_REUSE_SERVER: '1' },
      shell: true,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Playwright exited with code ${code}`));
    });
  });
}

freePreviewPort();
if (process.env.SKIP_BUILD !== '1') {
  execSync('pnpm exec vite build --mode e2e-local', { stdio: 'inherit', env: baseEnv, shell: true });
}
await delay(1000);

const preview = spawn(
  'pnpm',
  ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', previewPort],
  { env: baseEnv, stdio: 'inherit', shell: true },
);

try {
  await delay(3000);
  await waitForPreview();
  await runPlaywrightAsync(playwrightArgs);
} finally {
  if (preview.exitCode === null) {
    preview.kill('SIGTERM');
  }
  freePreviewPort();
  await delay(1000);
}
