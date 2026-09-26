import { defineConfig } from 'vitest/config';
import { WA_COMPONENT_STUB_ALIAS } from './vitest.wa-stub-alias.js';

// Storybook-vitest integration lives in docs/vitest.storybook.config.ts.

export default defineConfig({
  resolve: {
    alias: [WA_COMPONENT_STUB_ALIAS],
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
        '**/*.test.ts',
        '**/*.d.ts',
      ],
    },
  },
});
