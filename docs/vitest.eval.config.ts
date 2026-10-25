import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

// The Theme Agent prompt eval (`pnpm eval:theme-agent`): the real model, so
// API tokens. Kept apart from `pnpm test`, whose default include never
// matches *.eval.ts.
export default defineConfig({
  test: {
    include: ['eval/**/*.eval.ts'],
    reporters: ['verbose'],
    // An answer takes several model steps.
    testTimeout: 180_000,
    // The key from the environment, or from docs/.env (gitignored); the
    // environment wins.
    env: loadEnv('', process.cwd(), 'ANTHROPIC_API_KEY'),
  },
});
