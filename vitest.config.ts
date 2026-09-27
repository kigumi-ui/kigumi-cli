import { defineConfig } from 'vitest/config';
import { WA_COMPONENT_STUB_ALIAS } from './vitest.wa-stub-alias.js';
import { VUE_SFC_PLUGIN } from './vitest.vue-plugin.js';

// Storybook-vitest integration lives in docs/vitest.storybook.config.ts.

export default defineConfig({
  plugins: [VUE_SFC_PLUGIN],
  resolve: {
    alias: [WA_COMPONENT_STUB_ALIAS],
    // One React for every importer. The docs-site wrappers under docs/ would
    // otherwise resolve docs/node_modules/react wherever docs dependencies
    // are installed, and its hooks fail under the root react-dom.
    dedupe: ['react', 'react-dom'],
  },
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/templates/**',
      '**/docs/**',
      '**/tests/react*/**',
      '**/tests/test-*/**',
      '**/tests/integration/**',
      '**/tests/e2e/**',
      '**/tests/.tmp-*/**',
      '**/.claude/worktrees/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        // The docs-site wrappers are imported by one unit test, but they are
        // not CLI source and must not count toward the CLI's thresholds.
        'docs/**',
        '**/*.test.ts',
        '**/*.d.ts',
      ],
    },
  },
});
