import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
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
        'src/lib/**',
        'src/bin.ts',
        'src/styles/**',
      ],
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 84,
        statements: 80,
      },
    },
  },
});
