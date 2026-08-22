# SPEC: Deterministic Guardrails, Clusters A + B + C

**Feature type:** Build/Infra (validator repair + CI enforcement)

**Status:** Specified, not implemented

**Initiative:** Deterministic Guardrails (24 clusters). This spec covers the
first three, which are the prerequisite for every later cluster.

## Overview

Kigumi has a deep automation layer: 9 `validate:*` scripts, 5 `check-*` scripts,
3 Claude hooks, husky pre-commit, 4 CI workflows. The problem is not missing
automation. It is that some checks are inert, and several validators run
nowhere automatically.

Three clusters fix the foundation:

- **A (Trust Repair)** removes two checks that cannot fire, and makes the script
  testable so that can never silently recur.
- **B (Parity Teeth)** gives `validate:parity` real error severities so it can
  fail, and clears the debt that would otherwise block the flip.
- **C (CI Wiring)** puts five validators in front of human PRs, not just Claude
  sessions.

Order is load-bearing: repairing the lying checks (A, B) must precede wiring
them into CI (C), or CI just becomes confidently wrong.

## The root-cause class

Both repaired bugs share one shape: **a validator that is structurally incapable
of failing**, reporting green for months.

- `validate-parity.ts:116` computes `passed` from
  `!findings.some(f => f.severity === 'error')`, while both emit sites
  (`:78-83`, `:105-110`) hardcode `severity: 'warning'`. No code path can ever
  produce an error, so `passed` is always `true`.
- `validate-changes.ts:291` matches `/className\s*=.*<wa-/`, which requires
  `<wa-` to appear _after_ `className=`. Real JSX is `<wa-button className={x}>`,
  so the tag comes first and the pattern has never matched anything.

Naming this class matters more than either individual fix: it is the failure
mode every later cluster must avoid.

## Measured baseline (2026-08-22, clean `main`)

| Validator                  | Result                          | In CI? |
| -------------------------- | ------------------------------- | ------ |
| `validate:changes`         | passes, 0 issues                | no     |
| `validate:stories`         | passes                          | no     |
| `validate:cem-sync`        | passes                          | no     |
| `validate:parity`          | passes, **57 warnings**, exit 0 | no     |
| `validate:agents`          | **FAILS**                       | no     |
| `validate:registry`        | passes                          | yes    |
| `validate:templates`       | passes                          | yes    |
| `validate:changesets`      | passes                          | yes    |
| `validate:generated-fresh` | passes                          | yes    |

Additional measurements:

- `.hide()` anti-pattern: 0 occurrences in `src/`.
- Corrected single-line `className` regex: 0 violations across
  `templates/`, `docs/src/`, `src/`.
- `className` occurrences in `templates/`: **336**. The real risk is multi-line
  JSX, which no line-based regex can see.
- Registry `files` completeness: react 84/84, angular 84/84, vue **27/84**.
- Template directories: 85 per framework, against 84 registry components.

## Findings that reshape the initiative's assumptions

1. **`validate:agents` fails on clean `main`.** `tests/AGENTS.md` omits
   `theme-install-local-source.test.ts`, which exists at
   `tests/unit/theme-install-local-source.test.ts`. This blocks Cluster C.

2. **`LOCAL_REGISTRY.files` has zero runtime readers.**
   `src/commands/add/installer.ts:153-159` builds the destination as
   `<componentsDir>/<name>/<fileName>.<ext>`, always nested, and never consults
   `component.files`. The registry's flat paths (`components/Button.tsx`) do not
   describe that. The consumers at `remote-installer.ts:83` and
   `remote-component-selector.ts:48` operate on `CommunityRegistry`, a different
   type whose `files` is an object of `component`/`css`/`test`/`extras`
   (`src/schemas/community-registry.ts:67`), not a string array.
   **Consequence:** the 57 parity gaps are documentation debt, not user-facing
   breakage. The backfill is still worth doing (it is what makes the gate
   flippable), but it fixes metadata, not behavior.

3. **Only `files.vue` is short.** The 57 gaps are exactly the missing vue
   entries. React and Angular are already complete.

4. **`validate-parity.ts` never scans Angular** (`:71`, `:91` iterate
   `['react','vue']`), which is why Angular completeness was never verified
   either way.

5. **`validate-changes.ts` is untestable.** `validateChanges` is not exported
   and `main()` runs unconditionally at `:426` with no `import.meta.url` guard,
   so importing it executes the script and calls `process.exit`.
   `validate-agents.ts` has the same defect.

6. **`validate:cem-sync` degrades partially, not fully.** `scripts/find-cem.ts`
   probes only Pro paths under `docs/node_modules`, so a tokenless run finds no
   CEM. But only `checkPropValueDrift` needs it (`validate-cem-sync.ts:209`
   returns early when the map is empty); `checkComponentPresence` reads the
   committed `COMPONENT_METADATA` and always runs.

