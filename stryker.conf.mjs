/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  // pnpm's flat-plus-symlink layout means Stryker's auto-discovery (which
  // scans node_modules/.pnpm/@stryker-mutator+core/.../node_modules/@stryker-mutator)
  // misses sibling plugins. List the vitest runner plugin explicitly.
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: {
    configFile: 'vitest.unit.config.ts',
  },
  // V1 baseline scope: src/utils/tier.ts only. The wider scopes attempted
  // during V1 each hit a structural blocker (see PR-V1 description for the
  // investigation): the patched @stryker-mutator/vitest-runner@9.6.1 + vitest
  // 4.x combo hangs the perTest dry run regardless of scope, and the only
  // workable alternative (`coverageAnalysis: 'all'`) cannot use ignoreStatic
  // — kigumi's util modules carry enough module-level data (registry tables,
  // default-config constants) that static mutants then dominate the runtime.
  // tier.ts is small, behaviour-only, and verified at 89.13 % kill rate. The
  // mutate list widens in subsequent V cluster work as covering tests land
  // for additional files.
  mutate: ['src/utils/tier.ts'],
  // Sandbox excludes — none are needed to run the unit suite. `templates/`
  // IS kept (addCommand reads template files at runtime); vitest discovery
  // is scoped via `include: ['tests/unit/**/*.test.ts']` in
  // vitest.unit.config.ts so template-stub specs aren't picked up.
  ignorePatterns: [
    'docs',
    'starters',
    'tests/integration',
    'tests/e2e',
    'reports',
    '.stryker-tmp',
    'coverage',
    'coverage-merged',
  ],
  // 'perTest' is the spec preference but the runner's dry run hangs on this
  // codebase regardless of mutate scope (per-test instrumentation × ~1000-test
  // suite is too costly). 'all' is functionally equivalent for the mutation
  // score — it runs more tests per mutant, but the kill criterion is the same.
  // Tradeoff: ignoreStatic requires perTest, so it cannot be combined with
  // 'all'. The current narrow mutate scope keeps static-mutant count small.
  coverageAnalysis: 'all',
  thresholds: { high: 90, low: 80, break: 80 },
  // Concurrency tuned for 8-vCPU CI runners; local can override via CLI.
  concurrency: 4,
  reporters: ['html', 'progress', 'clear-text'],
  htmlReporter: { fileName: 'reports/mutation/mutation.html' },
  timeoutMS: 30000,
  // Default dryRunTimeoutMinutes (5) × 3 retries is too tight on cold-cache
  // first runs. Observed dry-run wall time at the current `tier.ts`-only
  // scope is ~45 s; 10 min gives ~13× headroom. When widening the mutate
  // list, sanity-check the dry-run wall time stays within ~1–2 min — a jump
  // toward this 10-min ceiling indicates a real upstream hang (the same
  // behaviour that ruled out `coverageAnalysis: 'perTest'` for V1) rather
  // than a legitimate suite slowdown.
  dryRunTimeoutMinutes: 10,
  // Stryker's mutators intentionally introduce type errors; type safety is
  // enforced separately by `pnpm type-check` + `pnpm check:tests` (Q1).
  disableTypeChecks: 'src/**/*.ts',
};
