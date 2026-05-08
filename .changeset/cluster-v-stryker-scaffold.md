---
'kigumi': patch
---

### Changed

- **Test infrastructure: mutation testing scaffold (cluster V, PR-V1).** Adds [StrykerJS](https://stryker-mutator.io/) with an 80% break threshold and a weekly `mutation.yml` workflow (Sundays 02:00 UTC + manual dispatch). Run locally with `pnpm test:mutation`. Mutation reports land at `reports/mutation/mutation.html` (gitignored); CI uploads them as a 30-day artifact. The mutate scope is `src/utils/tier.ts` only for the V1 baseline (verified at 89.13% kill rate). Two upstream blockers ruled out wider scopes: `@stryker-mutator/vitest-runner@9.6.1` + vitest 4.x hangs the dry run with `coverageAnalysis: 'perTest'`, and the workable fallback `coverageAnalysis: 'all'` is incompatible with `ignoreStatic`, so kigumi util modules with module-level data (registry tables, default-config constants) explode the runtime when scope widens beyond ~5 files. Subsequent V cluster work or follow-ups widen the mutate scope as covering tests land for additional files (per the V spec at line 246, which permits per-file/subdir splits). No user-visible CLI behaviour changes; the only runtime touch is `vitest.unit.config.ts` gaining an explicit `include: ['tests/unit/**/*.test.ts']` (matching the previously-existing line in `vitest.config.ts`) so Stryker's vitest-runner doesn't pick up template stub specs that import `.vue`.
