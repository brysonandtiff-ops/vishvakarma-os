#!/usr/bin/env node
/** Build e2e auth preview and run auth-gate Playwright with a stable server (Windows-safe). */
import { execSync, spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const previewPort = process.env.PLAYWRIGHT_PREVIEW_PORT ?? '4173';
const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${previewPort}`;
const playwrightArgs = process.argv.slice(2);
const project = process.env.PLAYWRIGHT_AUTH_PROJECT ?? 'auth-gate';

const authEnv = {
  ...process.env,
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_ALLOW_LOCAL_DEMO: '',
  VITE_E2E_ALLOW_LOCAL_ACCESS: '',
  PLAYWRIGHT_BASE_URL: previewUrl,
  PLAYWRIGHT_REUSE_SERVER: '',
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
      env: { ...authEnv, PLAYWRIGHT_REUSE_SERVER: '1' },
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
  execSync('pnpm exec vite build --mode e2e', { stdio: 'inherit', env: authEnv, shell: true });
}
await delay(1000);

const preview = spawn(
  'pnpm',
  ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', previewPort],
  { env: authEnv, stdio: 'inherit', shell: true },
);

const testArgs = playwrightArgs.length > 0 ? playwrightArgs : [`--project=${project}`];

try {
  await delay(3000);
  await waitForPreview();
  await runPlaywrightAsync(testArgs);
} finally {
  if (preview.exitCode === null) {
    preview.kill('SIGTERM');
  }
  freePreviewPort();
  await delay(1000);
}
