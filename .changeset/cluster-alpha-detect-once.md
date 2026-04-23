---
'kigumi': patch
---

### Fixed

- **`detectPreviousTier` now matches `detectTier` on `devDependencies`.** The init command's tier-migration detection previously only scanned `packageJson.dependencies`, so projects that installed `@awesome.me/webawesome-pro` in `devDependencies` (e.g. component libraries building against Pro) were classified as previously Free and skipped tier migration entirely. Both dependency fields are now merged before the lookup, matching `detectTier`'s contract. (F-014)

### Changed

- **Tier and Next-project context are now detected once per command and threaded through downstream helpers.** Previously `detectTier` / `detectTierSync` was called 19 times across 13 files (including redundant calls inside `handleExistingConfig` and both `buildConfigNonInteractive` / `buildConfigInteractive`), and `isNextProject` / `detectNextRouter` were called once per component inside `generateComponent` and `regenerateKigumiSetup`. The init command now resolves tier in `validateAndPrepare` and passes it via `InitContext.initialTier` to `handleExistingConfig`, the config builders, and the post-build `newTier` derivation. The add and update commands resolve tier plus `isNext` / `nextRouter` once at the command entry and forward them through `ComponentInstaller` / `processComponent` into `generateComponent`. `generateComponent` and `regenerateKigumiSetup` keep their internal detection as a fallback for callers without command context (tests, framework plugins). `config-builder.ts` also switched from `detectTierSync` to `await detectTier` to stop blocking the event loop in already-async code. Net effect: `kigumi init` drops from 4 `detectTier` calls to 1, and `kigumi update` / `kigumi add --all` collapse per-component next-context probes from O(N × 10) to O(10). (F-012, F-015, F-016, F-039)