7. **`tests/unit/validate-parity.test.ts:30-37` protects the debt.** It asserts
   `expect(gapFindings.length).toBeGreaterThan(0)`, so it passes only while the
   57 gaps exist. This is the same anti-pattern as `version-map.test.ts` pinning
   WA 3.5.0: a test asserting a stale value instead of an invariant.

8. **No shared validator helper exists.** All 9 validators define their own
   finding/result types. There is no `scripts/lib/`. Out of scope here, but
   relevant to later clusters.

9. **`validate-changes.ts` documents a `--fix` flag that does not exist.**
   `process.argv` is never read.

## Goals

- No check in scope can report green while being incapable of failing.
- `validate:parity` can fail, on a zero baseline, across all three frameworks.
- Five validators gate human PRs, each as its own named CI step.
- Every repaired check is covered by a test that fails when the check is
  neutered (bug-injection verified, not merely "tests pass").

## Non-goals

- Cluster E, the AST-based `class`/`className` ESLint rule. A defers to it
  rather than shipping a regex that repeats the original bug.
- Cluster J, tier sourcing. A only retires the dead `checkTierLogic` stub.
- Cluster Q, AGENTS.md freshness. C only fixes the one entry that blocks it.
- Clusters P and U, the live WA 3.5.0 version-map bug.
- Rewriting the hand-rolled `findFiles` in `validate-changes.ts:39-101`.
- Gating CEM prop-value drift on the Pro token in CI (follow-up, see C).
- A shared validator finding/reporter module.

## Affected scripts and pipelines

| File                                  | Cluster | Change                                                     |
| ------------------------------------- | ------- | ---------------------------------------------------------- |
| `scripts/validate-changes.ts`         | A       | Remove 2 dead checks, export + guard, extract pure matcher |
| `tests/unit/validate-changes.test.ts` | A       | New: table tests for surviving checks                      |
| `scripts/validate-parity.ts`          | B       | Severity per finding type, add Angular, document `files`   |
| `src/utils/registry.ts`               | B       | Backfill 57 `files.vue` entries                            |
| `tests/unit/validate-parity.test.ts`  | B       | Replace the debt-asserting test with a synthetic fixture   |
| `.github/workflows/ci.yml`            | C       | 5 new steps in the `quality` job                           |
| `tests/AGENTS.md`                     | C       | Add the missing test file entry                            |
| `scripts/validate-agents.ts`          | C       | Add the `import.meta.url` guard (polish)                   |

## Cluster A: Trust Repair

### Behavior changes

- The `className` anti-pattern is **removed**, not fixed. A corrected regex
  finds nothing, while the real exposure (336 `className` uses in templates,
  multi-line JSX) is invisible to any line-based pattern. Shipping a "working"
  regex here would ship false confidence. A comment points at Cluster E.
- `checkTierLogic()` is **deleted** along with its call site and its entry in
  the header `CHECKS:` list. An empty function that still executes and still
  appears in the docs reads as coverage that does not exist.
- The `.hide()` anti-pattern is **kept**. It has 0 current hits, so it is
  genuine prevention rather than remediation.
- `checkAntiPatterns` widens its glob from `src/**/*.ts` to include `.tsx`, so
  the surviving rule covers the surface it claims.

### Structural changes (the part that prevents recurrence)

- Export `validateChanges` and guard `main()` behind
  `process.argv[1] === fileURLToPath(import.meta.url)`, matching
  `validate-parity.ts:185`. Do this **first**, so every later edit lands under
  test.
- Extract the regex application into an exported pure function,
  `scanAntiPatterns(content, filePath): ValidationIssue[]`, leaving the
  filesystem walk as a thin shell. This is what makes the rule testable in
  isolation. A table test on this function would have failed against the
  backwards `className` regex on day one.

### Acceptance criteria

- [ ] `pnpm validate:changes` exits 0.
- [ ] `validateChanges` is importable without side effects.
- [ ] Table tests cover `.hide()`, mixed free/pro imports, and missing template
      variants, with both known-good and known-bad inputs.
- [ ] Bug injection: deleting the `.hide()` rule makes the test suite fail.
- [ ] Header no longer advertises `--fix`.

## Cluster B: Parity Teeth

### Behavior changes

- `registry-files-gap` and `orphaned-template` both become `severity: 'error'`.
  After the backfill there is no known debt in either category, so both are safe
  to gate from day one.
- Both loops (`:71`, `:91`) add `'angular'`.

### The backfill

57 `files.vue` entries are added to `src/utils/registry.ts` following the
existing convention `components/<Name>.vue`.

**Convention decision required:** four components (`Video`, `VideoPlaylist`,
`DatePicker`, `DateInput`) currently use a nested `components/<Name>/<Name>.vue`
shape, disagreeing with their own react siblings, which are uniformly flat.
Since finding 2 establishes that these paths describe nothing the local
installer actually does, the spec picks **flat** (`components/<Name>.vue`) for
consistency, and normalizes the four outliers in the same PR.

