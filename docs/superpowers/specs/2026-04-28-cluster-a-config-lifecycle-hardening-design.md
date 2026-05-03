# Cluster A: Config Lifecycle Hardening

**Status:** Draft
**Owner:** Mischa
**Created:** 2026-04-28
**Related backlog:** F-054, F-055, F-056, F-057, F-058, F-059, F-065, F-067 in `~/.claude/projects/kigumi-cli-overview.md`
**Blocks:** Future config-feature work; pairs naturally with F-132 (tests/-typecheck) but does not depend on it
**Branched from:** `origin/main` after PR #134 (Cluster B) merges

## Background

Cluster B (PR #134) cleaned up the schema's vestigial surface — `webAwesome.cdnUrl`, `validatePartialConfig`, `aliases`, the misleading "cached" JSDoc, and relocated `tierSchema`. With that gone, the actual lifecycle gaps in `src/utils/config.ts` are exposed:

- The type system claims `loadConfig` returns `KigumiConfig | null` but it returns raw `unknown` from cosmiconfig — a lie that crashes 6 commands with `TypeError` on malformed configs instead of `ConfigInvalidError`.
- `saveConfig` re-injects every default field on every write, silently undoing user deletions.
- `ConfigValidCheck` is theatre — it always returns `passed: true` regardless of config validity.
- `ConfigExistsCheck` only checks `kigumi.config.json`, but `loadConfig` searches 6 paths.
- cosmiconfig walks ancestors by default, creating monorepo split-brain configs.
- `saveConfig` always writes `kigumi.config.json` regardless of which file `loadConfig` discovered.
- `kigumiConfigSchema` silently strips typos like `framwork` instead of erroring.
- 18 inline `|| 'src/lib'` fallbacks across 11 files paper over the type lie.

These eight findings share `src/utils/config.ts`, `src/schemas/config.ts`, and `src/checks/config-checks.ts`. Splitting touches the same files 4–5 times. One atomic PR.

## Problem

### F-054 (keystone): `loadConfig` is unvalidated

```ts
// src/utils/config.ts
export function loadConfig(cwd: string = process.cwd()): KigumiConfig | null {
  const explorer = cosmiconfigSync('kigumi', { searchPlaces: [...] });
  const result = explorer.search(cwd);
  return result?.config ?? null;  // <-- raw unknown, typed as KigumiConfig
}
```

7 callers trust the type and access nested fields directly:

| Command             | Behavior on malformed config                          |
| ------------------- | ----------------------------------------------------- |
| `diff.ts:70`        | `config.componentsDir` undefined → `path.join` throws |
| `doctor.ts:355`     | reads `config.theme.selected` → `TypeError`           |
| `status.ts:136`     | `config.theme.selected` access → crash                |
| `upgrade.ts:44`     | `config.kigumiVersion` access → silent `undefined`    |
| `update.ts:70`      | reads installed components map → cascading nulls      |
| `theme/show.ts:21`  | `config.theme.selected` → crash                       |
| `init/index.ts:275` | already runs `safeParse` (F-037 / PR #117) — exempt   |

Only `init` validates explicitly. The others crash the user with stack traces instead of friendly errors.

### F-055: `saveConfig` re-injects defaults

```ts
const config = getConfig(cwd);              // merged with DEFAULT_CONFIG
config.installedComponents['button'] = {...}; // user touches one field
await saveConfig(config, cwd);              // writes ENTIRE merged object
```

Net effect: a user who manually deletes `webAwesome.version` from their config gets it silently re-injected after the next `kigumi add`. A fresh config bloats from 5 fields to 12+ fields after one mutation. There is no way to persistently remove a default-keyed field.

### F-056 + F-057: pre-flight checks lie

`ConfigValidCheck.run()` body:

```ts
// Configuration validation will be done when loading
// This check just verifies it was loaded successfully
return { passed: true, severity: INFO, message: 'Configuration is valid' };
```

It never validates anything. Wired into 9 commands. Pure decoration.

`ConfigExistsCheck` does `fs.pathExists(path.join(cwd, 'kigumi.config.json'))` — but cosmiconfig searches `kigumi.config.json`, `kigumi-components.json`, `kigumi.json`, `.kigumirc`, `.kigumirc.json`, `package.json#kigumi`. A user with a valid `.kigumirc` can run `kigumi status` (uses `loadConfig` directly — works) but not `kigumi add` (gated by the check — fails with "Configuration file not found").

### F-058: cosmiconfig walks ancestors

`cosmiconfigSync('kigumi', { searchPlaces: [...] })` has no `stopDir`. In a monorepo:

```
/repo/kigumi.config.json          <- root config (framework: react)
/repo/packages/foo/                <- workspace, no config
```

Running `kigumi add button` from `packages/foo/` loads the root config, mutates it, then `saveConfig` writes a new `packages/foo/kigumi.config.json` with the root's values. Two divergent configs, silent split-brain.

### F-059: `saveConfig` hardcodes filename

`cosmiconfig`'s `result.filepath` is available but discarded. Users with `kigumi-components.json` (legacy), `.kigumirc`, `.kigumirc.json`, or `package.json#kigumi` get a brand-new `kigumi.config.json` on first mutation. The original file becomes orphan dead data.

### F-065: 18 inline fallbacks

```
src/utils/regenerate.ts:70          config.stylesDir || 'src/styles'
src/commands/doctor.ts:222          config.stylesDir || 'src/styles'
src/commands/brand.ts:103           config.utilsDir  || 'src/lib'
src/commands/palette.ts:98          config.utilsDir  || 'src/lib'
src/commands/theme.ts:103           config.utilsDir  || 'src/lib'
src/commands/init/migration.ts:48–49,105
src/commands/init/index.ts:583–584,680,682
src/commands/init/file-generator.ts:59–61,229
src/commands/theme/set.ts:81
src/commands/theme/install.ts:110,135
```

Every site duplicates the schema's `DEFAULT_CONFIG`. Drift hazard whenever defaults change. All become dead once F-054 lands and `loadConfig` returns validated, defaulted data.

### F-067: silent typo strip

`kigumiConfigSchema = z.object({...})` — Zod default strips unknown keys. A user typing `framwork: 'vue'` (dropped `e`) loses the key on `getConfig` and silently gets `framework: 'react'` from the default. Tested explicitly at `tests/unit/config.test.ts:438-468`. The test documents the wrong behavior.

## Scope

### In scope

- Rewrite `src/utils/config.ts` (~80 lines): typed `loadConfig` return shape, patch-style `saveConfig`, validation hook at `getConfig`.
- Add `.strict()` to `kigumiConfigSchema`.
- Pass `stopDir: cwd` to `cosmiconfigSync`.
- Migrate 7 `loadConfig` callers (5 to `getConfig`, 1 to explicit `validateConfig`, init exempt).
- Migrate 12 `saveConfig` call sites in 11 files to pass only the fields they're touching.
- Delete `ConfigValidCheck` and its 9 registrations + import lines.
- Refactor `ConfigExistsCheck` to delegate to `loadConfig` (so all 6 search places count as "exists").
- Remove 18 `|| 'src/lib'` / `|| 'src/styles'` / `|| 'src/components/ui'` fallback strings.
- Test surface: lifecycle integration test (load → mutate → save → reload), strict-mode unit tests, monorepo stopDir test, legacy-filename round-trip test, ConfigExistsCheck multi-format coverage.
- AGENTS.md updates: `src/AGENTS.md` (config module section), root AGENTS.md (commands section if needed).
- Changeset: `.changeset/cluster-a-config-lifecycle-hardening.md` (Keep-a-Changelog format, `patch`).

### Out of scope

- F-062 (config error classes never thrown — Cluster C's job).
- F-132 (tests/-typecheck) — pairs naturally but is its own cluster.
- Removing `package.json#kigumi` or other legacy formats from `searchPlaces`. Save-back works at all 6 paths after F-059. Deprecation is a separate decision.
- Auto-migration of legacy filenames to `kigumi.config.json`. User-initiated only.
- Caching. F-033's one-call-per-command invariant makes runtime memoization unnecessary.
- Adding new config fields. Surface changes only.

## Design

### `loadConfig` — typed return shape

```ts
// src/utils/config.ts

export interface LoadedConfig {
  /** The raw, unvalidated user config from disk. */
  config: unknown;
  /** Absolute path to the discovered config file. */
  filepath: string;
}

export function loadConfig(cwd: string = process.cwd()): LoadedConfig | null {
  const explorer = cosmiconfigSync('kigumi', {
    searchPlaces: [
      'kigumi.config.json',
      'kigumi-components.json',
      'kigumi.json',
      '.kigumirc',
      '.kigumirc.json',
      'package.json',
    ],
    stopDir: cwd, // F-058: pin to cwd, no ancestor walk
  });

  const result = explorer.search(cwd);
  if (!result) return null;
  return { config: result.config, filepath: result.filepath };
}
```

Key change: return type is `LoadedConfig | null` (raw `unknown` plus filepath), forcing callers to validate explicitly or migrate to `getConfig`.

### `getConfig` — validates and merges

```ts
export function getConfig(cwd: string = process.cwd()): KigumiConfig {
  const loaded = loadConfig(cwd);
  if (!loaded) {
    throw new ConfigNotFoundError(cwd);
  }
  // mergeWithDefaults runs kigumiConfigSchema.parse() — throws ConfigInvalidError on bad data
  return mergeWithDefaults(loaded.config as Partial<KigumiConfig>);
}
```

The `as Partial<KigumiConfig>` cast is intentional: `mergeWithDefaults` immediately runs Zod parse against the input, so the cast is documentation-only. Once `.strict()` lands (F-067), the parse rejects unknown keys instead of stripping them.

> **Implementation deviation (recorded during execution):** an earlier draft of this section had `getConfig` return `DEFAULT_CONFIG` silently when no config file was found. That was wrong: every load-side caller (`status`, `upgrade`, `diff`, `update`, `theme show`) previously threw `ConfigNotFoundError` manually after a null check, so a silent default would have been a behaviour regression. The shipped implementation throws `ConfigNotFoundError`, which preserves the prior contract. `doctor` is the only caller that wants the not-found case to be non-fatal, and it wraps the call in try/catch to surface a friendly warning.

### `saveConfig` — patch primitive

```ts
export async function saveConfig(
  patch: Partial<KigumiConfig>,
  cwd: string = process.cwd()
): Promise<void> {
  const loaded = loadConfig(cwd);
  const filepath = loaded?.filepath ?? path.join(cwd, 'kigumi.config.json');
  const onDisk = (loaded?.config as Record<string, unknown>) ?? {};

  // Shallow merge: caller-supplied keys win at top level.
  // Nested objects (theme, webAwesome) are spread one level deep
  // to preserve user-set sibling fields the patch doesn't touch.
  const next = mergePatch(onDisk, patch);

  if (path.basename(filepath) === 'package.json') {
    await writePackageJsonKey(filepath, 'kigumi', next);
  } else {
    await fs.writeJson(filepath, next, { spaces: 2 });
  }
}
```

Two helpers:

- `mergePatch(onDisk, patch)`: top-level keys from `patch` override `onDisk`; for `theme` and `webAwesome` (the only nested objects in `kigumiConfigSchema`), it does one level of spread so a `{theme: {selected: 'awesome'}}` patch doesn't drop user-set `theme.brandColor`.
- `writePackageJsonKey(filepath, key, value)`: reads `package.json`, sets `pkg[key] = value`, writes back with preserved formatting (use `fs.readJson` + `fs.writeJson`; `package.json` formatting doesn't need to be preserved beyond JSON).

### Caller migration: load-side (7 sites)

Five callers want defaults applied — migrate to `getConfig`:

```ts
// before
const config = loadConfig(cwd);
if (!config) {
  /* error */
}

// after
const config = getConfig(cwd); // throws ConfigInvalidError on malformed data
```

Sites: `diff.ts`, `doctor.ts`, `status.ts`, `upgrade.ts`, `theme/show.ts`.

One caller wants raw user-supplied fields — `update.ts:70`. Migrate to explicit validation:

```ts
const loaded = loadConfig(cwd);
if (!loaded) {
  /* error */
}
const config = validateConfig(loaded.config); // throws on malformed
```

`init/index.ts:275` is exempt — F-037 already wraps with `safeParse`. Update only the unwrapping (`loaded.config`).

### Caller migration: save-side (12 sites in 11 files)

Each call site passes only the fields it's mutating:

| File                        | Line     | Patch payload                                                                                                                                   |
| --------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `add/index.ts`              | 236, 298 | `{ installedComponents }` (+ `kigumiVersion` on first add)                                                                                      |
| `palette.ts`                | 96       | `{ theme: { palette } }`                                                                                                                        |
| `brand.ts`                  | 101      | `{ theme: { brandColor } }`                                                                                                                     |
| `theme.ts`                  | 101      | `{ theme: { selected } }`                                                                                                                       |
| `theme/install.ts`          | 132      | `{ theme: { selected }, installedThemes }`                                                                                                      |
| `theme/set.ts`              | 77       | `{ theme: { selected } }`                                                                                                                       |
| `registry/add-source.ts`    | 121      | `{ registries }`                                                                                                                                |
| `registry/remove-source.ts` | 88       | `{ registries }`                                                                                                                                |
| `upgrade.ts`                | 68, 165  | `{ installedComponents, kigumiVersion }`                                                                                                        |
| `init/index.ts`             | 448      | full config object — init owns the initial shape, write directly via `fs.writeJson` (or pass full merged config to a `saveConfig({ ...full })`) |

Init's case: it's establishing the initial config shape from scratch. Two options: (a) bypass `saveConfig` entirely and write `fs.writeJson(path.join(cwd, 'kigumi.config.json'), config, { spaces: 2 })` directly; (b) call `saveConfig(config)` with the full object and accept the round-trip-read of an empty file. Pick (a) — init's invariant ("create new file at known location") doesn't fit the patch primitive's mental model.

### `.strict()` + test inversion

```ts
// src/schemas/config.ts
export const kigumiConfigSchema = z
  .object({
    framework: frameworkSchema,
    // ...
  })
  .strict();
```

`tests/unit/config.test.ts:438-468` currently asserts that unknown keys are stripped. Invert the test: now it asserts a `ConfigInvalidError` with `unrecognized_keys` in the message. Add a positive case for typos: `{ ...validConfig, framwork: 'vue' }` → error mentions `framwork`.

> **Backward-compat addition (recorded during execution):** the spec did not anticipate that real-world projects initialised by kigumi <= 0.19.x carry `aliases` at the top level, and may carry `webAwesome.cdnUrl`. Both fields were removed in Cluster B and previously eaten silently by Zod's strip behaviour; with `.strict()` they would now be hard-rejected, breaking every existing starter. The shipped implementation strips a small allow-list of legacy keys (`LEGACY_TOP_LEVEL_KEYS = ['aliases']`, `LEGACY_WEB_AWESOME_KEYS = ['cdnUrl']`) inside `mergeWithDefaults` before strict validation runs. New typos (`framwork`) still fail loudly. The list is documented in the changeset under Migration. Add a key to that list only when removing a previously-supported field; never to suppress a typo.

### `ConfigValidCheck` deletion

Delete the class from `src/checks/config-checks.ts` and the export from `src/checks/index.ts`. Remove imports + `.add(new ConfigValidCheck())` lines from 9 commands:

```
add, brand, palette, theme, theme/set, theme/install,
registry/add-source, registry/list-sources, registry/remove-source
```

`getConfig` already throws `ConfigInvalidError` before the check pipeline even runs, so behavior is preserved.

### `ConfigExistsCheck` refactor

Replace the existence test with a `loadConfig` call:

```ts
async run(context: CheckContext): Promise<CheckResult> {
  const loaded = loadConfig(context.cwd);
  if (!loaded) {
    return {
      passed: false,
      severity: CheckSeverity.ERROR,
      message: 'Configuration file not found',
      suggestion: ['Run: kigumi init', 'This will create kigumi.config.json'],
      details: { searched: ['kigumi.config.json', 'kigumi-components.json', /* ... */] },
    };
  }
  return { passed: true, severity: CheckSeverity.INFO, message: `Configuration loaded from ${path.basename(loaded.filepath)}` };
}
```

Now legacy formats count as "exists" and the message tells the user which file was found.

### F-065 fallback removal

`rg "\|\| '(src/lib|src/styles|src/components/ui)'" src/` enumerates the 18 sites. Each becomes a direct field access:

```ts
// before
const utilsDir = config.utilsDir || 'src/lib';

// after
const utilsDir = config.utilsDir;
```

Once `getConfig` returns validated, defaulted data (post-F-054), `config.utilsDir` is guaranteed populated. The 18 fallbacks are dead code.

Spot-check: `init/file-generator.ts:59-61` reads from a freshly-built config that may not have run through `mergeWithDefaults` yet — confirm it does (it's called after `buildConfig` which is responsible for defaults), or move the defaulting earlier.

## Verification

### Unit tests

- `tests/unit/config.test.ts`:
  - **F-054**: `loadConfig(cwd)` returns `{ config: unknown, filepath: string }` shape; raw unvalidated config preserved.
  - **F-054**: `getConfig` with malformed input (`{}`, `{ framework: 'invalid' }`) throws `ConfigInvalidError`.
  - **F-055**: round-trip — write minimal config, run `saveConfig({ installedComponents: {...} })`, re-read → other fields not bloated.
  - **F-055**: round-trip — user deletes `webAwesome.version`, runs save with unrelated patch, re-read → `webAwesome.version` still absent.
  - **F-058**: `cwd = packages/foo/`, root has `kigumi.config.json`, `packages/foo/` has none → `loadConfig` returns `null`.
  - **F-059**: write `kigumi-components.json`, call `saveConfig({...})`, assert `kigumi-components.json` updated, no `kigumi.config.json` created.
  - **F-059**: `package.json#kigumi` round-trip.
  - **F-067**: invert the existing "unknown properties stripped" test — now expects `ConfigInvalidError` with `unrecognized_keys`.
  - **F-067**: positive typo case (`framwork`).
- `tests/unit/checks/config-checks.test.ts`:
  - Delete `ConfigValidCheck` tests.
  - Add coverage for `ConfigExistsCheck` recognizing all 6 search formats.

### Integration tests

- `tests/integration/init.test.ts`: confirm `kigumi init` followed by `kigumi add button` produces a config with exactly the fields init wrote + the two new ones (`installedComponents`, `kigumiVersion`). Today it would have 12+ fields after the same flow.
- New: `tests/integration/config-lifecycle.test.ts` — end-to-end load/mutate/save/reload across all 6 search formats.

### Smoke tests

- Fresh project: `kigumi init --yes && kigumi add button` → `kigumi.config.json` has 5 fields + 2 (`installedComponents`, `kigumiVersion`), not 14.
- Legacy project: rename `kigumi.config.json` to `kigumi-components.json`, run `kigumi add button` → `kigumi-components.json` updated, no new file created.
- Monorepo: `/tmp/mono/kigumi.config.json` + `/tmp/mono/packages/foo/package.json` (no kigumi config). `kigumi add button` from `packages/foo/` → fails with "Configuration file not found", not silent root-config inheritance.
- Typo: write a config with `framwork: 'react'` → `kigumi status` errors with `Unrecognized key(s): framwork`.

### Validation loop (CLAUDE.md)

```bash
pnpm type-check     # root + templates + docs
pnpm lint
pnpm test           # unit + integration
pnpm validate:registry
pnpm validate:templates
```

CI matrix (React 18 + 19, Vue, Angular, Visual Regression) must stay green.

## Risks & Mitigations

| Risk                                                                                                                  | Mitigation                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward-compat configs from a future kigumi fail hard on older CLIs (F-067 strict-mode side effect).                  | F-032's major-version-compat check refuses to run with a major-version mismatch — strict-mode failures only matter within a major version. Acceptable.                                                                                                                    |
| 12 save-side call sites' new patch shape introduces field-list bugs (caller forgets to include a field they mutated). | Mitigated by lifecycle integration tests. Per-caller unit assertions on patch payload shape catch regressions.                                                                                                                                                            |
| `package.json#kigumi` save-back loses formatting/indentation (Prettier conventions).                                  | `fs.writeJson(filepath, next, { spaces: 2 })` matches Node ecosystem default. If users care about custom formatting, a follow-up F-ID can add `prettier` integration. Out of scope for now.                                                                               |
| F-058 `stopDir: cwd` regresses any legitimate ancestor-walk use case.                                                 | Audit: no documented use case in `docs/`. The walk was an unintentional cosmiconfig default, not a designed feature. If a user needs it, they can run kigumi from the root.                                                                                               |
| `ConfigExistsCheck` refactor doubles cosmiconfig invocations (check + downstream `getConfig`).                        | F-033's one-call-per-command invariant is preserved at the command level; the check is part of the same single-call sequence. Two `loadConfig` calls per command is acceptable; can be optimized later by threading the discovered `LoadedConfig` through `CheckContext`. |
| Init writes full config bypassing `saveConfig` — divergent codepaths.                                                 | Documented: init's invariant ("create new file") differs from the patch primitive ("modify existing file"). Acceptable; a single comment in `init/index.ts:448` explains.                                                                                                 |

## Implementation Phases

All phases ship in one PR. Phasing here is execution order, not separate commits (though commits should follow this order for reviewability).

### Phase 1: Schema + loader foundation

**Files:** `src/schemas/config.ts`, `src/utils/config.ts`

- Add `.strict()` to `kigumiConfigSchema`.
- Rewrite `loadConfig` return type to `LoadedConfig | null`; add `stopDir`.
- Rewrite `getConfig` to unwrap `LoadedConfig`.
- Add `mergePatch` helper + `writePackageJsonKey` helper.
- Rewrite `saveConfig` to patch shape.
- Update `src/utils/config.ts` JSDoc.

**Validation:** `pnpm type-check` fails on every caller — that's expected, drives Phase 2.

### Phase 2: Load-side caller migration

**Files:** `src/commands/{diff,doctor,status,upgrade,update}.ts`, `src/commands/theme/show.ts`, `src/commands/init/index.ts:275`

- 5 to `getConfig`, 1 to `validateConfig(loadConfig(...))`, 1 init unwrap.
- Type-check should pass for these files after each migration.

### Phase 3: Save-side caller migration

**Files:** `src/commands/{add/index,palette,brand,theme,upgrade}.ts`, `src/commands/theme/{install,set}.ts`, `src/commands/registry/{add-source,remove-source}.ts`, `src/commands/init/index.ts:448`

- 12 sites → patch payload shape per the table above.
- Init bypasses `saveConfig` — direct `fs.writeJson`.

### Phase 4: Cleanup

**Files:** `src/checks/config-checks.ts`, `src/checks/index.ts`, 9 command files for `ConfigValidCheck` registrations, 11 files × 18 sites for fallback removal

- Delete `ConfigValidCheck` + 9 registrations + import lines.
- Refactor `ConfigExistsCheck` to use `loadConfig`.
- Remove 18 `|| 'src/lib'` fallbacks.

### Phase 5: Tests

**Files:** `tests/unit/config.test.ts`, `tests/unit/checks/config-checks.test.ts`, `tests/integration/init.test.ts`, **NEW** `tests/integration/config-lifecycle.test.ts`

- Invert F-067 strip-test.
- Add F-054/055/058/059 round-trip coverage.
- Delete F-056 `ConfigValidCheck` tests.
- New end-to-end lifecycle integration.

### Phase 6: Docs + changeset

**Files:** `src/AGENTS.md` (config module section), `AGENTS.md` (commands section if `ConfigValidCheck` is referenced), `.changeset/cluster-a-config-lifecycle-hardening.md`

- Changeset: Keep-a-Changelog format, `patch` (behavior changes are bug fixes for crash-on-malformed and silent-default-injection — not breaking from a user's correct-config standpoint).
- AGENTS.md: document the load-validate-save lifecycle invariant; update last-updated date.
- Update memory file `~/.claude/projects/kigumi-cli-overview.md`: mark F-054/055/056/057/058/059/065/067 as DONE with PR number.

## Acceptance Criteria

- [ ] `loadConfig` returns `LoadedConfig | null` (raw + filepath); 0 callers access `.config.X` directly without validating first.
- [ ] `getConfig` throws `ConfigInvalidError` on `{ framework: 'invalid' }`, not `TypeError`.
- [ ] After `kigumi init && kigumi add button`, `kigumi.config.json` has at most 7 top-level fields (5 init-written + `installedComponents` + `kigumiVersion`), not 12+.
- [ ] User deletes `webAwesome.version` from config, runs unrelated `kigumi add` → field stays deleted.
- [ ] `cwd = packages/foo/` with root-only config → `loadConfig` returns `null`.
- [ ] Save-back to `kigumi-components.json`, `.kigumirc`, `.kigumirc.json`, `kigumi.json`, `package.json#kigumi` works without creating a parallel `kigumi.config.json`.
- [ ] `kigumi add` succeeds with valid config at any of the 6 search paths (not just `kigumi.config.json`).
- [ ] Config with `framwork: 'react'` typo → `ConfigInvalidError` mentioning `framwork`.
- [ ] `rg "\|\| 'src/" src/` returns 0 results.
- [ ] `rg "ConfigValidCheck" src/` returns 0 results.
- [ ] Full validation loop (type-check, lint, test, validate:registry, validate:templates) green.
- [ ] CI matrix green.

## Open Questions

- ❓ Should `ConfigExistsCheck` be deleted entirely instead of refactored? Every downstream `getConfig` already throws `ConfigNotFoundError` on missing config. The check is duplication. **Decision pending**: keep refactored version for now (gives users a friendlier pre-flight message than a thrown error), revisit during implementation if it adds noise.
- ❓ Should `package.json#kigumi` save-back preserve sibling key ordering and prettier formatting? **Decision pending**: ship `fs.writeJson` defaults; add formatting preservation only if a user reports it.
- ❓ Does `init/file-generator.ts:59-61` need defensive defaulting after F-054? It reads from a config built by `config-builder.ts` which may pre-default. Verify during Phase 4.
- ❓ Should there be a one-time migration helper (`kigumi migrate-config`) for users to rename `kigumi-components.json` → `kigumi.config.json`? **Decision**: out of scope. Round-trip works without renaming; users can rename when they want.

## Pairs With

- **F-132** (tests/-typecheck) — once tests are type-checked, the F-055/F-067 test fixtures get type-system enforcement. Land separately, no ordering dependency, but landing both within the same hardening window prevents test-fixture rot.
