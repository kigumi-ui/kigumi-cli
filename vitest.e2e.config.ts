import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 300000,
    hookTimeout: 300000,
    globals: true,
    include: ['tests/e2e/**/*.test.ts'],
  },
});
