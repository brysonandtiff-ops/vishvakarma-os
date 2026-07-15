import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

const buildSourceMaps =
  process.env.VISH_BUILD_SOURCEMAPS === 'true' && process.env.VERCEL !== '1';

const optionalEntryPreloadFragments = [
  'EditorPage-',
  'OptimizationPage-',
  'Viewport3D-',
  'vendor-3d-',
  'vendor-react-three-',
  'vendor-three-',
  'vendor-postprocessing-',
  'vendor-camera-controls-',
  'vendor-gesture-',
  'vendor-maath-',
  'vendor-charts-',
  'vendor-collab-',
  'vendor-export-',
  'vendor-video-',
  'vendor-upload-',
  'vendor-calendar-',
  'vendor-forms-',
];

function filterEntryModulePreloads(dependencies: string[], hostType: 'html' | 'js') {
  if (hostType !== 'html') return dependencies;
  return dependencies.filter(
    (dependency) =>
      !optionalEntryPreloadFragments.some((fragment) => dependency.includes(fragment)),
  );
}

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  envDir: mode === 'e2e' ? path.resolve(__dirname, 'config/e2e-env') : undefined,
  define: {
    __VISH_QA_TOOLS_ENABLED__: JSON.stringify(
      // Never in production bundles: QA chrome (evidence pill, device HUD,
      // touch audit) is internal tooling. Dev serve + e2e modes only, with the
      // env escape hatch honoured everywhere except production builds.
      command === 'serve' ||
        mode.startsWith('e2e') ||
        (process.env.VITE_ENABLE_QA_TOOLS === 'true' && mode !== 'production'),
    ),
  },
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: 'named',
        namedExport: 'ReactComponent',
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,webmanifest}'],
        // Heavy media is loaded and bounded by runtime caches. Keeping it out of
        // precache avoids downloading route-optional 3D assets during PWA install.
        globIgnores: [
          '**/splash/**',
          '**/textures/**',
          '**/models/**',
          '**/hdri/**',
          '**/audio/**',
        ],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // R3.1: Cache mantra audio — 11 MB of MP3s were re-downloaded on every visit.
          // CacheFirst: serve from cache if available, only hit network for new/changed files.
          {
            urlPattern: /\/audio\/mantras\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mantra-audio',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // R3.2a: Cache 3D material textures — 35 MB of JPGs, previously re-downloaded
          // on every 3D session. After first load, served instantly from cache.
          {
            urlPattern: /\/textures\/.*\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'textures',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          // R3.2b: Cache 3D GLB models — 35 MB of models, previously re-downloaded
          // on every 3D session. After first load, served instantly from cache.
          {
            urlPattern: /\/models\/.*\.glb$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'models',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          // R3.2c: Cache HDRI environment maps used by the 3D viewport.
          {
            urlPattern: /\/hdri\/.*\.hdr$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'hdri',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Budget keeps the intentionally split Troika text chunk visible while catching new regressions.
    chunkSizeWarningLimit: 900,
    // Keep route-optional editor, 3D, collaboration, and analytics dependencies out
    // of the HTML entry preload graph. Vite still preloads them when their dynamic
    // route import actually executes.
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_url, dependencies, context) =>
        filterEntryModulePreloads(dependencies, context.hostType),
    },
    // Source maps may be generated only for controlled non-Vercel builds that
    // upload them privately before deployment. Public Vercel builds always disable them.
    sourcemap: buildSourceMaps ? 'hidden' : false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          const normalizedId = id.replace(/\\/g, '/');

          // Keep the 3D stack cacheable without shipping one >1 MB vendor blob.
          if (normalizedId.includes('/node_modules/@react-three/fiber/')) return 'vendor-react-three-fiber';
          if (normalizedId.includes('/node_modules/@react-three/drei/')) return 'vendor-react-three-drei';
          if (normalizedId.includes('/node_modules/three-stdlib/')) return 'vendor-three-stdlib';
          if (normalizedId.includes('/node_modules/postprocessing/')) return 'vendor-postprocessing';
          if (normalizedId.includes('/node_modules/three/')) return 'vendor-three-core';
          if (normalizedId.includes('/node_modules/@react-spring/')) return 'vendor-react-spring';
          if (normalizedId.includes('/node_modules/troika-three-text/')) return 'vendor-3d-text';
          if (normalizedId.includes('/node_modules/troika-three-utils/')) return 'vendor-3d-utils';
          if (normalizedId.includes('/node_modules/troika-worker-utils/')) return 'vendor-3d-worker';
          if (
            normalizedId.includes('/node_modules/bidi-js/') ||
            normalizedId.includes('/node_modules/webgl-sdf-generator/') ||
            normalizedId.includes('/node_modules/typr/')
          ) return 'vendor-3d-text-deps';
          if (normalizedId.includes('/node_modules/troika-')) return 'vendor-3d-text';
          if (normalizedId.includes('/node_modules/@use-gesture/')) return 'vendor-gesture';
          if (normalizedId.includes('/node_modules/camera-controls/')) return 'vendor-camera-controls';
          if (normalizedId.includes('/node_modules/maath/')) return 'vendor-maath';
          if (normalizedId.includes('/node_modules/zustand/')) return 'vendor-state';
          if (
            normalizedId.includes('/node_modules/meshline/') ||
            normalizedId.includes('/node_modules/stats-gl/') ||
            normalizedId.includes('/node_modules/suspend-react/') ||
            normalizedId.includes('/node_modules/its-fine/')
          ) return 'vendor-3d-helpers';

          // Split broad app helpers out of vendor-misc and keep React itself stable.
          if (normalizedId.includes('/node_modules/motion/')) return 'vendor-motion';
          if (normalizedId.includes('/node_modules/jszip/')) return 'vendor-export';
          if (normalizedId.includes('/node_modules/qrcode/')) return 'vendor-qrcode';
          if (normalizedId.includes('/node_modules/video-react/')) return 'vendor-video';
          if (normalizedId.includes('/node_modules/react-router/') || normalizedId.includes('/node_modules/react-router-dom/')) return 'vendor-router';
          if (normalizedId.includes('/node_modules/react-hook-form/') || normalizedId.includes('/node_modules/@hookform/')) return 'vendor-forms';
          if (normalizedId.includes('/node_modules/react-day-picker/')) return 'vendor-calendar';
          if (normalizedId.includes('/node_modules/react-dropzone/')) return 'vendor-upload';
          if (
            normalizedId.includes('/node_modules/embla-carousel-react/') ||
            normalizedId.includes('/node_modules/cmdk/') ||
            normalizedId.includes('/node_modules/vaul/') ||
            normalizedId.includes('/node_modules/input-otp/') ||
            normalizedId.includes('/node_modules/next-themes/')
          ) return 'vendor-ui-helpers';

          if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('sonner')) return 'vendor-ui';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/scheduler/')
          ) return 'vendor-react';
          // R1.4: Split vendor-misc into named chunks for better long-term cache efficiency.
          if (id.includes('yjs') || id.includes('y-websocket') || id.includes('y-protocols')) return 'vendor-collab';
          if (id.includes('@stripe') || id.includes('stripe')) return 'vendor-stripe';
          if (id.includes('zod') || id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance')) return 'vendor-utils';
          if (id.includes('@vercel/analytics') || id.includes('posthog') || id.includes('@sentry')) return 'vendor-analytics';
          // T3-3: recharts (+ d3 internals) only used in OptimizationPage — isolate it
          // so it doesn't inflate vendor-misc for users who never visit /optimization.
          if (id.includes('recharts') || id.includes('d3-scale') || id.includes('d3-shape') || id.includes('d3-color') || id.includes('d3-interpolate') || id.includes('d3-format') || id.includes('d3-time') || id.includes('victory-vendor')) return 'vendor-charts';
          return 'vendor-misc';
        },
      },
    },
  },
}));
