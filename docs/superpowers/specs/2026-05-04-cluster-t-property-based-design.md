# Cluster T: Property-Based + Edge Cases - Specification

> Add a property-based suite (`fast-check`) over the strict config schemas, a corrupt-config edge-case suite, concurrency + failure-mode pins around `loadConfig` / `saveConfig`, and a negative-path inventory in `tests/AGENTS.md`. Closes the last initiative-level acceptance criteria for `test-infrastructure-hardening`.

**Type:** Build/Infra
**Status:** Draft
**Author:** Mischa
**Date:** 2026-05-04
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** F-X6, F-X7, F-X8, F-X9 (NEW)
**Depends on:** Q1 (shipped, PR #137) - `pnpm check:tests` keeps the new tests type-safe; Cluster A (shipped 2026-05-03 as `b1bf2c0d`) - `.strict()` is the lever the property tests pull on.
**Blocks:** v0.20.0 release (initiative acceptance criterion #11 + #12).
**Branched from:** `origin/main` at `ba5cbe2a` (post Cluster A, S, and PR #153 merges).
**No file overlap with:** Cluster S (S touched the same testing helpers but lands first; T only adds `tests/unit/_setup/` and `tests/unit/schemas/` plus two new top-level test files).

## Overview

The initiative's safety net has three remaining gaps:

1. **No property-based coverage.** The strict config schemas (`kigumiConfigSchema`, `themeConfigSchema`, `webAwesomeConfigSchema`) are exercised by ~16 example-based tests in `tests/unit/config-schema.test.ts`. They cover the obvious cases - typo defense, empty strings, type mismatches - but a generator-driven assertion is more powerful for the rejection path: `forall valid input + arbitrary unknown key, .safeParse rejects with code 'unrecognized_keys'`. Without `.strict()` (Cluster A) that property would not exist.
2. **No corrupt-input regression guard.** `tests/unit/config.test.ts:394-425` covers empty config, malformed JSON, and unknown-keys-preserved-at-load. It does not cover BOM, trailing comma, mid-write truncation, null-byte payloads, or wrong-type-per-required-field. These are the realistic failure modes that surface during `cosmiconfig` reads from user disks.
3. **No documented negative-path inventory.** `tests/AGENTS.md` describes the mock budget and helpers but never tells reviewers "every user-facing command should have at least three tests for its failure paths." Without that inventory, reviewers don't notice when a new command lands with happy-path-only coverage.

This cluster lands three PRs that close the gaps without modifying production code:

- **PR-T1:** spec + `fast-check ^3.22.0` + pinned-seed setup + property tests over the three strict schemas + dashboard update.
- **PR-T2:** corrupt-config edge cases (BOM, trailing comma, truncated, null byte, wrong-type-per-required-field).
- **PR-T3:** concurrency + failure-mode tests for `loadConfig` / `saveConfig` plus the `## Negative-Path Inventory` section in `tests/AGENTS.md`.

The cluster does **not** introduce any production code change. It does not extend `.strict()` to schemas Cluster A left non-strict (`installedComponentSchema`, `installedThemeSchema`, `communityRegistrySchema`, `optionsSchema`); those decisions stand. It does not raise the mock budget; all new tests use `vi.spyOn` exclusively.

## Goals

- `fast-check ^3.22.0` lands as a dev dependency.
- Setup file at `tests/unit/_setup/fast-check.ts` pins `seed = 1` in CI; local discovery via `FC_SEED=<n>`. Resolves dashboard Open Question #3.
- `tests/unit/schemas/config-property.test.ts` (~120 LOC) ships three property blocks:
  - **Round-trip** for `kigumiConfigSchema`: arbitrary valid input survives parse + JSON round-trip.
  - **Strict rejection** for all three schemas: arbitrary valid input plus an arbitrary unknown key always rejects with `unrecognized_keys`.
  - **`mergeWithDefaults` invariance**: running the merge twice equals running it once.
- `tests/unit/schemas/config-corrupt.test.ts` (~180 LOC) covers five distinct corrupt-config scenarios.
- `tests/unit/concurrency.test.ts` and `tests/unit/failure-modes.test.ts` (each ~150 LOC) pin runtime behavior of `saveConfig` / `loadConfig` under concurrent and failing IO. `vi.spyOn` only.
- `tests/AGENTS.md` gains a `## Negative-Path Inventory` section listing 18 rows (11 top-level commands + 7 registry sub-commands) x at least 3 citations each.
- `grep -rn 'vi\.mock' tests/unit | wc -l` stays at the post-Cluster-S value of 16.

## Non-Goals

- **Extending `.strict()` further.** Cluster A drew the strict line at the three schemas above. T does not move it.
- **Property tests on `communityRegistrySchema`.** Four `.refine()` chains (semver + path traversal + cross-field invariants) make generators expensive. The 14 example-based path-traversal cases at `tests/unit/community-registry.test.ts` are the existing coverage; a property suite is its own initiative if needed later.
- **Property tests on integration / e2e tiers.** Pinned-seed semantics only matter at the deterministic unit tier; the higher tiers spawn subprocesses with their own fs state.
- **Rewriting `tests/unit/config.test.ts:394-425`.** Those existing edge cases stay; T2's file is parallel coverage, not a replacement.
- **Touching production code.** Zero `src/**` lines change. Test-only PRs, mergeable in any order beyond T1 (T2 and T3 do not import from T1's tests).
- **Increasing the mock budget.** All new tests use `vi.spyOn`, which the budget script's substring regex `/vi\.mock/g` does not match.

## API Surface

| File                                                                   | Change Type      | Description                                                                                                                                           |
| ---------------------------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                                         | Modified (PR-T1) | Add `fast-check ^3.22.0` to `devDependencies`. (Bundled types; no `@types/fast-check`.)                                                               |
| `vitest.unit.config.ts`                                                | Modified (PR-T1) | Add `setupFiles: ['tests/unit/_setup/fast-check.ts']` inside the existing `test:` block.                                                              |
| `tests/unit/_setup/fast-check.ts`                                      | Created (PR-T1)  | `fc.configureGlobal({ seed: process.env.FC_SEED ? Number(...) : 1, numRuns: 100 })`. Pinned in CI; locally overridable via env.                       |
| `tests/unit/schemas/config-property.test.ts`                           | Created (PR-T1)  | Three describe blocks: round-trip, strict-rejection across all three schemas, `mergeWithDefaults` invariance.                                         |
| `docs/superpowers/state/test-infrastructure-hardening-status.md`       | Modified (PR-T1) | Cluster T row: PLANNED -> IN-PROGRESS, link spec + plan + first PR. Open Question #3 marked RESOLVED. Bump `Last updated`.                            |
| `docs/superpowers/specs/2026-05-04-cluster-t-property-based-design.md` | Created (PR-T1)  | This file.                                                                                                                                            |
| `tests/unit/schemas/config-corrupt.test.ts`                            | Created (PR-T2)  | Five scenarios: BOM, trailing comma, truncated mid-write, null byte in string, wrong-type-per-required-field via `it.each(...)`.                      |
| `tests/unit/concurrency.test.ts`                                       | Created (PR-T3)  | Pin `saveConfig` behavior under concurrent patches and `loadConfig` mid-write. `vi.spyOn(fsPromises, 'writeFile')` only.                              |
| `tests/unit/failure-modes.test.ts`                                     | Created (PR-T3)  | ENOSPC / EACCES on disk; 403 / 429 on github-fetcher's `fetch`; ECONNREFUSED. `vi.spyOn` on the relevant module/global.                               |
| `tests/AGENTS.md`                                                      | Modified (PR-T3) | New `## Negative-Path Inventory` section: 18 rows (11 top-level commands + 7 registry sub-commands) x at least 3 citations each. Bump `Last Updated`. |

## Behavior & Edge Cases

### Pinned-seed setup

```ts
// tests/unit/_setup/fast-check.ts
import * as fc from 'fast-check';

fc.configureGlobal({
  seed: process.env.FC_SEED ? Number(process.env.FC_SEED) : 1,
  numRuns: 100,
});
```

`vitest.unit.config.ts` registers it via `setupFiles: ['tests/unit/_setup/fast-check.ts']`. In CI the seed is `1`; locally a developer hunting a counter-example exports `FC_SEED=42 pnpm test`. `numRuns` defaults to 100 globally; the round-trip property overrides to 500 inline because it has the broadest input surface.

### Generator strategy

The three property tests share a `validKigumiConfigArb` generator that mirrors `kigumiConfigSchema`. Required fields draw from `fc.constantFrom(...FRAMEWORKS)` for framework, `fc.boolean()` for typescript, and a path-shaped string generator (`fc.string({ minLength: 1, maxLength: 64 }).filter(s => s.length > 0)`) for the three directory fields. Theme fields use the same path-shaped generator. Optional `webAwesome.version` draws from a small list of valid semver strings. The generator does **not** include `installedComponents`, `installedThemes`, `registries`, or `kigumiVersion`; those nested schemas are not `.strict()` and the round-trip property would need its own generators which are out-of-scope.

### Round-trip property

```ts
fc.property(validKigumiConfigArb, (value) => {
  const parsed = kigumiConfigSchema.parse(JSON.parse(JSON.stringify(value)));
  expect(parsed).toEqual(value);
});
```

`JSON.parse(JSON.stringify(...))` drops `undefined` properties on both sides so the assertion is symmetric (`fc` may or may not include optional fields; JSON serialization always strips `undefined`). `numRuns: 500` inline because round-trip is the most discovery-rich property.

### Strict rejection property

For each of `kigumiConfigSchema`, `themeConfigSchema`, `webAwesomeConfigSchema`:

```ts
fc.property(
  validArb,
  fc.string({ minLength: 1 }).filter((k) => !KNOWN_KEYS.has(k)),
  (value, unknownKey) => {
    const tampered = { ...value, [unknownKey]: 'sentinel' };
    const result = schema.safeParse(tampered);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((iss) => iss.code === 'unrecognized_keys')
      ).toBe(true);
    }
  }
);
```

The unknown-key generator filters out the schema's known keys to avoid spurious shrinks. For `kigumiConfigSchema` the filter list also excludes the legacy keys `aliases` and (for `webAwesome`) `cdnUrl` because `mergeWithDefaults` strips those before parse - the property is over the raw schema, but the filter keeps the contract honest about which keys count as "unknown."

### Merge invariance property

```ts
fc.property(partialKigumiConfigArb, (partial) => {
  const once = mergeWithDefaults(partial);
  const twice = mergeWithDefaults(once);
  expect(twice).toEqual(once);
});
```

Documents that `mergeWithDefaults` is idempotent. Catches accidental cumulative mutation if someone adds a default-injection step that does not check existing values first.

### Corrupt-config scenarios (PR-T2)

Each scenario writes to a `mkdtemp` directory with `fs-extra`, then invokes `loadConfig(testDir)` or `getConfig(testDir)`:

1. **BOM:** prefix valid JSON with `﻿`; assert cosmiconfig tolerates BOM (`loadConfig` returns the parsed payload).
2. **Trailing comma:** write `{"framework":"react",}`; assert `loadConfig` throws.
3. **Truncated mid-write:** write the first 50% of a valid config; assert `loadConfig` throws with a parseable error message.
4. **Null byte in string:** write `{"framework":"react "}`; assert `getConfig` throws `ConfigInvalidError` (the embedded null fails `z.enum(FRAMEWORKS)`).
5. **Wrong type per required field:** parametrise with `it.each(...)` over `framework / typescript / componentsDir / utilsDir / stylesDir / theme`. For each, write a config with that field set to the wrong type and assert `ConfigInvalidError` whose issues mention the field name.

### Concurrency tests (PR-T3)

`saveConfig` is a load -> merge -> write sequence. Tests pin its current behavior:

1. **Disjoint patches:** `Promise.all([saveConfig({theme: {selected: 'a'}}), saveConfig({webAwesome: {version: '4.0.0'}})])`. Read the file back, assert valid JSON. Document last-write-wins semantics so a future atomic-rename change has a baseline.
2. **`loadConfig` mid-write:** spy on `fs.writeJson` to delay one tick; concurrently call `loadConfig`. Assert `loadConfig` returns either the prior or new state - never partial.
3. **Write failure surfaces as throw:** spy on `fs.writeJson` rejecting; assert `saveConfig` throws (no `process.exit`, no swallow).

### Failure-mode tests (PR-T3)

Three families, each scoped per test with `vi.spyOn` and restored in `afterEach` via `vi.restoreAllMocks()`:

1. **Disk failures:** `vi.spyOn(fs, 'writeJson').mockRejectedValueOnce(Object.assign(new Error('ENOSPC'), { code: 'ENOSPC' }))`. Assert `saveConfig` propagates the error (current behavior is plain `Error` with `code` preserved; a typed-error promotion is a future concern).
2. **GitHub fetcher 403/429:** `vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', {status: 403}))`. Assert `fetchFile` throws an `Error` whose message contains "Authentication failed". (Cluster A did not promote these to `AuthenticationError`; T pins current behavior.)
3. **Network unreachable:** `vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(Object.assign(new TypeError('fetch failed'), { cause: { code: 'ECONNREFUSED' } }))`. Assert `fetchFile` rethrows a `TypeError`.

### Negative-path inventory (PR-T3)

A new `## Negative-Path Inventory` section in `tests/AGENTS.md` lists 18 rows: `init`, `add`, `update`, `upgrade`, `diff`, `theme set`, `theme show`, `theme install`, `palette`, `brand`, `status` (top-level: 11), plus `registry init`, `registry validate`, `registry connect`, `registry list`, `registry remove`, `registry add-component`, `registry add-theme` (sub-commands: 7). Each row cites a test file and a substring of a test name. Reviewers extending a command must add a row for any new failure mode.

## Pipeline Changes

### Today's shape (post-Cluster-S, post-Cluster-A)

- `pnpm test` runs the unit suite. No property-based generators.
- `tests/AGENTS.md` documents the mock budget and helper pattern, no negative-path inventory.
- Corrupt-config coverage limited to `tests/unit/config.test.ts:394-425` (3 cases).
- Failure-mode coverage scattered across command tests; no central pin.

### After cluster T

- `pnpm test` runs property-based generators with `seed = 1` in CI; `FC_SEED` overrides locally.
- `tests/unit/schemas/{config-property,config-corrupt}.test.ts` close the schema-layer gap.
- `tests/unit/{concurrency,failure-modes}.test.ts` close the runtime-behavior gap.
- `tests/AGENTS.md ## Negative-Path Inventory` is the contract reviewers reference when extending a command.

## Risks

| Risk                                                                  | Likelihood | Impact | Mitigation                                                                                                                            |
| --------------------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Round-trip fails because `undefined` vs omitted optional fields drift | Medium     | Low    | `JSON.parse(JSON.stringify(value))` on both sides drops `undefined`; deep-equal symmetric.                                            |
| `vi.spyOn` leaks across tests in the same file                        | Medium     | Medium | `afterEach(() => vi.restoreAllMocks())` in every concurrency / failure-mode describe.                                                 |
| Pinned `seed = 1` only finds shallow counter-examples                 | Low        | Low    | Round-trip overrides `numRuns: 500` inline; `FC_SEED` env override during local discovery.                                            |
| Concurrency tests flake on slow CI                                    | Medium     | Medium | Deterministic `Promise.resolve().then(...)` ticks; no `setTimeout`.                                                                   |
| Inventory drifts when commands change                                 | Medium     | Low    | Section in `tests/AGENTS.md` with reviewer note. No automatic gate (over-engineering for 18 rows).                                    |
| Vitest does not pick up `tests/unit/schemas/`                         | Low        | Medium | Verified: `vitest.unit.config.ts` `exclude` only excludes `tests/{integration,e2e,react*,test-*,.tmp-*}` and `node_modules` / `dist`. |
| `globalThis.fetch` spy bleeds into other tests                        | Medium     | Medium | Wrap in `vi.spyOn` + `restoreAllMocks` in `afterEach`. Only one test per `it` block uses the spy.                                     |
| `Cluster A` did not promote 401/403 to `AuthenticationError`          | Confirmed  | Low    | Pin current message-substring contract; promotion is a future concern (note in spec).                                                 |

## PR Decomposition

### PR-T1 — Property-based infra (~350 LOC)

- This spec.
- `package.json` devDep.
- `vitest.unit.config.ts` setupFiles.
- `tests/unit/_setup/fast-check.ts`.
- `tests/unit/schemas/config-property.test.ts`.
- Dashboard update.

### PR-T2 — Corrupt-config edge cases (~180 LOC)

- `tests/unit/schemas/config-corrupt.test.ts`.

### PR-T3 — Concurrency + failure-modes + inventory (~400 LOC)

- `tests/unit/concurrency.test.ts`.
- `tests/unit/failure-modes.test.ts`.
- `tests/AGENTS.md` `## Negative-Path Inventory`.
- Dashboard close-out (T flips to SHIPPED).

## Acceptance Criteria

### PR-T1

- `tests/unit/schemas/config-property.test.ts` exists with at least 1 `fc.property` covering every required field of `kigumiConfigSchema`, at least 1 `.strict()` rejection across all three schemas, and at least 1 `mergeWithDefaults` invariance assertion.
- `pnpm test` reports the new file as deterministic (same pass with `FC_SEED=1` and `FC_SEED=42`).
- `grep -rn 'vi\.mock' tests/unit | wc -l` stays at 16.
- Dashboard renders correct cluster status (T = IN-PROGRESS, Open Question #3 = RESOLVED).

### PR-T2

- `tests/unit/schemas/config-corrupt.test.ts` exists with at least 5 distinct corrupt-input scenarios (BOM, trailing comma, truncated, null byte, wrong-type via `it.each`).
- All scenarios pass.
- `grep -rn 'vi\.mock' tests/unit | wc -l` stays at 16.

### PR-T3

- `tests/unit/concurrency.test.ts` has at least 3 tests; `tests/unit/failure-modes.test.ts` has at least 3 tests.
- `tests/AGENTS.md` `## Negative-Path Inventory` has 18 rows x at least 3 citations.
- `pnpm validate:agents` clean.
- `grep -rn 'vi\.mock' tests/unit | wc -l` stays at 16.
- Dashboard cluster T flips to SHIPPED with three PR links.

## Verification

After each of T1 / T2 / T3, run on the worktree:

```bash
pnpm type-check
pnpm lint
pnpm test
pnpm check:tests
pnpm check:mocks
MOCK_BUDGET_ENFORCE=1 pnpm check:mocks
pnpm test:integration
```

T1-only seed sanity:

```bash
FC_SEED=42 pnpm test tests/unit/schemas/config-property.test.ts
FC_SEED=99 pnpm test tests/unit/schemas/config-property.test.ts
```

Both seeds pass; counter-examples explored differ.

## References

- [Initiative](../initiatives/2026-04-28-test-infrastructure-hardening.md)
- [Cluster A spec](2026-04-28-cluster-a-config-lifecycle-hardening-design.md) - introduced `.strict()`.
- [Cluster S spec](2026-05-02-cluster-s-mock-reduction-design.md) - structural template + mock budget.
- [Cluster Q1 spec](2026-04-29-cluster-q1-test-foundation-design.md) - `pnpm check:tests`.
- [Dashboard](../state/test-infrastructure-hardening-status.md).
- [`fast-check` API reference](https://fast-check.dev/docs/core-blocks/) - generator combinators and `configureGlobal`.
