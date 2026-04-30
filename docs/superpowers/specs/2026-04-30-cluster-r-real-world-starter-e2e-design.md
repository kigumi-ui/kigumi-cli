# Cluster R: Real-World Starter E2E + Snapshot Diff - Specification

> Replace Q2's inline-scaffolded matrix with the install path users actually take. Clone four pinned starter repos, link the packed CLI tarball, run the lifecycle, and freeze every byte of generated output as committed fixtures. Drift fails CI without an explicit `--update` commit. Promote the release-time smoke into a per-PR `pack-test`. Add a migration fixture suite that proves `kigumi upgrade` keeps working as the schema evolves.

**Type:** Build/Infra
**Status:** Draft
**Author:** Mischa
**Date:** 2026-04-30
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** F-X1, F-X2, F-X3, F-X4, F-X5 (NEW; registered locally in 2nd brain after merge)
**Depends on:** Q2 (CI completeness, PR #138)
**Blocks:** the v0.20.0 ship gate (initiative acceptance criterion 10: starter snapshot diff committed)
**Branched from:** `main` after PR #138 merges

## Overview

Cluster Q2 added Vue and Angular to the integration matrix and gave the release pipeline a real-install smoke test. Both run inside the CI runner against a starter that the CLI scaffolds inline (`kigumi init --framework <f> --non-interactive`). The starter the runner sees is whatever the CLI emits **today**; nothing checks that the emitted output continues to compile against the actual published starter repos that real users start from.

Cluster R closes that gap by inverting the flow:

| Direction                    | Q2 (inline scaffold)                                     | R (cloned starter)                                                               |
| ---------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Where the starter comes from | `kigumi init` emits it on the runner                     | `actions/checkout` clones a pinned commit of `kigumi-ui/kigumi-<f>-starter`      |
| What the lane proves         | The CLI's emitted starter compiles                       | The published starter still compiles after the user runs `kigumi add` against it |
| Determinism                  | Reset every run by the CLI                               | Pinned via `vars.STARTER_<F>_REF`; bumps are explicit PRs                        |
| Wrapper output drift         | Caught only if the starter's typecheck happens to notice | Caught at byte level via `tests/fixtures/starter-snapshots/`                     |
| Number of frameworks         | 4 (react@18, react@19, vue@3, angular)                   | 4 (react, vue, angular, next)                                                    |
| Tier coverage                | Free only                                                | Free across all 4 (Next migrates Pro -> Free as a Phase 0 prerequisite)          |

Three additional surfaces ride along under the same cluster because they share the "real install path" theme:

- **F-X4 promotes Q2's release-time smoke (F-048) into a CI-side `pack-test` job.** The release-time guard stays. The new per-PR guard catches packaging regressions before they wait for a release tag.
- **F-X5 adds a migration fixture suite.** `tests/fixtures/migration/0.18.x-config.json` and `0.19.x-config.json` are realistic config shapes; `kigumi upgrade --yes` against each must produce a config that validates against the latest schema. Catches schema-evolution regressions that today only surface when a user upgrades.
- **R extends initiative scope from 3 starters to 4.** The initiative doc declared `kigumi-next-starter` out-of-scope for v0.20.0 because it had no GitHub remote and used `@awesome.me/webawesome-pro` (paid). Both blockers resolve as a Phase 0 prerequisite to R: the starter is pushed to `kigumi-ui/kigumi-next-starter` and migrated from Pro to Free, with its login example brought in line with `kigumi-react-starter`. Pro-tier CI coverage stays out of scope for R; that lands as a follow-up cluster after Pro registry auth is wired into the matrix.

This is a build-infra cluster. No `src/` changes. No new public API. Only CI workflow files, a new test harness, fixture files, one update helper script, and one new package.json script.

## Goals

- **Catch starter/template drift on every PR.** A wrapper template change that breaks against any published starter repo turns a lane red before merge.
- **Catch byte-level wrapper output drift.** Any change to a generated file (whitespace, import order, prop forwarding) requires an explicit `pnpm test:starters --update` commit. Silent drift cannot land.
- **Provide deterministic CI signal.** Pinned starter commits via repository variables. A regression in a starter (unrelated to kigumi) does not block kigumi PRs until a deliberate bump.
- **Provide an upgrade safety net.** `kigumi upgrade` is exercised on every PR against fixed historical config shapes. Schema evolutions that break upgrade are caught at PR time.
- **Provide a CI-side packaging smoke.** `pack-test` job mirrors the release-time smoke but runs per PR. No more "the release smoke caught this" surprises after a PR has already merged.
- **No source-code changes in `src/`.** Only CI, tests, fixtures, scripts, and one package.json script entry.
- **No new dependencies at runtime or dev-time.** Vitest's `toMatchFileSnapshot` covers the fixture diff. `actions/checkout` covers the clone.

## Non-Goals

- **Replacing Q2's inline 4-lane matrix.** Q2's matrix runs in ~2 to 3 minutes per lane and gives fast PR feedback against the CLI's _current_ emit. R's `starters` job runs in ~5 to 7 minutes per lane and gives real-world coverage against pinned published starters. Both have value. R adds a job; it does not delete Q2's.
- **Pro-tier coverage in CI.** The Next starter migrates Pro -> Free as a Phase 0 prerequisite. Once the matrix is uniformly Free, Pro coverage becomes a separate follow-up cluster (lands when WA Pro registry auth is wired into the `starters` job; out of scope for R).
- **Mutation testing.** Cluster V.
- **Visual regression of the docs site.** Cluster S.
- **Story `play()` interactions.** Cluster U.
- **Auto-bumping starter pin refs.** Manual via release checklist (initiative default: bump on every kigumi-cli minor release).
- **Migration fixture coverage older than 0.18.x.** Older shapes deferred to follow-up. The two fixtures included (0.18.x and 0.19.x) bracket the cluster-B vestigial-surface drop, which is the most recent breaking schema change.
- **A separate starter for Svelte or other frameworks.** R covers what ships today.

## API Surface

| File                                                            | Change Type | Description                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/ci.yml` (new `starters` job)                 | Created     | 4-lane matrix (react, vue, angular, next) with `fail-fast: false`. Each lane: checkout kigumi-cli, build, pack, checkout starter at `vars.STARTER_<F>_REF`, install starter deps, install tarball, run `kigumi add` against a curated component set, run snapshot diff, then run starter `pnpm typecheck && pnpm build`. (F-X2 + F-X3 + snapshot extension) |
| `.github/workflows/ci.yml` (new `pack-test` job)                | Created     | Mirrors Q2's F-048 release smoke but in `ci.yml`. Runs once (react only) on every PR. Catches packaging regressions before release. (F-X4)                                                                                                                                                                                                                  |
| `.github/workflows/release.yml`                                 | No change   | Q2's F-048 smoke step stays in place. F-X4 supplements; it does not replace. Documented in the spec for clarity.                                                                                                                                                                                                                                            |
| `tests/fixtures/migration/0.18.x-config.json`                   | Created     | Realistic 0.18.x config shape (pre-cluster-B vestigial-surface drop). (F-X5)                                                                                                                                                                                                                                                                                |
| `tests/fixtures/migration/0.19.x-config.json`                   | Created     | Realistic 0.19.x config shape (post-cluster-B). (F-X5)                                                                                                                                                                                                                                                                                                      |
| `tests/integration/migration.test.ts`                           | Created     | For each fixture: copy to tmp dir, run `kigumi upgrade --yes`, assert exit 0, assert resulting config validates against the latest schema, assert no warnings. (F-X5)                                                                                                                                                                                       |
| `tests/e2e/starter-snapshots.test.ts`                           | Created     | Snapshot harness. Walks the starter's emitted dirs after `kigumi add`, compares each file against `tests/fixtures/starter-snapshots/<framework>/<file>` via vitest's `toMatchFileSnapshot`. Framework selected via `KIGUMI_STARTER` env var.                                                                                                                |
| `tests/fixtures/starter-snapshots/{react,vue,angular,next}/...` | Created     | Golden output. Every emitted file under DEFAULT_COMPONENTS_DIR + DEFAULT_UTILS_DIR + DEFAULT_STYLES_DIR for the curated component set, frozen byte-for-byte.                                                                                                                                                                                                |
| `scripts/update-starter-snapshots.ts`                           | Created     | Local helper. Runs the harness in update mode for one or all frameworks; reports which fixtures changed. Used during deliberate template changes.                                                                                                                                                                                                           |
| `package.json` `scripts.test:starters`                          | Created     | `vitest run tests/e2e/starter-snapshots.test.ts --testTimeout=600000`. Local entry point; CI invokes via the matrix.                                                                                                                                                                                                                                        |
| **Upstream PRs** (outside this repo)                            | Created     | Each starter repo gets a one-line `package.json` add: `"typecheck": ...` per framework. (F-X1) The Next starter PR also flips Pro -> Free and ports the login example shape from `kigumi-react-starter`.                                                                                                                                                    |

The exact upstream PR additions (F-X1):

| Starter repo                       | Added script                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `kigumi-ui/kigumi-react-starter`   | `"typecheck": "tsc -b --noEmit"`                                                           |
| `kigumi-ui/kigumi-vue-starter`     | `"typecheck": "vue-tsc -b --noEmit"`                                                       |
| `kigumi-ui/kigumi-angular-starter` | `"typecheck": "tsc --noEmit -p tsconfig.app.json"`                                         |
| `kigumi-ui/kigumi-next-starter`    | `"typecheck": "tsc --noEmit"` (same PR as Pro -> Free migration + login-example alignment) |

## Pipeline Changes

### Today's CI shape (post-Q2, on `main`)

```
quality        : lint, format:check, pnpm run type-check, validate:registry, validate:templates
docs-typecheck : install docs/ deps, tsc -p tsconfig.app.json from docs/
test           : test:coverage, build
integration    : matrix include react@18, react@19, vue@3, angular@17 (per-framework starter scaffold + type-check)
e2e            : build CLI, test:e2e
chromatic      : storybook + chromatic upload (conditional, unchanged)
```

### After R

```
quality        : (unchanged)
docs-typecheck : (unchanged)
test           : (unchanged)
integration    : (unchanged) Q2's lighter inline-scaffolded matrix stays for fast PR feedback
e2e            : (unchanged)
chromatic      : (unchanged)
starters       : (new) matrix include react, vue, angular, next; clone pinned starter, install tarball,
                 run kigumi add, snapshot diff, run starter typecheck + build
pack-test      : (new) pnpm pack, install tarball into scratch dir, run kigumi init + add, assert wrapper exists
```

CI runtime delta per PR (approximate, ubuntu-latest):

- `starters`: 4 lanes, ~5 to 7 minutes per lane, parallelized within the matrix and parallel with `integration`. Critical-path increase: ~5 to 7 minutes (the slowest single lane, likely Angular due to `ng build`).
- `pack-test`: ~1 to 2 minutes (single lane, mostly `pnpm pack` + `npm i file:` + `kigumi init` + `kigumi add`).
- Combined critical-path increase: ~5 to 7 minutes per PR. The starter matrix's runtime is dominated by the slowest single lane because `fail-fast: false` lets all four run to completion; lane parallelism contains the wall-clock impact.

## Behavior & Edge Cases

### F-X1: typecheck script in 4 starters (upstream)

Each starter repo gains a `typecheck` script, applied as a one-line addition to its `package.json:scripts`. The form differs per framework because the canonical type-checker differs (`tsc`, `vue-tsc`, project-relative `tsc`):

```jsonc
// kigumi-react-starter/package.json
"scripts": {
  "typecheck": "tsc -b --noEmit",
  // ...existing scripts
}
```

Equivalent shapes for vue, angular, and next listed in the API Surface table. Each upstream PR is a one-line change with no source modifications. R's `starters` matrix asserts the script exists; lanes fail with a clear "missing typecheck script" message if a starter PR was reverted.

The Next starter PR is larger than the others because it bundles the Pro -> Free migration and login-example alignment with the typecheck script. The migration replaces every `@awesome.me/webawesome-pro` import with `@awesome.me/webawesome` and updates `package.json:dependencies` accordingly. The login example is rewritten to mirror `kigumi-react-starter`'s shape (same component set, same form layout, same wrapper imports). After the migration, the Next starter is structurally Free-tier and visually consistent with the React starter.

These four PRs land before R's matrix PR (Phase 3 below). R's `starters` job depends on the typecheck script existing in each pinned starter commit; the `vars.STARTER_<F>_REF` value points at the post-PR commit.

### F-X2: pinned starter refs

GitHub Actions repository variables hold the pinned starter commits:

- `STARTER_REACT_REF` (full SHA of `kigumi-ui/kigumi-react-starter`)
- `STARTER_VUE_REF` (full SHA of `kigumi-ui/kigumi-vue-starter`)
- `STARTER_ANGULAR_REF` (full SHA of `kigumi-ui/kigumi-angular-starter`)
- `STARTER_NEXT_REF` (full SHA of `kigumi-ui/kigumi-next-starter`)

Set via `gh variable set` at land time, after the Phase 0 PRs merge:

```bash
gh variable set STARTER_REACT_REF --body "<sha>"
gh variable set STARTER_VUE_REF --body "<sha>"
gh variable set STARTER_ANGULAR_REF --body "<sha>"
gh variable set STARTER_NEXT_REF --body "<sha>"
```

Bump cadence: every kigumi-cli minor release as part of the release checklist (initiative default). The cadence is documented in the release skill so that bumping the four refs becomes a routine release-time step. A regression in a starter (unrelated to kigumi) is not pushed into kigumi-cli's CI signal until someone opens a PR to bump the affected ref.

`actions/checkout@v6` reads the ref via the matrix:

```yaml
- name: Checkout starter
  uses: actions/checkout@v6
  with:
    repository: ${{ matrix.repo }}
    ref: ${{ matrix.starter_ref }}
    path: ../starter
    fetch-depth: 1
```

`fetch-depth: 1` because the lane only needs the pinned commit; full history adds nothing.

### F-X3: starter e2e matrix

The new `starters` job in `.github/workflows/ci.yml`:

```yaml
starters:
  name: Starter E2E (${{ matrix.framework }})
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      include:
        - {
            framework: react,
            repo: kigumi-ui/kigumi-react-starter,
            starter_ref: vars.STARTER_REACT_REF,
          }
        - {
            framework: vue,
            repo: kigumi-ui/kigumi-vue-starter,
            starter_ref: vars.STARTER_VUE_REF,
          }
        - {
            framework: angular,
            repo: kigumi-ui/kigumi-angular-starter,
            starter_ref: vars.STARTER_ANGULAR_REF,
          }
        - {
            framework: next,
            repo: kigumi-ui/kigumi-next-starter,
            starter_ref: vars.STARTER_NEXT_REF,
          }
  steps:
    - name: Checkout kigumi-cli
      uses: actions/checkout@v6

    - name: Setup pnpm
      uses: pnpm/action-setup@v5

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: 20
        cache: pnpm
        cache-dependency-path: pnpm-lock.yaml

    - name: Install kigumi-cli deps
      run: pnpm install --frozen-lockfile

    - name: Build CLI
      run: pnpm run build

    - name: Pack CLI
      id: pack
      run: |
        TARBALL=$(pnpm pack | tail -1)
        echo "tarball=$GITHUB_WORKSPACE/$TARBALL" >> "$GITHUB_OUTPUT"

    - name: Checkout starter
      uses: actions/checkout@v6
      with:
        repository: ${{ matrix.repo }}
        ref: ${{ matrix.starter_ref }}
        path: ../starter
        fetch-depth: 1

    - name: Install starter deps
      working-directory: ../starter
      run: pnpm install --frozen-lockfile --ignore-workspace

    - name: Install kigumi tarball
      working-directory: ../starter
      run: pnpm add -D "file:${{ steps.pack.outputs.tarball }}" --ignore-workspace

    - name: Add components
      working-directory: ../starter
      run: pnpm exec kigumi add button input select dialog card badge switch textarea tooltip table --overwrite --yes

    - name: Snapshot diff
      env:
        KIGUMI_STARTER: ${{ matrix.framework }}
        KIGUMI_STARTER_DIR: ${{ github.workspace }}/../starter
      run: pnpm run test:starters

    - name: Starter typecheck
      working-directory: ../starter
      run: pnpm run typecheck

    - name: Starter build
      working-directory: ../starter
      run: pnpm run build
```

Lifecycle decision: every starter ships pre-initialized with `kigumi.config.json`. `kigumi init` is intentionally skipped because the canonical user flow R targets is "user already has a starter, runs `kigumi add` to bring in components". The init-on-empty-dir flow is covered by `pack-test` (F-X4 below).

`--overwrite --yes` on `kigumi add` because the starter may ship with example components in `src/components/ui/`. R freezes the CLI's emit, not whatever the starter's example happens to be. Overwrite produces a deterministic baseline regardless of starter pre-population.

`--ignore-workspace` on the Next lane's pnpm calls because `kigumi-next-starter` ships a `pnpm-workspace.yaml` (used for local dev with linked CLI). In CI the lane installs against the cloned-starter root, not a workspace. The flag is harmless on the other three lanes; including it uniformly keeps the matrix symmetric.

### F-X4: pack-test job

The new `pack-test` job:

```yaml
pack-test:
  name: Pack Test
  runs-on: ubuntu-latest
  steps:
    - name: Checkout
      uses: actions/checkout@v6

    - name: Setup pnpm
      uses: pnpm/action-setup@v5

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: 20
        cache: pnpm
        cache-dependency-path: pnpm-lock.yaml

    - name: Install dependencies
      run: pnpm install --frozen-lockfile

    - name: Build CLI
      run: pnpm run build

    - name: Pack and smoke
      run: |
        TARBALL=$(pnpm pack | tail -1)
        SMOKE_DIR="$RUNNER_TEMP/kigumi-pack-test"
        mkdir -p "$SMOKE_DIR"
        cd "$SMOKE_DIR"
        npm init -y > /dev/null
        npm i "file:$GITHUB_WORKSPACE/$TARBALL"
        npx kigumi init --framework react --non-interactive
        npx kigumi add button --yes
        test -f src/components/ui/Button/Button.tsx || (echo "Button wrapper missing"; exit 1)
```

This is functionally identical to Q2's F-048 release-time smoke step. F-X4 supplements; it does not replace. Reasoning:

- F-048 in `release.yml` runs after `changeset` decides a release is happening; if it fails, publish is blocked. That is the right release-time guard.
- F-X4 in `ci.yml` runs on every PR. A packaging regression (e.g., `templates/` falls out of `package.json:files` in a refactor PR) is caught before merge instead of after a release tag.

The two run at different points in the lifecycle and serve different audiences (release ops vs. PR review). Removing F-048 to avoid duplication would push packaging signals back to release time; keeping both costs ~1 to 2 minutes per PR and ~1 to 2 minutes per release.

`pack-test` is single-framework (react) by design. The `starters` job covers per-framework packaging implicitly because each lane's `pnpm add -D file:..` step exercises the same tarball install. The pack-test exists to fail fast on packaging shape (e.g., bin entry path, `files` glob) before the heavier 4-lane starter matrix even starts.

### F-X5: migration fixture suite

Two committed fixtures under `tests/fixtures/migration/`:

- `0.18.x-config.json`: realistic 0.18.x config shape. Includes the keys that cluster B's vestigial-surface drop removed (specifically the keys that the upgrader strips). The exact shape is captured by reading a real 0.18.x project's `kigumi.config.json` (via the changelog's "removed in 0.19" entries) and lightly anonymizing.
- `0.19.x-config.json`: realistic 0.19.x config shape. Post-cluster-B; reflects what current 0.19.x users have on disk.

The test driver `tests/integration/migration.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mkdtempSync, copyFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ConfigSchema } from '../../src/schemas/config.js';

