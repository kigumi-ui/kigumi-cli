import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 60000,
    hookTimeout: 30000,
    globals: true,
    include: ['tests/integration/**/*.test.ts'],
  },
});
