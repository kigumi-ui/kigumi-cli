---
'kigumi': minor
---

### Changed

- **Config schema is now strict (F-065/F-067).** `kigumiConfigSchema`, `themeConfigSchema`, and `webAwesomeConfigSchema` now reject unknown top-level keys instead of silently stripping them. Typos like `framwork: 'react'` or `theme: { secondaryColor }` raise `ConfigInvalidError` at every command boundary instead of being silently dropped while the default takes effect. `utilsDir` and `stylesDir` are now required schema fields (defaults still injected by `mergeWithDefaults`), eliminating 18 inline `|| 'src/lib'` fallbacks across 11 files that papered over the type lie from the previous `loadConfig` cast.
- **`loadConfig` returns raw on-disk data plus filepath (F-054).** Signature is now `loadConfig(cwd) → { config: unknown, filepath } | null`. The previous version cast the cosmiconfig payload to `KigumiConfig` even though it was unvalidated, crashing six commands with `TypeError` on malformed configs instead of a typed `ConfigInvalidError`. The new shape forces callers to validate (via `getConfig`) or unwrap explicitly. `loadConfig` also now passes `stopDir: cwd` to cosmiconfig so monorepo sub-packages without their own config no longer silently inherit a parent's (F-058).
- **`saveConfig` is a patch primitive (F-055/F-059).** New signature is `saveConfig(patch, cwd)`. The previous "load full config, mutate, save full config" flow re-injected every default field on every write — a user who deleted `webAwesome` from their config saw it grow back on the next `kigumi add`. The patch primitive merges only the keys the caller passes, with one-level spread for `theme` and `webAwesome`, and writes back to whichever filepath cosmiconfig discovered (so `.kigumirc`, `kigumi-components.json`, `package.json#kigumi`, etc. round-trip without a parallel `kigumi.config.json` being created). Eleven save-side call sites across the CLI updated to pass only the fields they touch.
- **`ConfigExistsCheck` recognises every supported config format (F-057).** The pre-flight check used to look only for `kigumi.config.json` while `loadConfig` searched six paths. It now delegates to `loadConfig`, so users with `.kigumirc`, `kigumi.json`, or `package.json#kigumi` no longer fail the gate when the rest of the CLI works fine.
- **`kigumi upgrade` prepends a remediation hint on typo configs.** When `getConfig` throws with `unrecognized_keys`, upgrade adds a one-line "kigumi upgrade does not auto-fix unrecognised config keys. Remove the keys listed below and re-run." warning before the formatted error so the fix path is visible without scanning the schema.

### Fixed

- Six commands (`upgrade`, `status`, `doctor`, `update`, `diff`, `theme show`) now produce `ConfigInvalidError` with formatted Zod issues instead of `TypeError` when the on-disk config is malformed.
- `kigumi add`, `kigumi theme set`, `kigumi palette`, `kigumi brand`, and the registry commands no longer regrow `utilsDir` / `stylesDir` / `webAwesome` keys a user has deliberately removed from their config.
- Running `kigumi add` from a monorepo workspace with no local config now fails with `Configuration file not found` (with a ready-to-run `kigumi init` suggestion) instead of silently mutating the repo-root config.

### Removed

- **`ConfigValidCheck` (F-056).** Always returned `passed: true` whenever a config object was attached — pure decoration, validating nothing. With `getConfig` now throwing `ConfigInvalidError` directly, the check class, its registration in nine commands, and its describe block in `tests/unit/config-checks.test.ts` are gone.

### Migration

- **Strict mode adoption may surface previously-silent typos.** If `kigumi status` (or any command) now reports `Unrecognized key(s): X`, that key was being dropped silently before; remove it (or fix the typo) to restore the prior behaviour. `kigumi upgrade` will not auto-fix these — by design.
- **Configs that explicitly omit `utilsDir` / `stylesDir` continue to work.** `mergeWithDefaults` still injects defaults from `DEFAULT_CONFIG` before strict validation runs, so on-disk configs only need framework, typescript, componentsDir, and theme to load successfully.
- **Pre-Cluster-B legacy keys are silently tolerated.** Configs initialised with kigumi <= 0.19.x carry `aliases` at the top level and may carry `webAwesome.cdnUrl`; both fields were removed in Cluster B and previously eaten by Zod's strip behaviour. With strict mode they would now fail validation. Instead, `mergeWithDefaults` strips `aliases` and `webAwesome.cdnUrl` before validation, so existing starter projects keep working without a manual edit. New typos still fail loudly.
