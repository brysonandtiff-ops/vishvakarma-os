import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  envDir: mode === 'e2e' ? path.resolve(__dirname, 'config/e2e-env') : undefined,
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
      includeAssets: ['icons/**/*', 'brand/**/*', 'manifest.webmanifest'],
      manifest: false,
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB — allows large WebP normal maps
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,webmanifest}'],
        // iOS apple-touch-startup-image set is large and only used by the OS at
        // launch — keep it out of the precache manifest (served on-demand like the
        // other heavy media) so it never bloats the PWA install.
        globIgnores: ['**/splash/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
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
    chunkSizeWarningLimit: 700,
    // T3-5: Enable module preload injection so Vite adds <link rel="modulepreload">
    // hints for all lazy chunks in the built index.html, allowing the browser to
    // fetch the editor surface in parallel during auth page idle time.
    modulePreload: { polyfill: true },
    // 'hidden' emits source maps for error monitoring (Sentry) without referencing
    // them from the shipped bundles, so prod stack traces stay readable but source
    // is not exposed to end users.
    sourcemap: 'hidden',
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
          // Each group changes at a different rate, so they can be cached independently.
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
