import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          storybookTest({
            // Dedicated test-only Storybook config. See
            // .storybook-test/main.ts for the rationale: narrow stories
            // glob, no @storybook/addon-docs (the dev preview's
            // DocsContainer import would otherwise trigger a Vite deps
            // optimizer cache race in headless CI).
            configDir: path.join(dirname, '.storybook-test'),
            tags: { include: ['interaction'] },
          }),
        ],
        test: {
          name: 'storybook',
          retry: 2,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook-test/vitest.setup.ts'],
        },
      },
    ],
  },
});
