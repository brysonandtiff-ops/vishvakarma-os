import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    fileParallelism: false,
    pool: 'threads',
    maxWorkers: 1,
    testTimeout: 30000,
    hookTimeout: 30000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'vishvakarma-os/**',
      'e2e/**',
      '**/*.e2e.*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 40,
        statements: 50,
      },
      exclude: [
        'node_modules/',
        'src/test/',
        'e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'dist/',
        // Route shells and thin UI glue — covered by Playwright E2E and route smoke gates.
        'src/pages/**',
        'src/hooks/**',
        'src/components/**',
        'src/db/**',
        'src/styles/**',
        'src/core/exporters/pdfExport.ts',
        'src/core/exporters/pngExport.ts',
        'src/utils/projectThumbnail.ts',
        'src/backend/firebase/storageUpload.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('test'),
  },
});
