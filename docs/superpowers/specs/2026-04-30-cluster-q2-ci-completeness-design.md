# Cluster Q2: CI Completeness - Specification

> Close the gap between "test paths exist" and "test paths run in CI on every PR". Adds Vue and Angular to the integration matrix, wires `pnpm test:e2e` into CI, makes `pnpm test:all` correct, hardens the release smoke test, and gives human contributors the same test-on-commit signal that Claude's stop-hook gives to AI sessions.

**Type:** Build/Infra
**Status:** Draft
**Author:** Mischa
**Date:** 2026-04-30
**Initiative:** [`test-infrastructure-hardening`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**F-IDs:** F-051, F-127, F-045, F-046, F-119, F-048, F-128
**Depends on:** Q1 (test foundation, PR #137)
**Blocks:** R (real-world starter e2e), U (story play interactions), V (evidence layer); the v0.20.0 ship gate
**Branched from:** `main` after PR #137 merges

## Overview

Cluster Q1 made `tests/**` first-class TypeScript and removed a misconfigured Storybook project that was silently failing to load. With those guardrails in place, the next set of gaps is one layer up: which test paths run, in CI, on every PR.

The current CI shape (`.github/workflows/ci.yml` on `main` after Q1):

| Job | Runs | Source of signal |
| --- | --- | --- |
| `quality` | lint, format:check, `tsc --noEmit` (raw, on `src/`), `typecheck:templates`, `check:tests` (Q1), `validate:registry`, `validate:templates` | type and structural correctness for `src/` and `tests/` |
| `test` | `test:coverage` (unit), `build` | unit-test signal + build success |
| `integration` | `test:integration` against React 18, React 19 | React starter integration |
| `chromatic` | Storybook visual regression on demand | pixel-level UI changes |

What is missing:

- **Vue and Angular never run.** Both ship as first-class frameworks and have known fragilities (Angular CSS forwarding, Vue defineModel patterns), yet the `integration` matrix is React-only. Template validation runs structurally; it does not build the generated starter.
- **e2e tests never run.** `tests/e2e/{smoke,diff}.test.ts` (268 lines) exercise the real path: scaffold a Vite project with `pnpm create vite`, install, run the built CLI, type-check, build. None of this runs in any workflow.
- **`pnpm test:all` is broken.** It uses the default `vitest.config.ts`, which inherits `testTimeout: 30000`; e2e tests need 300000. Contributors who run "all the tests" hit timeouts and lose trust in the script.
- **`tests/AGENTS.md` documents `pnpm test:all` as "unit and E2E"**, but the actual scope drifts from the doc.
- **CI's quality job calls `tsc --noEmit` directly** rather than `pnpm run type-check`. After Q1, `pnpm run type-check` runs three sub-checks (`tsc --noEmit`, `typecheck:templates`, `check:tests`); the raw call in CI duplicates the first while skipping the latter two if the script is later expanded. Drift waiting to happen.
- **CI also never type-checks `docs/`.** The local stop-hook does, so a `docs/src/stories/*.stories.tsx` type error is caught only by contributors who run the hook locally.
- **Release smoke test runs only `--version` and `list`.** A packaging regression (e.g., `templates/` missing from `package.json:files`) ships green because `init` and `add` are never invoked against the packed tarball.
- **Pre-commit hook runs no tests.** A commit that breaks a test passes pre-commit cleanly; the breakage surfaces only after push when CI runs. Bonus: `package.json:lint-staged` is currently `{}`, so even the lint+format half is a no-op despite `.husky/pre-commit` invoking `pnpm lint-staged`.

This cluster closes those seven gaps. It does not add new architectural test surface (R is the real-world starter e2e cluster; U adds `play()` to stories; V adds mutation testing). Q2 is purely "make the existing test surface visible in CI plus give humans the same fast-feedback signal as the AI stop-hook".

## Goals

- **Every test path that exists locally also runs in CI.** Unit, integration (React 18 + 19 + Vue + Angular), e2e: all green on every PR.
- **`pnpm test:all` does what `tests/AGENTS.md` says.** Sequential composition of the three subscripts, each with its correct config and timeout.
- **CI quality job routes through package scripts.** No raw `tsc --noEmit`. A docs/ typecheck step matches the local stop-hook coverage.
- **Release smoke test exercises the real install path.** `pnpm pack` plus a scratch project plus `kigumi init` plus `kigumi add` plus a file-existence assertion.
- **Pre-commit hook gives test signal.** lint-staged runs `vitest related --run` on staged `*.{ts,tsx}` files. Filling the empty config is the precondition.
- **No source-code changes in `src/`.** Only CI workflow files, package scripts, lint-staged config, and one doc file change.
- **No new dependencies at runtime or dev-time.** All tooling needed is already installed (vitest, husky, lint-staged, pnpm, GitHub Actions).

## Non-Goals

- **Cluster R's real-world starter matrix.** Q2's matrix expansion uses `kigumi init --framework <f> --non-interactive` to scaffold a starter inline inside the runner. R clones external starter repos (`kigumi-react`, `kigumi-vue`, `kigumi-angular`), pins commits, and runs the full install+build with the packed CLI tarball. Q2's lighter version is the substrate R extends.
- **Storybook play() interactions.** Cluster U's job. Q1 removed the misconfigured Storybook project from root vitest config; bringing it back per-framework is U.
- **Mutation testing, bug-bash regression suite, bug-injection acceptance gate.** Cluster V's job.
- **Mock reduction.** Cluster S's job.
- **Coverage rationalization (subprocess instrumentation, template-artifact denominator).** Cluster P's job.
- **Property-based tests, negative-path inventory.** Cluster T's job.
- **Adding `pnpm typecheck` script to the three external starter repos.** Tracked as F-X1 under Cluster R, executed against the external repos directly.
- **Pre-push hook (option B from F-128's KB).** Lint-staged on commit gives faster feedback per commit; pre-push as a follow-up if commits-without-tests prove insufficient.
- **Label gating for the e2e job (`run-e2e` label).** F-119's KB suggests this as a cost-control option. Q2 runs e2e on every PR; if CI minutes become a constraint, label-gate as a follow-up.

## API Surface

| File | Change Type | Description |
| --- | --- | --- |
| `package.json` `scripts.test:all` | Modified | `vitest run` to `pnpm run build && pnpm run test && pnpm run test:integration && pnpm run test:e2e`. The leading `build` is required because the e2e suite invokes `dist/index.js`; without it, e2e fails on a clean checkout. Each test subscript already has its correct config and timeout. (F-051, F-127) |
| `package.json` `lint-staged` | Modified | `{}` to `{ "*.{ts,tsx}": ["eslint --fix", "prettier --write", "vitest related --run"], "*.{js,jsx,json,md}": ["prettier --write"], "*.{vue,html,css}": ["prettier --write"] }`. Fills the no-op gap and adds test-on-commit. (F-128) |
| `tests/AGENTS.md` | Modified | Commands table entry for `pnpm test:all` updated to "Build + unit + integration + e2e (sequential, fail-fast)". Add a row for `pnpm test:e2e` if not already present. (F-127) |
| `.github/workflows/ci.yml` `quality.steps` | Modified | "TypeScript strict check" step changes from `npx tsc --noEmit` to `pnpm run type-check`. (F-045 Part A) |
| `.github/workflows/ci.yml` (new `docs-typecheck` job) | Created | New top-level job mirroring `chromatic`'s install pattern: checkout, setup pnpm/Node, configure Pro registry `.npmrc` for `docs/` (uses `secrets.WEBAWESOME_NPM_TOKEN`), install root deps, install `docs/` deps, run `pnpm exec tsc -p tsconfig.app.json` from `docs/`. Parallel with `quality`. (F-045 Part B) |
| `.github/workflows/ci.yml` `integration.strategy.matrix` | Modified | From `{ react-version: ['18', '19'] }` to `{ include: [ {framework: react, version: '18'}, {framework: react, version: '19'}, {framework: vue, version: '3'}, {framework: angular, version: '17'} ] }`. Steps switch behavior on `${{ matrix.framework }}`. (F-046) |
| `.github/workflows/ci.yml` (new `e2e` job) | Created | Builds the CLI, runs `pnpm test:e2e` on the runner. Single lane, no matrix, runs on every PR. (F-119) |
| `.github/workflows/release.yml` (new "Smoke test (scratch install)" step) | Created | After build + before `changeset publish`: `pnpm pack` to a tarball, install into a scratch project under `${RUNNER_TEMP}`, run `kigumi init --framework react --non-interactive` and `kigumi add button --yes`, assert the Button wrapper file exists at the path the CLI emits. (F-048) |
| `.husky/pre-commit` | No change | Already invokes `pnpm lint-staged && pnpm type-check`. Fix lands in `package.json:lint-staged`. |

## Pipeline Changes

### Today's CI shape (post-Q1, on `main`)

```
quality  : lint, format:check, tsc --noEmit, typecheck:templates, check:tests, validate:registry, validate:templates
test     : test:coverage, build
integration (matrix react: 18, 19) : test:integration
chromatic (conditional) : storybook + chromatic upload
```

### After Q2

```
quality        : lint, format:check, pnpm run type-check (= tsc + typecheck:templates + check:tests), validate:registry, validate:templates
docs-typecheck : (new) install docs/ deps with WA Pro registry auth, tsc -p tsconfig.app.json from docs/
test           : test:coverage, build
integration    : matrix include react@18, react@19, vue@3, angular@17 (per-framework starter scaffold + type-check)
e2e            : (new) build CLI, test:e2e
chromatic      : storybook + chromatic upload (conditional, unchanged)
```

CI runtime delta per PR (approximate, ubuntu-latest):

- `quality`: +5 to +10 seconds (Q1's `check:tests` step is now invoked twice via the chained `type-check` script; can be optimized in a follow-up by inlining the three calls).
- `docs-typecheck`: new job, ~45 seconds (mostly `cd docs && pnpm install`). Parallel with `quality` so no critical-path impact.
- `integration`: matrix grows from 2 to 4 lanes. Two new lanes (vue, angular) at ~2-3 minutes each, parallel with existing react lanes. Critical path unchanged.
- `e2e`: new lane, ~3 minutes (mostly `pnpm create vite` and `pnpm install`).
- Critical-path increase: roughly +3 minutes per PR (the e2e job, since vue, angular, and docs-typecheck run parallel to react and quality).

## Behavior & Edge Cases

### F-051 + F-127 (joint): `pnpm test:all` correctness

`pnpm test:all` becomes `pnpm run build && pnpm run test && pnpm run test:integration && pnpm run test:e2e`. The leading `build` step is required because the e2e suite invokes `dist/index.js` (the built CLI); without it, e2e fails on a clean checkout or after a `src/` change. CI's `integration` job already does this build inline (line 119 of `ci.yml`); making `test:all` match aligns local with CI.

Three test subscripts, three configs, three timeouts. Sequential because parallel needs vitest's projects feature, which would re-introduce the multi-config plumbing Q1 removed. Sequential is "three extra lines, no churn".

`tests/AGENTS.md` Commands table entry changes from "Both unit and E2E" to "Build + unit + integration + e2e (sequential, fail-fast)". The doc and the script now agree.

If a contributor runs `pnpm test:all` and the build fails, the script exits early. Same for any test subsuite. That is the desired fail-fast behavior; running e2e on top of a broken build wastes minutes.

### F-045 Part A (Phase 1): CI quality job uses package scripts

The `TypeScript strict check` step in the `quality` job changes from `npx tsc --noEmit` to `pnpm run type-check`. Post-Q1 that script runs three sub-checks (`tsc --noEmit`, `typecheck:templates`, `check:tests`); the existing `Type-check templates` and `Type-check tests` steps in the quality job become redundant.

Decision: keep the explicit `Type-check templates` and `Type-check tests` steps and let the `pnpm run type-check` step do its full chain anyway. Reasoning: separate steps give per-step failure signal in the GitHub Actions UI (a contributor sees "Type-check templates failed" instead of "type-check failed, which sub-step"). The 5 to 10 second redundancy buys clearer diagnostics. Optimization to inline the chain is a follow-up if CI minutes become tight.

### F-045 Part B (Phase 2): New `docs-typecheck` top-level job

`docs/` carries Storybook stories, MDX docs, and example components that depend on `@awesome.me/webawesome` (Free or Pro). The local stop-hook catches type errors there via `(cd docs && ./node_modules/.bin/tsc -p tsconfig.app.json)`, but CI does not. A new top-level `docs-typecheck` job mirrors `chromatic`'s install pattern because `docs/` resolves `@awesome.me/webawesome-pro` (paid):

```yaml
docs-typecheck:
  name: Type-check docs
  runs-on: ubuntu-latest
  steps:
    - Checkout
    - Setup pnpm
    - Setup Node.js (cached)
    - Configure Pro registry for docs
        # writes docs/.npmrc with secrets.WEBAWESOME_NPM_TOKEN, same shape as chromatic job lines 158-161
    - Install root dependencies (pnpm install --frozen-lockfile)
    - Install docs dependencies (cd docs && pnpm install --frozen-lockfile)
    - Type-check docs (cd docs && pnpm exec tsc -p tsconfig.app.json)
```

The job runs in parallel with `quality`. Critical-path increase: ~45 seconds (mostly the docs install). Mirrors the local stop-hook's invocation exactly: no `--noEmit` flag because `docs/tsconfig.app.json` already sets `noEmit: true`. Verified during plan review: `docs/tsconfig.app.json` exists at the expected path on `main` post-#137.

Auth-surface note: `WEBAWESOME_NPM_TOKEN` is already used by the `chromatic` job. The new `docs-typecheck` job reuses the same secret reference. No new secret. Same blast radius. Same `dependabot[bot]` exclusion may apply if the chromatic job's gating shape is borrowed (chromatic skips on dependabot PRs at line 129).

### F-046: Per-framework integration matrix

Matrix shape:

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - { framework: react,   version: '18' }
      - { framework: react,   version: '19' }
      - { framework: vue,     version: '3'  }
      - { framework: angular, version: '17' }
```

`fail-fast: false` so a Vue regression does not mask an Angular one in the same PR.

Per-framework lane behavior:

- **react@18, react@19**: existing `test:integration` invocation, scoped via `REACT_VERSION` env. No change to the test files.
- **vue@3, angular@17**: smallest-step per F-046's KB sketch. Each lane scaffolds a fresh starter via `kigumi init --framework <framework> --non-interactive`, adds one representative component (`button-group` exercises kebab-case + multi-word handling, guarding F-018 / F-025), then runs the starter's own type-check. No test execution. The starter's type-check is the gate.

Concrete shell for the new lanes (preceded by the existing `Build CLI: pnpm run build` step in the same job, which produces `dist/index.js` that the snippet invokes):

```bash
mkdir -p "$RUNNER_TEMP/q2-${{ matrix.framework }}"
cd "$RUNNER_TEMP/q2-${{ matrix.framework }}"
node "$GITHUB_WORKSPACE/dist/index.js" init --framework "${{ matrix.framework }}" --non-interactive
node "$GITHUB_WORKSPACE/dist/index.js" add button-group --yes
pnpm install
case "${{ matrix.framework }}" in
  vue)     pnpm exec vue-tsc --noEmit ;;
  angular) pnpm exec tsc --noEmit ;;
  react*)  echo "react lanes already covered by test:integration" ;;
esac
```

Vue uses `vue-tsc` (template type-checking), Angular uses raw `tsc`. Versions pin to the same defaults Kigumi's CLI emits today; if the CLI's emitted starter ships an `engines` constraint, honor it.

### F-119: e2e job

New top-level job in `ci.yml`:

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  steps:
    - Checkout
    - Setup pnpm
    - Setup Node (cached)
    - Install deps
    - Build CLI (pnpm run build)
    - E2E tests (pnpm run test:e2e)
```

The existing `pnpm test:e2e` script is unchanged (it already sets `--testTimeout=300000`). The job runs on every PR. If runtime becomes painful (~3 min per PR), label-gate via `run-e2e` as a follow-up. The acceptance gate is "e2e runs on every PR by default"; opt-out is the cost-control hatch.

### F-048: Release smoke test (scratch install)

New step in `release.yml`, sequenced after `pnpm build` and before `changeset publish`:

```bash
TARBALL=$(pnpm pack | tail -1)
SMOKE_DIR="$RUNNER_TEMP/kigumi-release-smoke"
mkdir -p "$SMOKE_DIR"
cd "$SMOKE_DIR"
npm init -y > /dev/null
npm i "file:$GITHUB_WORKSPACE/$TARBALL"
npx kigumi init --framework react --non-interactive
npx kigumi add button --yes
test -f src/components/ui/Button/Button.tsx || (echo "Button wrapper missing"; exit 1)
```

Note: the assertion path uses the documented Kigumi default `src/components/ui/`. Verify against the current `kigumi init` defaults during plan execution; if the default path differs, update the assertion accordingly.

If this step fails, the publish does not run. The intended catch is "packaging bug shipped to npm" of the form `templates/` missing from `package.json:files` or a `bin/` entry pointing at a stale path.

### F-128: lint-staged config

Filling `package.json:lint-staged`:

```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "vitest related --run"
  ],
  "*.{js,jsx,json,md}": [
    "prettier --write"
  ],
  "*.{vue,html,css}": [
    "prettier --write"
  ]
}
```

`vitest related --run <files>` invokes the root vitest config (post-Q1, that is unit + e2e discovery without integration). Trade-off: integration-related tests do not fire on commit; they fire in CI. Acceptable: the goal is fast feedback, not exhaustive coverage. Most regressions touch unit tests of nearby utilities.

If `vitest related --run` proves slow on broad refactors (touching files that map to many tests), the fallback is per-staged-file scoping: `vitest related <file>` per file, which lint-staged already does by appending staged files to the command. Verify behavior in the plan execution; adjust syntax if needed.

The `prettier --write` entries use the same configuration as the existing `format` script; no new prettier config.

## Dependencies

- [x] Cluster Q1 (PR #137) merged. Q2 needs the strict `pnpm check:tests` gate and the storybook-removed root vitest config to be the baseline.
- [ ] No source-code dependencies on Cluster A or any architectural cluster.

## Breaking Changes

None at the consumer level. Only CI signal and contributor workflow change.

For contributors:

- `pnpm test:all` becomes correct (was effectively broken before). Behavior change is "less surprising", not a removal.
- `git commit` now runs `vitest related --run` on staged `*.{ts,tsx}` files. Adds 5 to 30 seconds depending on scope. Document in `tests/AGENTS.md` under "Local pre-commit signal".
- CI runs more lanes per PR; expect new "Vue", "Angular", and "E2E" jobs to appear in the GitHub PR check list.

For release ops:

- `release.yml` runs a real install smoke test. If the smoke fails on a tagged release, publish is blocked. Recovery: fix the underlying packaging bug, re-tag.

## Verification

After Q2 ships (one PR):

- [ ] `.github/workflows/ci.yml` `integration` job has 4 matrix lanes (react@18, react@19, vue@3, angular@17) and the Vue and Angular lanes pass against a deliberate Angular template breakage on a scratch branch (Angular lane red, others green); revert and confirm all four pass.
- [ ] `.github/workflows/ci.yml` `e2e` job runs and passes on every PR. Deliberately changing the expected stdout in `tests/e2e/smoke.test.ts` on a scratch branch fails the e2e job; revert and confirm green.
- [ ] `.github/workflows/release.yml` smoke step runs after build, before publish. Deliberately removing `templates` from `package.json:files` on a scratch tag fails the smoke; revert and confirm green.
- [ ] `pnpm test:all` runs unit, then integration, then e2e, exits 0 on a clean tree, and exits non-zero if any subsuite fails. `tests/AGENTS.md` documents this.
- [ ] CI quality job's `TypeScript strict check` step calls `pnpm run type-check`. Adding a deliberate type error in `docs/src/stories/Button.stories.tsx` on a scratch branch fails the new `docs-typecheck` job; revert and confirm green.
- [ ] `git commit` on a branch that touches `src/utils/tier.ts` runs `vitest related --run` and includes `tests/unit/tier.test.ts`. Breaking `tier.test.ts` blocks the commit; restoring it unblocks.
- [ ] `package.json:lint-staged` is non-empty and applies prettier to `*.{js,jsx,json,md,vue,html,css}` plus eslint+prettier+vitest related to `*.{ts,tsx}`.
- [ ] Status dashboard at `docs/superpowers/state/test-infrastructure-hardening-status.md` shows Q2 row moved to SHIPPED with the PR link, and R / U / V dependency-on-Q2 entries continue to show BLOCKED until Q2 ships (then transition to PLANNED for R, remain BLOCKED on Q1+Q2 for U and V which require additional clusters).

## Risks

| Risk | Mitigation |
| --- | --- |
| Vue or Angular lane fails on first run because `kigumi init --non-interactive` defaults differ from what the lane assumes (e.g., `src/components/ui/` vs `src/components/`). | Phase 2 first task: scaffold each framework locally with `--non-interactive`, snapshot the resulting paths, and pin the lane's assertions to the actual defaults. |
| `vitest related --run` triggers slow runs on broad refactors (touching shared utilities mapped to many tests). | Document the fallback (`HUSKY=0 git commit ...` for emergencies); revisit if commits routinely take >60s. Lint-staged already scopes to staged files, so the worst case is bounded by staged-file count. |
| `pnpm pack` on the release runner produces a tarball that resolves dev-only paths (e.g., absolute paths from `tsup` output). | Smoke test runs from `npm i file:<tarball>`, which is the same install shape end-users hit. If absolute paths leak, they leak the same way for users; the smoke test catches it before publish. |
| The new `e2e` job adds ~3 minutes to the critical path per PR. | Acceptable given the safety value (e2e is the only path that builds a real Vite project). If CI minutes become tight, label-gate behind `run-e2e` as a follow-up. |
| Q1's `pnpm run type-check` chain runs `check:tests` twice in the quality job (once via the type-check step, once via the existing standalone step). | Keep the redundancy for clearer per-step failure signal in the Actions UI. Inline the chain in a follow-up if CI minutes warrant. |
| Angular version pin (`17`) drifts from the version the CLI's `kigumi init --framework angular` emits. | Phase 2 first task: read the version Kigumi pins for Angular starters and align the matrix. If the CLI emits a range, pick the highest LTS at land time and document the policy ("matrix tracks the highest LTS we ship"). |
| F-046's `button-group` slug may not exist in the registry on Vue or Angular. | Phase 2 verification: run `node dist/index.js list --framework vue` (and angular) on a scratch branch, pick a multi-word component that ships in all four matrix frameworks. Update the lane's `kigumi add` argument accordingly. |
| New `docs-typecheck` job uses `WEBAWESOME_NPM_TOKEN`, expanding token usage from one job (chromatic) to two. | Same secret, same blast radius, no new credential. If the security model evolves to per-job tokens, both jobs migrate together. |
| `docs/tsconfig.app.json` lacks `noEmit: true`, causing the docs typecheck job to write build artifacts under `docs/`. | Phase 2 first task on F-045 Part B: confirm `noEmit: true` is set in `docs/tsconfig.app.json`. If absent, set it (one-line fix) so the local stop-hook and CI both stay clean. |

## Implementation Phases

All phases ship under one cluster branch (`ft/cluster-q2-ci-completeness`) and one PR. The phase decomposition is for plan execution, not separate sub-PRs.

### Phase 1: Script and doc alignment (F-051, F-127, F-045 Part A)

**Files:** `package.json` (`scripts.test:all`), `tests/AGENTS.md` (Commands table), `.github/workflows/ci.yml` (quality job: type-check step routing).

- Change `scripts.test:all` from `vitest run` to `pnpm run build && pnpm run test && pnpm run test:integration && pnpm run test:e2e`.
- Update `tests/AGENTS.md` Commands table entry for `pnpm test:all` to "Build + unit + integration + e2e (sequential, fail-fast)".
- Change `ci.yml` quality job's `TypeScript strict check` step from `npx tsc --noEmit` to `pnpm run type-check` (F-045 Part A).
- Run `pnpm test:all` locally on a clean tree (`pnpm clean && pnpm install`); confirm build, sequential composition, and full pass.
- Run `pnpm run type-check` locally; confirm three sub-checks fire.

**Validation:** Local `pnpm test:all` exits 0 on a clean tree. CI quality job on a scratch phase-1 branch shows the renamed step calling the package script. No new CI lanes yet.

### Phase 2: New CI surfaces (F-046, F-119, F-048, F-045 Part B)

**Files:** `.github/workflows/ci.yml` (`integration.strategy.matrix` and steps; new `e2e` job; new `docs-typecheck` job), `.github/workflows/release.yml` (new smoke step), possibly `docs/tsconfig.app.json` (one-line `noEmit: true` if absent).

- Confirm `noEmit: true` is set in `docs/tsconfig.app.json`. If absent, add it.
- Add `docs-typecheck` job mirroring chromatic's install pattern: setup pnpm, setup Node, configure Pro registry `.npmrc` for `docs/`, install root deps, install `docs/` deps, run `pnpm exec tsc -p tsconfig.app.json` from `docs/` (F-045 Part B).
- Snapshot `kigumi init --framework <f> --non-interactive` defaults locally for vue and angular. Note assertion paths for the matrix lanes.
- Verify a multi-word component slug (start with `button-group`) exists in all four framework registries via `node dist/index.js list --framework <f>`. Pick a fallback if needed.
- Convert `integration.strategy.matrix` from React-only to the 4-lane include shape with `fail-fast: false`.
- Add per-framework conditional steps (vue uses `vue-tsc`, angular uses `tsc`, react keeps existing `test:integration`).
- Add `e2e` job (new top-level entry, alongside `quality`, `test`, `integration`, `chromatic`).
- Add release-smoke step in `release.yml` after build, before publish. Use a scratch directory under `$RUNNER_TEMP`. Pin the file-existence assertion to whatever path `kigumi init` actually emits (verified during Phase 2 task 1 via the local snapshot).
- Validate by deliberately breaking each new lane on a scratch branch (Vue template, Angular template, e2e expected stdout, release packaging, docs story type) and confirming the corresponding CI signal goes red.

**Validation:** All 4 integration lanes plus the new `e2e` and `docs-typecheck` jobs pass on a clean PR. Each lane fails red on a deliberate breakage of its specific surface.

### Phase 3: Local fast-feedback (F-128)

**Files:** `package.json` (`lint-staged` config).

- Fill `lint-staged` config with the three glob entries (`*.{ts,tsx}`, `*.{js,jsx,json,md}`, `*.{vue,html,css}`).
- Stage a deliberate test-breaking change to `src/utils/tier.ts` and confirm `git commit` runs `vitest related --run` against `tests/unit/tier*.test.ts`.
- Confirm prettier and eslint both fire on staged `.ts` files.
- Document the new pre-commit behavior in `tests/AGENTS.md` if not already covered.

**Validation:** `git commit -m 'test'` on a branch that touches `*.ts` files runs eslint, prettier, and vitest related. Failures block the commit. `HUSKY=0 git commit` bypasses (documented escape hatch).

## Acceptance

- [ ] `package.json:scripts.test:all` is `pnpm run build && pnpm run test && pnpm run test:integration && pnpm run test:e2e`.
- [ ] `package.json:lint-staged` is non-empty with the three glob entries (`*.{ts,tsx}`, `*.{js,jsx,json,md}`, `*.{vue,html,css}`).
- [ ] `tests/AGENTS.md` Commands table accurately reflects `pnpm test:all` behavior including the build prerequisite.
- [ ] `.github/workflows/ci.yml` quality job's `TypeScript strict check` step calls `pnpm run type-check`.
- [ ] `.github/workflows/ci.yml` has a new `docs-typecheck` job that installs `docs/` deps with WA Pro registry auth and runs `tsc -p tsconfig.app.json` from `docs/`.
- [ ] `.github/workflows/ci.yml` integration job has 4 matrix lanes (react@18, react@19, vue@3, angular@17) with `fail-fast: false`.
- [ ] `.github/workflows/ci.yml` has a new `e2e` job that runs `pnpm run test:e2e` on every PR.
- [ ] `.github/workflows/release.yml` has a real-install smoke step that runs after build and before publish.
- [ ] All Phase 2 lanes pass on a clean PR; each fails red on a deliberate breakage.
- [ ] Status dashboard at `docs/superpowers/state/test-infrastructure-hardening-status.md` shows Q2 row moved to SHIPPED with the PR link, and R row moved to PLANNED. R extends Q2's lighter inline-scaffolded matrix to cloned external starter repos rather than replacing it.
- [ ] PR description documents the runtime delta per PR (approximate: +3 minutes critical path) and the rationale for keeping the `Type-check templates` / `Type-check tests` steps redundant with the chained `type-check` script.

## Open Questions

- ❓ **Angular version pin in the matrix.** Use `17` (current LTS at time of writing) or read from the CLI's emitted `package.json` and pin to whatever Kigumi ships? Default: read at land time, pin to that, document the policy. Reconsider on every Kigumi major release.
- ❓ **Vue version pin.** Same question. Default: `3`, since Vue 2 is end-of-life and Kigumi only emits Vue 3.
- ❓ **`button-group` as the multi-word probe component.** Does it ship in all four framework registries? Default: verify via `node dist/index.js list --framework <f>` on a scratch branch during Phase 2 task 1; fall back to whichever multi-word slug is universally available.
- ❓ **Inline the chained `type-check` script in CI.** Today the quality job runs `tsc`, `typecheck:templates`, and `check:tests` as three explicit steps; Phase 1 routes the first through `pnpm run type-check` which itself runs all three. Keep the three separate steps for failure-signal clarity, or collapse to one chained step? Default: keep separate for clearer per-step UI signal; revisit if CI minutes warrant.
- ❓ **Pre-push hook (option B from F-128's KB).** Add husky `pre-push` running full `pnpm test`? Default: not in Q2; lint-staged on commit is fast feedback, pre-push duplicates CI signal at higher latency. Revisit if commits-without-tests still cause CI surprises after Q2 ships.
- ❓ **`docs-typecheck` job gating shape.** Should the new job inherit chromatic's gating (`if: github.actor != 'dependabot[bot]' && github.event.pull_request.draft != true` and the `paths-filter` for visual changes)? Default: no draft gate (type errors should block draft PRs too, unlike chromatic's pixel snapshots); skip for dependabot bumps to avoid noise; no paths-filter (typecheck is cheap enough to run on every PR).

## Pairs With

- **Cluster R (real-world starter e2e + snapshot diff)** - extends F-046's matrix from inline-scaffolded starters to cloned external starter repos, and extends F-048's release smoke into a multi-starter pack-test job. Q2 ships the lighter version; R extends.
- **Cluster U (story play interactions)** - depends on Q2 because U adds `play()` functions to stories and needs the integration lanes to be green per-framework before story behavior can be asserted on top.
- **Cluster V (evidence layer)** - depends on Q2 because V's mutation testing runs against the full test surface; Q2 ensures that surface is exercised in CI.
- **Cluster A (config lifecycle hardening)** - independent of Q2, no ordering constraint. A can land before, after, or in parallel.

## Out of Scope (Defers to Other Clusters)

- F-122, F-124, F-120, F-123, F-121, F-125 (coverage rationalization) - **Cluster P**.
- F-126 (mock reduction) - **Cluster S**.
- F-X1 through F-X5 (3-starter matrix, pack-test, migration fixtures, snapshot diff) - **Cluster R**.
- F-X6 through F-X9 (property-based, edge cases, concurrency, failure modes) - **Cluster T**.
- F-129 (story play() functions) - **Cluster U**.
- F-X10 through F-X12 (mutation testing, bug-bash regression, bug-injection acceptance) - **Cluster V**.
