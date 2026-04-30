import { defineConfig } from 'vitest/config';

// Root vitest config used by `pnpm test:all` (`vitest run`).
//
// The CLI repo previously hosted a storybook test project here, but the
// storybook deps (@storybook/addon-vitest, @vitest/browser-playwright,
// playwright) live in docs/package.json — the integration could never run
// from root. Per-framework storybooks (react / vue / angular) are the
// long-term shape; vitest-storybook plumbing belongs to whichever cluster
// stands up that integration (Cluster U or a dedicated initiative). For
// now, root vitest only runs the unit + integration + e2e suites via
// their dedicated configs.

export default defineConfig({
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
