// Deployment refresh marker: 2026-07-25. No runtime behaviour change.
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
      globIgnores: ['**/splash/**'],
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
          {
            urlPattern: /\/audio\/mantras\/.*\.mp3$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mantra-audio',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\/textures\/.*\.(jpg|jpeg|png|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'textures',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            urlPattern: /\/models\/.*\.glb$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'models',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
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
  esbuild: {
    pure: ['console.log', 'console.debug', 'console.trace'],
  },
  build: {
    chunkSizeWarningLimit: 900,
    modulePreload: {
      polyfill: true,
      resolveDependencies: (_url, dependencies, context) =>
        filterEntryModulePreloads(dependencies, context.hostType),
    },
    sourcemap: buildSourceMaps ? 'hidden' : false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          const normalizedId = id.replace(/\\/g, '/');

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
          if (id.includes('yjs') || id.includes('y-websocket') || id.includes('y-protocols')) return 'vendor-collab';
          if (id.includes('@stripe') || id.includes('stripe')) return 'vendor-stripe';
          if (id.includes('zod') || id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance')) return 'vendor-utils';
          if (id.includes('@vercel/analytics') || id.includes('posthog') || id.includes('@sentry')) return 'vendor-analytics';
          if (id.includes('recharts') || id.includes('d3-scale') || id.includes('d3-shape') || id.includes('d3-color') || id.includes('d3-interpolate') || id.includes('d3-format') || id.includes('d3-time') || id.includes('victory-vendor')) return 'vendor-charts';
          return 'vendor-misc';
        },
      },
    },
  },
}));