### Angular baseline caveat

85 template directories against 84 registry components means at least one
`orphaned-template` finding is likely once Angular is scanned. **Measure the
Angular baseline before flipping severity.** If it introduces new debt, that
debt is fixed in the same PR, or Angular findings stay `warning` behind an
explicit, documented carve-out. A fresh backlog must not ride in under a newly
strict gate.

### Test change

`tests/unit/validate-parity.test.ts:30-37` asserts that gaps exist, so the
backfill will break it. That is correct: the test protects the debt. Replace it
with a synthetic fixture (a component with an empty `files.vue`) so detection is
proven independently of live repo state.

### Acceptance criteria

- [ ] `pnpm validate:parity` exits 0 with **0 findings** across all three
      frameworks.
- [ ] Blanking one `files.vue` entry makes it exit 1.
- [ ] Adding an unregistered template directory makes it exit 1.
- [ ] The parity test suite passes without depending on live repo debt.
- [ ] The script header documents that `registry.files` is community-registry
      documentation metadata, not the local install path.

## Cluster C: CI Wiring

### Behavior changes

Five named steps append to the `quality` job after `ci.yml:156`, matching the
existing per-step style (`Validate Registry`, `Validate Templates`, ...):

```yaml
- name: Validate Changes
  run: pnpm run validate:changes

- name: Validate Stories
  run: pnpm run validate:stories

- name: Validate Parity
  run: pnpm run validate:parity

- name: Validate AGENTS.md
  run: pnpm run validate:agents

- name: Validate CEM Sync
  run: pnpm run validate:cem-sync
```

Individual steps rather than one `validate:all` call: the job already lists
validators discretely, so each failure gets its own red X in the GitHub UI. The
"auto-gates future clusters" argument for `validate:all` is real but weak, since
`&&` short-circuits and hides every failure after the first.

### Constraints

- **No `permissions:` block.** The `quality` job has none and inherits the
  workflow-level one. Job-level `permissions` _replace_ rather than merge, so
  adding a partial block would silently drop `contents: read` and break
  checkout. This is a documented past regression (PR #173).
- **No `pnpm build`.** All five validators run from source via `tsx`. The job
  has no build step today and needs none.
- **No Pro-token gating for cem-sync.** The script self-guards
  (`validate-cem-sync.ts:209`), and `checkComponentPresence` runs off committed
  metadata regardless. Adding the `Check Pro registry access` pattern would mean
  installing docs deps in `quality` for no correctness gain.
  **Follow-up:** the prop-value drift half stays ungated in CI. `docs-typecheck`
  already installs docs deps with the token and is the natural home. File as a
  separate cluster.

### Prerequisite fix

`tests/AGENTS.md` gains the missing `theme-install-local-source.test.ts` entry,
as its own commit inside the C PR so it can be reverted independently of the
CI-wiring diff. Optional polish while here: add the `import.meta.url` guard to
`scripts/validate-agents.ts`, which has the same defect as A fixed.

### Acceptance criteria

- [ ] All five steps green on a PR.
- [ ] Removing a line from `tests/AGENTS.md` turns exactly the AGENTS.md step
      red, and no other.
- [ ] No `permissions:` block added to `quality`.

## Risk: CI turning red on unrelated PRs

| Validator           | Risk            | Reasoning                                                                    |
| ------------------- | --------------- | ---------------------------------------------------------------------------- |
| `validate:changes`  | Low             | A strictly removes checks; strictly fewer findings than before               |
| `validate:stories`  | Low             | Passes today, no logic change                                                |
| `validate:cem-sync` | Low             | Passes today, degrades gracefully without a token                            |
| `validate:parity`   | **Medium**      | Newly able to fail; any PR touching `templates/` or the registry can trip it |
| `validate:agents`   | Low, once fixed | Fails today; C's prep commit clears it                                       |

**Sequencing is the mitigation.** B must be merged and green on `main` before C
gates parity. Re-run `pnpm validate:parity` on `main` immediately before merging
C: a template directory added between the two merges would otherwise surface as
a mysterious failure on an unrelated PR.

## Open questions

- Should the four nested `files.vue` paths be normalized to flat, or should the
  registry instead be corrected to describe real install paths (nested for every
  framework)? This spec picks flat-for-consistency on the grounds that the field
  describes nothing at runtime, but correcting it properly is defensible and
  would be a larger change touching react and angular too.
- Does the Angular scan surface an orphan (85 dirs vs 84 components)? Must be
  measured before B flips severity.
- Is the meta-check worth a cluster: statically flag any `scripts/validate-*.ts`
  whose failure predicate references a severity no emit site produces? It would
  have caught both bugs repaired here.
