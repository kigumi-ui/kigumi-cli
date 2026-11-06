import path from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Rendering tests that must run in WebKit, where Safari's rendering differs from
 * Chromium's. `*.webkit.tsx` files are not picked up by `pnpm test`.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.webkit.tsx'],
    browser: {
      enabled: true,
      headless: true,
      viewport: { width: 800, height: 600 },
      provider: playwright({}),
      instances: [{ browser: 'webkit' }],
    },
  },
});
