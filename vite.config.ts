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
      injectRegister: 'auto',
      includeAssets: ['icons/**/*', 'brand/**/*', 'manifest.webmanifest'],
      manifest: false,
      workbox: {
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
          if (id.includes('three') || id.includes('@react-three')) return 'vendor-3d';
          if (id.includes('@radix-ui') || id.includes('lucide-react') || id.includes('sonner')) return 'vendor-ui';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
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
