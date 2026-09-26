import { defineConfig } from 'vitest/config';
import { WA_COMPONENT_STUB_ALIAS } from './vitest.wa-stub-alias.js';
import { VUE_SFC_PLUGIN } from './vitest.vue-plugin.js';

export default defineConfig({
  plugins: [VUE_SFC_PLUGIN],
  resolve: {
    alias: [WA_COMPONENT_STUB_ALIAS],
  },
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    globals: true,
    setupFiles: ['tests/unit/_setup/fast-check.ts'],
    include: ['tests/unit/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/react*/**',
      '**/tests/test-*/**',
      '**/tests/integration/**',
      '**/tests/e2e/**',
      '**/tests/.tmp-*/**',
      '**/.claude/worktrees/**',
      '**/.stryker-tmp/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: [
        'src/**/*.ts',
        'scripts/generate-react-templates.ts',
        'scripts/generate-vue-templates.ts',
        'scripts/generate-angular-templates.ts',
        'scripts/post-changeset-version.ts',
      ],
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
        lines: 85,
        branches: 75,
        functions: 86,
        statements: 85,
      },
    },
  },
});
