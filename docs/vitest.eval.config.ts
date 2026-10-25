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
    // The key from the environment, else docs/.env, else the repository's
    // .env, as setup:npmrc reads them (both gitignored).
    env: {
      ...loadEnv('', '..', 'ANTHROPIC_API_KEY'),
      ...loadEnv('', '.', 'ANTHROPIC_API_KEY'),
    },
  },
});
