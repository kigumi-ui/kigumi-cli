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
  // Pre-transform every story file the lane runs plus the storybook
  // plugin's internal setup-file.js. Without this, cold-cache CI runs
  // race the deps optimizer: the orchestrator requests setup-file.js
  // and story files before Vite has finished discovering and bundling
  // their deps, the optimizer rebundles mid-fetch, and the cached
  // "?v=<hash>" URLs 404 with "Vitest failed to find the runner".
  // server.warmup forces the dev server to fetch and pre-transform
  // these files before the iframe orchestrator boots.
  server: {
    warmup: {
      clientFiles: [
        './node_modules/@storybook/addon-vitest/dist/vitest-plugin/setup-file.js',
        './src/components/ui/index.ts',
        './src/stories/Button.stories.tsx',
        './src/stories/Carousel.stories.tsx',
        './src/stories/Checkbox.stories.tsx',
        './src/stories/Combobox.stories.tsx',
        './src/stories/CopyButton.stories.tsx',
        './src/stories/Details.stories.tsx',
        './src/stories/Dialog.stories.tsx',
        './src/stories/Drawer.stories.tsx',
        './src/stories/Dropdown.stories.tsx',
        './src/stories/Input.stories.tsx',
        './src/stories/NumberInput.stories.tsx',
        './src/stories/Popover.stories.tsx',
        './src/stories/Radio.stories.tsx',
        './src/stories/RadioGroup.stories.tsx',
        './src/stories/Rating.stories.tsx',
        './src/stories/Select.stories.tsx',
        './src/stories/Slider.stories.tsx',
        './src/stories/Switch.stories.tsx',
        './src/stories/TabGroup.stories.tsx',
        './src/stories/Textarea.stories.tsx',
        './src/stories/Tooltip.stories.tsx',
        './src/stories/Tree.stories.tsx',
      ],
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
