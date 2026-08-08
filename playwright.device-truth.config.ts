import { defineConfig, type Project } from '@playwright/test';

const previewUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:4173';
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1';

const appSmokeServerEnv = {
  ...process.env,
  VITE_FIREBASE_API_KEY: '',
  VITE_FIREBASE_AUTH_DOMAIN: '',
  VITE_FIREBASE_PROJECT_ID: '',
  VITE_FIREBASE_STORAGE_BUCKET: '',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '',
  VITE_FIREBASE_APP_ID: '',
  VITE_ALLOW_LOCAL_DEMO: '',
  VITE_E2E_ALLOW_LOCAL_ACCESS: 'true',
};

type DeviceClass = 'phone' | 'tablet' | 'desktop' | 'hybrid';
type EvidenceKind = 'EMULATED';

type ProfileOptions = {
  name: string;
  browserName: 'chromium' | 'firefox' | 'webkit';
  width: number;
  height: number;
  deviceClass: DeviceClass;
  hasTouch?: boolean;
  isMobile?: boolean;
  deviceScaleFactor?: number;
  label: string;
};

function profile(options: ProfileOptions): Project {
  const mobileContext = options.browserName === 'firefox'
    ? {}
    : { isMobile: options.isMobile ?? false };

  return {
    name: options.name,
    metadata: {
      deviceClass: options.deviceClass,
      deviceLabel: options.label,
      evidenceKind: 'EMULATED' satisfies EvidenceKind,
      canonicalOrientation: options.width <= options.height ? 'portrait' : 'landscape',
    },
    use: {
      browserName: options.browserName,
      viewport: { width: options.width, height: options.height },
      hasTouch: options.hasTouch ?? false,
      deviceScaleFactor: options.deviceScaleFactor ?? 1,
      ...mobileContext,
    },
  };
}

const projects: Project[] = [
  profile({
    name: 'iphone-small-webkit',
    browserName: 'webkit',
    width: 375,
    height: 667,
    deviceClass: 'phone',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    label: 'iPhone SE class / small iPhone',
  }),
  profile({
    name: 'iphone-standard-webkit',
    browserName: 'webkit',
    width: 390,
    height: 844,
    deviceClass: 'phone',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
    label: 'iPhone 13/14 class',
  }),
  profile({
    name: 'iphone-large-webkit',
    browserName: 'webkit',
    width: 430,
    height: 932,
    deviceClass: 'phone',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 3,
    label: 'iPhone Pro Max class',
  }),
  profile({
    name: 'android-phone-chromium',
    browserName: 'chromium',
    width: 412,
    height: 915,
    deviceClass: 'phone',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2.625,
    label: 'Pixel / Galaxy large phone class',
  }),
  profile({
    name: 'ipad-mini-webkit',
    browserName: 'webkit',
    width: 744,
    height: 1133,
    deviceClass: 'tablet',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    label: 'iPad mini class',
  }),
  profile({
    name: 'ipad-11-webkit',
    browserName: 'webkit',
    width: 834,
    height: 1194,
    deviceClass: 'tablet',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    label: 'iPad Air / Pro 11-inch class',
  }),
  profile({
    name: 'ipad-13-webkit',
    browserName: 'webkit',
    width: 1024,
    height: 1366,
    deviceClass: 'tablet',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    label: 'iPad Pro 13-inch class',
  }),
  profile({
    name: 'android-tablet-chromium',
    browserName: 'chromium',
    width: 800,
    height: 1280,
    deviceClass: 'tablet',
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    label: 'Android 10-11 inch tablet class',
  }),
  profile({
    name: 'desktop-chromium-1366',
    browserName: 'chromium',
    width: 1366,
    height: 768,
    deviceClass: 'desktop',
    label: 'Windows laptop 1366x768 class',
  }),
  profile({
    name: 'desktop-chromium-1920',
    browserName: 'chromium',
    width: 1920,
    height: 1080,
    deviceClass: 'desktop',
    label: 'Windows desktop 1920x1080 class',
  }),
  profile({
    name: 'desktop-firefox-1440',
    browserName: 'firefox',
    width: 1440,
    height: 900,
    deviceClass: 'desktop',
    label: 'Firefox desktop 1440x900 class',
  }),
  profile({
    name: 'desktop-webkit-1440',
    browserName: 'webkit',
    width: 1440,
    height: 900,
    deviceClass: 'desktop',
    label: 'Safari/WebKit desktop 1440x900 class',
  }),
  profile({
    name: 'touch-hybrid-chromium',
    browserName: 'chromium',
    width: 1280,
    height: 800,
    deviceClass: 'hybrid',
    hasTouch: true,
    deviceScaleFactor: 1.25,
    label: 'Surface-style touch laptop class',
  }),
];

export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/device-truth.spec.ts'],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  outputDir: 'evidence/device-tests/artifacts',
  reporter: [
    ['list'],
    ['json', { outputFile: 'evidence/device-tests/results.json' }],
    ['html', { outputFolder: 'evidence/device-tests/html-report', open: 'never' }],
  ],
  use: {
    baseURL: previewUrl,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    reducedMotion: 'reduce',
  },
  webServer: {
    command: 'pnpm run preview:e2e:local',
    url: previewUrl,
    reuseExistingServer,
    timeout: 300_000,
    env: appSmokeServerEnv,
  },
  projects,
});