const fixtures = ['0.18.x-config.json', '0.19.x-config.json'];

describe('kigumi upgrade migration fixtures', () => {
  for (const fixture of fixtures) {
    it(`upgrades ${fixture} to a config that validates against the latest schema`, () => {
      const dir = mkdtempSync(join(tmpdir(), 'kigumi-mig-'));
      try {
        copyFileSync(
          join(__dirname, '..', 'fixtures', 'migration', fixture),
          join(dir, 'kigumi.config.json')
        );
        const result = execSync(
          `node ${join(__dirname, '..', '..', 'dist', 'index.js')} upgrade --yes`,
          { cwd: dir, encoding: 'utf-8' }
        );
        expect(result).not.toMatch(/warning/i);
        const upgraded = JSON.parse(
          readFileSync(join(dir, 'kigumi.config.json'), 'utf-8')
        );
        expect(() => ConfigSchema.parse(upgraded)).not.toThrow();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }
});
```

The test asserts (a) `kigumi upgrade --yes` exits 0, (b) no warnings in stdout, and (c) the resulting config parses cleanly against the latest `ConfigSchema`. It does not assert exact stdout format because cosmetic output churn (color codes, prompt phrasing) would create false positives. The contract is "the upgrade ends in a valid config".

Coverage for shapes older than 0.18.x is deferred. If a future cluster reintroduces an older shape (unlikely; the trend is forward-only), a new fixture file gets added under the same directory.

### Snapshot extension

The fixture tree:

```
tests/fixtures/starter-snapshots/
├── react/
│   ├── components/ui/Button/Button.tsx
│   ├── components/ui/Button/index.ts
│   ├── components/ui/Input/Input.tsx
│   ├── ... (every emitted file for the curated set)
│   ├── lib/utils.ts
│   └── styles/...
├── vue/
│   └── ... (parallel structure, .vue + .ts files)
├── angular/
│   └── ... (parallel structure, .component.ts + .module.ts files)
└── next/
    └── ... (mirror of react/ since Next starter wires Kigumi the same way React does)
```

**Granularity:** every emitted file under `DEFAULT_COMPONENTS_DIR` + `DEFAULT_UTILS_DIR` + `DEFAULT_STYLES_DIR` (paths read from `src/utils/config.ts` defaults at the time the fixture is generated). This catches not just wrapper-template drift but also utility-file drift (e.g., `cn()` helper changes) and styles drift (`layers.css`, `theme.css`).

**Component set:** ten components covering broad surface area:

| Component  | Why included                                          |
| ---------- | ----------------------------------------------------- |
| `button`   | Smallest unit; sanity check                           |
| `input`    | Form control; v-model / controlled state in Vue/React |
| `select`   | Form control with internal state                      |
| `dialog`   | Overlay; portal/teleport semantics                    |
| `card`     | Layout primitive                                      |
| `badge`    | Inline visual; no state                               |
| `switch`   | Form control; boolean                                 |
| `textarea` | Multi-line form; v-model semantics                    |
| `tooltip`  | Hover/focus interaction                               |
| `table`    | Data display                                          |

The set exercises multi-word components (none in this list, but the test runner can be extended to add `button-group` etc. via the same harness if needed). Every component must exist in all four framework registries; a Phase 3 task verifies via `node dist/index.js list --framework <f>` before locking the set.

**Snapshot format:** vitest's `toMatchFileSnapshot` machinery. The harness writes a small wrapper that reads each generated file as a string and asserts against the fixture path:

```typescript
const generatedFiles = walk(starterDir, [
  DEFAULT_COMPONENTS_DIR,
  DEFAULT_UTILS_DIR,
  DEFAULT_STYLES_DIR,
]);
for (const file of generatedFiles) {
  const relative = relativePath(starterDir, file);
  const fixture = join(FIXTURES_DIR, framework, relative);
  await expect(readFileSync(file, 'utf-8')).toMatchFileSnapshot(fixture);
}
```

`toMatchFileSnapshot` natively supports `--update` via the `-u` vitest flag; running `pnpm run test:starters --update` regenerates fixtures.

**Update flow:**

```bash
# After a deliberate template change
pnpm run test:starters --update
# Review tests/fixtures/starter-snapshots/<framework>/ diff
git add tests/fixtures/starter-snapshots/
git commit -m "chore(starters): refresh snapshots after template change"
```

CI fails on any drift unless the fixture diff is committed. There is no auto-update path. The friction is intentional: every fixture change is a deliberate, reviewed commit.

**Where the diff runs:** `tests/e2e/starter-snapshots.test.ts` is the harness. It is invoked from the `starters` matrix lane via `pnpm run test:starters`, scoped to one framework at a time via `KIGUMI_STARTER` and `KIGUMI_STARTER_DIR` env vars. Locally, the harness can run against all four starters in sequence by iterating; the helper `scripts/update-starter-snapshots.ts` provides this bulk-update entry point.

## Dependencies

- [x] Cluster Q2 (PR #138) merged. R needs Q2's matrix shape and `pack-test`'s release-smoke template (F-048) to exist as the analog.
- [ ] Phase 0 prerequisite PR(s) merged in starter repos (see Implementation Phases).
- [ ] Repository variables set on `kigumi-cli`: `STARTER_REACT_REF`, `STARTER_VUE_REF`, `STARTER_ANGULAR_REF`, `STARTER_NEXT_REF`.

## Breaking Changes

None at the consumer level. Only CI signal and contributor workflow change.

For contributors:

- A wrapper template change that affects emitted output now requires a `pnpm run test:starters --update` follow-up commit. Without it, the `starters` lanes fail.
- Bumping a starter pin (`vars.STARTER_<F>_REF`) is a deliberate PR. Out-of-band changes (`gh variable set` in a console without an opened PR) are discouraged because they are invisible to PR review.

For starter-repo maintainers:

- Each starter repo carries a `typecheck` script. Its presence is asserted by R's matrix; removing it without coordination breaks kigumi-cli CI.

For release ops:

- `release.yml` smoke step (F-048) stays. F-X4 supplements it in `ci.yml`. No release-time behavior changes.

## Verification

After R ships (across the three implementation phases below):

- [ ] On a scratch branch in kigumi-cli: introduce a wrapper-output drift (e.g., add a stray space to `templates/react/Button/Button.tsx`). The React lane fails on snapshot diff. Revert; lane passes.
- [ ] On a scratch branch in kigumi-cli: bump `STARTER_REACT_REF` to a known-broken commit (e.g., a commit on `kigumi-react-starter` where `pnpm typecheck` is intentionally broken). The React lane fails at the typecheck step. Restore the pin; lane passes.
- [ ] After a deliberate template change: `pnpm run test:starters --update`, commit the fixture diff, push. Lanes pass.
- [ ] On a scratch branch: introduce a regression in `kigumi upgrade` (e.g., a default value the upgrader is supposed to migrate is left untouched). The migration test fails. Revert; passes.
- [ ] On a scratch branch: deliberately break the `bin` entry in `tsup.config.ts` so `dist/bin.js` is malformed. `pack-test` job fails before the `starters` matrix even runs. Revert; passes.
- [ ] On a scratch branch: remove `templates` from `package.json:files`. `pack-test` job fails (`kigumi add button` cannot find templates in the installed tarball). Revert; passes.
- [ ] Status dashboard at `docs/superpowers/state/test-infrastructure-hardening-status.md` shows R row moved to SHIPPED with the PR link. Q2 row updated to SHIPPED if not already (cleanup carried over from Q2 session).
- [ ] CHANGELOG.md has a new entry under Unreleased noting the new CI surface.

## Risks

| Risk                                                                                               | Mitigation                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Starter regressions unrelated to kigumi block PRs.                                                 | Each starter is pinned via `vars.STARTER_<F>_REF`. Bumps are explicit PRs to update the var. A bad starter commit cannot reach kigumi-cli CI without someone deliberately bumping the pin.                                                                                                                                                               |
| Snapshot fixtures grow unbounded as the component set expands.                                     | Cap at the curated 10-component set (button, input, select, dialog, card, badge, switch, textarea, tooltip, table). Document the curation criteria here. Reject set-expansion PRs without explicit justification (covered by spec review, not a CI check).                                                                                               |
| `starters` matrix runtime (~5 to 7 min per lane) slows PRs.                                        | Job runs in parallel with `integration` and `e2e`. `fail-fast: false` only inside the `starters` matrix so all four lanes report independently. Critical-path increase is bounded by the slowest single lane (likely Angular). If runtime exceeds ~10 min, mitigate via build cache (`actions/cache` for `node_modules` and per-framework build caches). |
| Migration fixture false-positives on cosmetic stdout churn.                                        | Test asserts schema-shape post-upgrade and absence of warning-level stdout, not exact stdout format. Color codes, prompt phrasing, and progress output do not break the test.                                                                                                                                                                            |
| Network flake when cloning external starter repos.                                                 | `actions/checkout@v6` with `fetch-depth: 1` minimizes fetch surface. GitHub Actions retries the underlying network step on transient failure. If flake becomes persistent, add an explicit `actions/checkout` retry wrapper or pre-cache via `actions/cache`.                                                                                            |
| F-X1 starter PR is reverted upstream after R's pin captures the post-PR commit.                    | The pin is to a specific SHA; an upstream revert does not affect the pinned commit. Bumping past the revert is a deliberate PR that someone reviews.                                                                                                                                                                                                     |
| Pro -> Free migration of `kigumi-next-starter` is incomplete (some Pro-only import slips through). | Phase 0 PR review checks every `webawesome-pro` import is removed. The post-migration `pnpm typecheck` in the starter repo's own CI fails if any Pro-only type or component leaks. R's matrix double-checks via the same typecheck.                                                                                                                      |
| `kigumi-next-starter`'s `pnpm-workspace.yaml` interferes with `pnpm add -D file:..` in the lane.   | The lane invokes pnpm with `--ignore-workspace` to scope the install to the cloned-starter root. Symmetric across all four lanes for clarity.                                                                                                                                                                                                            |
| The 10-component set picks a name that does not exist in all four framework registries.            | Phase 3 first task: run `node dist/index.js list --framework <f>` for each of `react`, `vue`, `angular`, `next` and intersect with the proposed set. Replace any missing component with the closest equivalent.                                                                                                                                          |
| `toMatchFileSnapshot` resolves fixture paths relative to the test file, not the project root.      | Spec writes the fixture path explicitly via `join(FIXTURES_DIR, framework, relative)`. Verified during Phase 3 by running the harness in update mode and confirming files land where the spec expects.                                                                                                                                                   |

## Implementation Phases

R lands as three sequential PRs against `main`. Phase 0 is upstream prerequisite work in starter repos; Phases 1 to 3 are kigumi-cli PRs in dependency order.

### Phase 0: Upstream prerequisites (outside R PR)

**Goal:** Make every published starter ready for R's matrix.

**Repos:** `kigumi-ui/kigumi-react-starter`, `kigumi-ui/kigumi-vue-starter`, `kigumi-ui/kigumi-angular-starter`, `kigumi-ui/kigumi-next-starter`.

**Tasks:**

- Open one PR per starter adding the `typecheck` script. Forms listed in the API Surface table.
- For `kigumi-next-starter`, the same PR migrates Pro -> Free: replace `@awesome.me/webawesome-pro` with `@awesome.me/webawesome` everywhere; update `package.json:dependencies`; rewrite the login example to mirror `kigumi-react-starter`'s shape.
- After all four PRs merge, capture each merge commit SHA. These become the initial values for `STARTER_<F>_REF`.

**Validation:** Each starter's own CI (where it has CI) is green on the new HEAD. `pnpm typecheck && pnpm build` works locally for each starter.

**Session boundary:** Phase 0 is user-managed. R's kigumi-cli session does not write the starter PRs; it consumes their merged commits.

### Phase 1: Migration fixtures + test (F-X5), own PR

**Goal:** Prove `kigumi upgrade` keeps working by exercising it against historical config shapes.

**Files:** `tests/fixtures/migration/0.18.x-config.json`, `tests/fixtures/migration/0.19.x-config.json`, `tests/integration/migration.test.ts`.

**Tasks:**

- Capture a realistic 0.18.x config shape by reading the changelog's "removed in 0.19" entries and writing a fixture that includes those keys at sensible values.
- Capture a realistic 0.19.x config shape from the current schema's defaults.
- Add `tests/integration/migration.test.ts` per the snippet in F-X5 above.
- Run `pnpm test:integration` locally; confirm both fixture cases pass.
- Validate the negative path: introduce a regression in `kigumi upgrade` (e.g., a default value the upgrader is supposed to migrate is left untouched). Confirm the test fails. Revert.

**Validation:** `pnpm test:integration` exits 0 on a clean tree. The two new tests appear in the run output.

**Session boundary:** One Claude Code session.

### Phase 2: Pack-test CI job (F-X4), own PR

**Goal:** Per-PR packaging guard. Catches `templates/` falling out of `package.json:files`, bin entry breakage, and other tarball-shape regressions before release.

**Files:** `.github/workflows/ci.yml` (add `pack-test` job).

**Tasks:**

- Add the `pack-test` job per the YAML in F-X4 above. Position it after `e2e` in the file order.
- Run the new lane on the PR. Confirm green.
- Validate the negative path: on a separate scratch branch, deliberately remove `templates` from `package.json:files`. Push. Confirm `pack-test` fails. Revert.

**Validation:** PR shows new `pack-test` job green. Negative path confirms the lane catches a real packaging regression.

**Session boundary:** One Claude Code session.

### Phase 3: Starter pinning + e2e matrix + snapshot extension (F-X2 + F-X3 + snapshot ext), final largest PR

**Goal:** Real-world coverage. The `starters` matrix is the cluster's primary value-add.

**Files:** `.github/workflows/ci.yml` (add `starters` job), `tests/e2e/starter-snapshots.test.ts`, `tests/fixtures/starter-snapshots/{react,vue,angular,next}/...`, `scripts/update-starter-snapshots.ts`, `package.json` (add `test:starters` script), `docs/superpowers/state/test-infrastructure-hardening-status.md` (R row update), `CHANGELOG.md` (Unreleased entry).

**Tasks:**

- Verify the 10-component set exists in all four framework registries: `node dist/index.js list --framework <f>`. Adjust the set if any component is missing.
- Write the snapshot harness `tests/e2e/starter-snapshots.test.ts`. Confirm it can read `KIGUMI_STARTER` and `KIGUMI_STARTER_DIR` env vars and resolve fixture paths correctly.
- Add `package.json:scripts.test:starters` invocation.
- Run the harness locally for each framework with `--update` to seed initial fixtures. Commit `tests/fixtures/starter-snapshots/`.
- Add the `starters` job per the YAML in F-X3 above.
- Pre-step (manual, before pushing): `gh variable set STARTER_<F>_REF` for all four frameworks using the SHAs captured in Phase 0.
- Push the PR. Confirm all four starter lanes are green on the first run.
- Validate the negative paths from the Verification section: stray-space-in-template, broken-pin-bump, deliberate-template-change-with-update.
- Update the status dashboard: R row moves to SHIPPED with the PR link. Q2 row updated to SHIPPED if not already (carry-over).
- Add a CHANGELOG.md entry under Unreleased.

**Validation:** All four `starters` lanes pass on a clean PR. Each lane fails red on the relevant deliberate breakage. Status dashboard reflects R as SHIPPED.

**Session boundary:** One Claude Code session, possibly two if the snapshot harness needs more iteration than expected (the harness is the only part of R that touches new test infrastructure).

## Acceptance

- [ ] Phase 0 prerequisite PRs merged in all four starter repos.
- [ ] Phase 1 PR merged. `tests/fixtures/migration/` and `tests/integration/migration.test.ts` exist; `pnpm test:integration` passes.
- [ ] Phase 2 PR merged. `pack-test` job green on every PR.
- [ ] Phase 3 PR merged. `starters` 4-lane matrix green; `tests/fixtures/starter-snapshots/` committed.
- [ ] `vars.STARTER_REACT_REF`, `vars.STARTER_VUE_REF`, `vars.STARTER_ANGULAR_REF`, `vars.STARTER_NEXT_REF` set on `kigumi-cli` (verified via `gh variable list`).
- [ ] `package.json:scripts.test:starters` exists and runs locally against any framework via `KIGUMI_STARTER=<f> KIGUMI_STARTER_DIR=<path> pnpm run test:starters`.
- [ ] `scripts/update-starter-snapshots.ts` runs locally and produces a clean fixture diff after a deliberate template change.
- [ ] `docs/superpowers/state/test-infrastructure-hardening-status.md` shows R as SHIPPED with the Phase 3 PR link.
- [ ] `CHANGELOG.md` Unreleased section notes the new CI surface (starters matrix, pack-test, migration fixtures).
- [ ] Initiative acceptance criterion 10 satisfied: starter snapshot diff committed.

## Open Questions

- ❓ **Lifecycle: `add` only or also `init` + `add`?** Default: only `add`. The starters are pre-initialized; running init on top would either prompt or no-op, and the canonical user flow is "I have a starter, I add components." The init-on-empty-dir flow is covered by `pack-test` (F-X4). Reconsider if a future starter ships uninitialized.
- ❓ **Component set (10 components: button, input, select, dialog, card, badge, switch, textarea, tooltip, table).** Default: this set, Free-tier only across all 4 lanes. Pro-tier coverage deferred to a follow-up cluster (lands when WA Pro registry auth is wired into the matrix). Reconsider on every kigumi-cli minor release (curation review during release checklist).
- ❓ **Angular's `ng build` is a full prod build, slower than Vite's.** Default: accept the slower lane. The canonical Angular lifecycle is `ng build`; switching to a development build hides bundling and AOT regressions. Mitigate with `actions/cache` if runtime exceeds ~10 minutes per lane.
- ❓ **Pack-test framework: just react, or all four?** Default: react only. The `starters` matrix covers per-framework packaging implicitly (each lane runs the same `pnpm add -D file:..`). pack-test is the single-framework smoke that fails fast on tarball shape; per-framework duplication adds no signal.
- ❓ **Snapshot diff format: `toMatchFileSnapshot` or custom byte-diff?** Default: `toMatchFileSnapshot`. Native vitest support, native `--update` flag, native diff rendering. Custom byte-diff has no benefit for this use case.
- ❓ **Migration fixture coverage past 0.18.x and 0.19.x.** Default: deferred. The two fixtures bracket cluster-B's vestigial-surface drop, the most recent breaking schema change. Older shapes deferred to follow-up if a future cluster needs them.
- ❓ **Starter pin bump cadence: per-minor-release.** Default: confirmed (initiative-level default). Bumps happen as part of the release checklist; the release skill is updated to remind operators.
- ❓ **Pro-tier coverage as a follow-up cluster.** Open: when does Pro coverage become urgent enough to spin up its own cluster? Default: when a Pro-only component breaks in user-reported issues, or when the Pro starter (separate from `kigumi-next-starter`) returns. No fixed date.

## Pairs With

- **Cluster Q2 (CI completeness):** R is the heavyweight complement. Q2's inline-scaffolded matrix gives fast PR feedback (~2 to 3 min); R's `starters` matrix gives real-world coverage (~5 to 7 min). Both run on every PR after R ships. Q2 ships first because R extends Q2's tarball + smoke pattern; without F-048 as the analog, R's pack-test design would have to invent its own.
- **Cluster V (evidence layer):** Both raise CI confidence. V via mutation testing (correctness of the test suite); R via real-world end-to-end (correctness of generated output across published starters). Independent in execution; both can land in parallel after Q2 ships.
- **Cluster S (mock reduction), Cluster P (coverage rationalization):** R's `starters` job is the only test surface that touches the actual install path users follow. Mock-heavy unit tests stay mock-heavy; R adds a layer below them that asserts the real flow.
- **Cluster T (property-based + edge cases):** T's negative-path tests target each user-facing command including `upgrade`. F-X5's migration fixtures are positive-path; T's `upgrade` negative paths (corrupt config, missing fields, BOM) layer on top.

## Out of Scope (Defers to Other Clusters)

- Mutation testing -> Cluster V.
- Visual regression of the docs site -> Cluster S.
- Story `play()` interactions -> Cluster U.
- Property-based fuzz of `KigumiConfig` -> Cluster T.
- Migration shapes older than 0.18.x -> follow-up after R.
- Auto-bump of `STARTER_<F>_REF` (release-skill update; not part of R's CI surface).
- Pro-tier component coverage in CI -> follow-up cluster after Pro registry auth is wired into the `starters` matrix.
