# Test Infrastructure Hardening — Live Status

**Last updated:** 2026-05-03
**Initiative spec:** [`docs/superpowers/initiatives/2026-04-28-test-infrastructure-hardening.md`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**Active cluster:** S (mock reduction; PR-S1 #147 merged, PR-S2 #148 merged, PR-S3 draft) - P shipped
**Active spec:** [`docs/superpowers/specs/2026-05-02-cluster-s-mock-reduction-design.md`](../specs/2026-05-02-cluster-s-mock-reduction-design.md) (P spec preserved at [`2026-05-01-cluster-p-coverage-rationalization-design.md`](../specs/2026-05-01-cluster-p-coverage-rationalization-design.md))
**Active plan:** _(local working plan only; gitignored at `.claude/plans/`)_
**Local 2nd brain dashboard (private):** `~/.claude/projects/-Users-giregar-Documents-dev-git-kigumi-cli/memory/project-test-infrastructure-hardening.md` _(seeded by user after this PR merges)_

---

## PR

This bootstrap PR: _(filled in after `gh pr create`)_

Per-cluster PRs: tracked in the status table below as each cluster ships.

---

## Cluster Status Table

| Cluster | Codename                                                | Primary F-IDs                                   | Depends on                       | Status          | PR                                       | Spec                                                                       | Plan                |
| ------- | ------------------------------------------------------- | ----------------------------------------------- | -------------------------------- | --------------- | ---------------------------------------- | -------------------------------------------------------------------------- | ------------------- |
| **Q1**  | Test foundation                                         | F-132, F-050, F-052                             | -                                | **SHIPPED**     | #137                                     | [Q1 spec](../specs/2026-04-29-cluster-q1-test-foundation-design.md)        | _accumulated in PR_ |
| **Q2**  | CI completeness                                         | F-046, F-119, F-127, F-051, F-048, F-128, F-045 | Q1                               | **SHIPPED**     | #138                                     | [Q2 spec](../specs/2026-04-30-cluster-q2-ci-completeness-design.md)        | _accumulated in PR_ |
| **R**   | Real-world starter e2e (+ snapshot diff)                | F-X1, F-X2, F-X3, F-X4, F-X5 (NEW)              | Q2                               | **SHIPPED**     | #139, #140, #141                         | [R spec](../specs/2026-04-30-cluster-r-real-world-starter-e2e-design.md)   | _local_             |
| **S**   | Mock reduction                                          | F-126 (full)                                    | Q1                               | **IN-PROGRESS** | #147 (PR-S1), #148 (PR-S2), #150 (PR-S3) | [S spec](../specs/2026-05-02-cluster-s-mock-reduction-design.md)           | _local_             |
| **P**   | Coverage rationalization                                | F-122+F-124 (pair), F-120, F-123, F-121, F-125  | Q1                               | **SHIPPED**     | #143, #144, #145, #146                   | [P spec](../specs/2026-05-01-cluster-p-coverage-rationalization-design.md) | _local_             |
| **T**   | Property-based + edge cases (+ negative-path inventory) | F-X6, F-X7, F-X8, F-X9 (NEW)                    | Q1 (+ Cluster A for `.strict()`) | **BLOCKED**     | _pending_                                | _pending_                                                                  | _pending_           |
| **U**   | Story `play()` interactions                             | F-129                                           | Q1, Q2                           | **BLOCKED**     | _pending_                                | _pending_                                                                  | _pending_           |
| **V**   | Evidence layer (mutation, bug-bash, bug-injection)      | F-X10, F-X11, F-X12 (NEW)                       | Q1, Q2                           | **BLOCKED**     | _pending_                                | [V spec](../specs/2026-04-29-cluster-v-evidence-layer-design.md)           | _pending_           |

**Status legend:**

- **PLANNED** — spec exists; cluster is unblocked; ready for a session to start the working plan + execution.
- **IN-PROGRESS** — a session is actively working on the cluster.
- **BLOCKED** — at least one dependency cluster is not yet SHIPPED.
- **SHIPPED** — PR merged to `main`; cluster's acceptance criteria met.

---

## Current Cluster: Q1 — Test Foundation

**State:** Bootstrap PR ships the structure (this dashboard, the initiative doc, the Q1 spec, and the V spec). Q1 implementation has not yet started.

### Next Action

Open a new session, load the initiative doc + this status file, and request a Q1 working plan. The plan lands at `.claude/plans/2026-04-XX-cluster-q1-plan.md` (gitignored per CLAUDE.md). Q1's spec is a complete design — the plan translates it into actionable per-phase steps with test gates.

The Q1 spec adopts the hybrid baseline approach: land `tsconfig.tests.json` + `pnpm check:tests` script + baseline allowlist of the existing 132 errors first (Phase 1), then chunked fixes across follow-up sub-PRs within the cluster (Phase 4). F-050 (storybook configDir) and F-052 (lint scope) are smaller phases (2 and 3) that can ship in the same Phase-1 PR if convenient.

### Decisions Captured This Session (Bootstrap)

The bootstrap session that created this dashboard captured four user decisions about scope:

1. **Release shape** — No 0.19.3 patch, no rc/prerelease channel. Solo-user context; ship 0.20.0 directly when the safety net is green. Breaking changes are acceptable with upgrade docs.
2. **Next.js scope** — `kigumi-next` is skipped for v0.20.0. The starter has no GitHub remote and uses `webawesome-pro` (paid). Bundled `next-app{,-no-src,-pages}` skeletons in `tests/integration/` carry Next.js coverage for now. Push the starter and add it to the matrix as own follow-up.
3. **F-126 mock reduction scope** — Full reduction. Drive `grep -rn 'vi\.mock' tests/unit | wc -l` below 50; heaviest file (`theme-commands.test.ts` at 38 mocks) below 10.
4. **Spec/plan structure** — Three-tier: initiative doc (stable), per-cluster specs (one-per-PR), per-cluster working plans (gitignored). Plus this state-file dashboard as the public mirror. The user's local 2nd brain holds decisions log + cross-cluster learnings + per-cluster session notes.

### Decisions Captured Mid-Plan (Evidence Layer Addition)

After the initial draft, the user pushed back: "ich brauche keine annahmen. ich will belege" — I don't need assumptions, I want evidence. The plan was extended with Cluster V (evidence layer: mutation testing, bug-bash regression suite, bug-injection acceptance gate) and extensions to Cluster R (snapshot-diff of generated output) and Cluster T (negative-path inventory per command). The initiative-level acceptance criteria grew from 7 to 12 items.

---

## Open Questions (Initiative-Wide)

These are tracked here so future cluster sessions know which ones need the user's call before locking in cluster-specific specs. Not blocking the bootstrap PR.

- ❓ **For Cluster R**, should `pnpm typecheck` PRs to the 3 starter repos go through the kigumi-cli initiative session or be 3 separate one-off PRs? Default: 3 small PRs from the kigumi-cli session (mechanical 1-line `package.json` change per starter).
- ❓ **For Cluster R**, pinned starter commits — bump cadence: quarterly, on every kigumi-cli minor release, or never (frozen forever)? Default: bump on every kigumi-cli minor release as part of the release checklist.
- ❓ **For Cluster T**, fast-check seed strategy in CI: pin to a fixed seed for reproducibility, or randomize and accept occasional discovery failures? Default: pin in CI (`fc.configureGlobal({ seed: 1 })`), randomize locally for discovery.
- ❓ **For this dashboard**, should it remain public (here, in the repo) or also have a private mirror in 2nd brain? Default: dual — repo state file is the source of truth for status; 2nd brain dashboard accumulates richer context (decisions log + learnings + per-cluster session notes).

---

## Phase Log (across clusters)

### Phase 0: Bootstrap — IN PROGRESS

This bootstrap PR ships:

1. `docs/superpowers/initiatives/2026-04-28-test-infrastructure-hardening.md` — initiative overview.
2. `docs/superpowers/specs/2026-04-29-cluster-q1-test-foundation-design.md` — Cluster Q1 spec (test foundation).
3. `docs/superpowers/specs/2026-04-29-cluster-v-evidence-layer-design.md` — Cluster V spec (evidence layer).
4. `docs/superpowers/state/test-infrastructure-hardening-status.md` — this file.

Out of scope for the bootstrap (handled by the user locally or in subsequent sessions):

- Specs for Q2 / R / S / P / T / U (each lands in its own session).
- Working plans for any cluster (live in `.claude/plans/`, written when each cluster session begins).
- F-ID registration in `~/.claude/projects/kigumi-cli-overview.md` (2nd brain; user adds the 9 new IDs from R + T + V locally).
- 2nd brain memory seed files (dashboard mirror, decisions log, learnings, per-cluster notes — user seeds locally after this PR merges).
- Updates to `AGENTS.md` describing the new `initiatives/` directory convention (deferred until Q1 ships so the convention has a live example to reference).

### Phase 1: Q1 — SHIPPED 2026-04-30

Test foundation shipped in PR #137. Foundation (Phases 1-3+5) and Phase 4 chunks A-H all accumulated in one PR, sequential commits on `ft/cluster-q1-test-foundation`.

Phase 4 chunk trajectory (pattern-grouped):

- Chunk A (P1, OutputInterface): -30 baseline (133 to 103). New helper `tests/unit/_helpers/output.ts`.
- Chunk B (P2a, AddOptions, add-command + component-installer): -30 (103 to 73). New helper `tests/unit/_helpers/add-options.ts`.
- Chunk C (P2b, AddOptions, remote-installer family): -21 (73 to 52).
- Chunk D (P3, KigumiConfig + registry-cache): -15 (52 to 37). New helper `tests/unit/_helpers/kigumi-config.ts`.
- Chunk E (P4, ProjectInfo): -8 (37 to 29).
- Chunk F (P5, mock.calls filter/find callbacks): -17 (29 to 12).
- Chunk G (tail P6+P7+P8+P9): -12 (12 to 0).
- Chunk H (cleanup): retired `tests/.tsc-baseline.json`; `tests/AGENTS.md` Type-Checking Tests section pruned to strict-gate state.

Final baseline: 0 (file deleted). The `pnpm check:tests` gate is now strict.

**F-050 partial resolution:** the storybook project block was removed from root `vitest.config.ts` because its required deps (`@storybook/addon-vitest`, `playwright`) live in `docs/package.json` and could never load from root — so the `configDir` fix was the wrong layer. The Q1-spec acceptance criterion "all 75 stories render without crash" therefore defers to **Cluster U**, which owns standing up the per-framework vitest-storybook integration where those deps actually live.

### Phase 2: Q2 — SHIPPED 2026-04-30

CI completeness shipped in PR #138. Vue and Angular added to the integration matrix, e2e and docs-typecheck jobs added, release smoke step in `release.yml`, lint-staged filled, `pnpm test:all` made sequential.

### Phase 3: Cluster R — SHIPPED 2026-04-30

Real-world starter e2e (4-lane matrix: react/vue/angular/next) plus snapshot diff plus pack-test plus migration fixtures. Landed across three PRs:

- **R Phase 1** (#139, SHIPPED): migration fixture suite (`tests/fixtures/migration/{0.18.x,0.19.x}-config.json` + `tests/integration/migration.test.ts`).
- **R Phase 2** (#140, SHIPPED): per-PR `pack-test` job in `ci.yml`.
- **R Phase 3** (#141, SHIPPED): `starters` 4-lane matrix in `ci.yml`, `tests/e2e/starter-snapshots.test.ts` harness, `tests/fixtures/starter-snapshots/{react,vue,angular,next}/`, `scripts/update-starter-snapshots.ts`, `pnpm test:starters` + `pnpm update:starter-snapshots`.

Phase-0 prerequisites (typecheck script + Pro->Free migration on `kigumi-next-starter`) merged in the four starter repos before #141 opened. The four `STARTER_<F>_REF` variables are pinned to those merge commits. `kigumi-next-starter` started private and was flipped to public during the cluster R session, so the matrix lanes clone the four `kigumi-ui` starters without authentication.

R extends initiative scope from 3 to 4 starters. Pro-tier coverage is deferred to a separate follow-up cluster.

### Phase 4: Parallel work — IN PROGRESS

After R shipped, S/P/T/U opened up. Status by sub-cluster:

- **P (coverage rationalization):** SHIPPED 2026-05-02. Four PRs landed (#143, #144, #145, #146); see Phase 4-P below for the close-out summary.
- **S (mock reduction):** IN-PROGRESS. Spec at [`2026-05-02-cluster-s-mock-reduction-design.md`](../specs/2026-05-02-cluster-s-mock-reduction-design.md). Four sequential PRs. PR-S1 (#147, merged) landed the seam pattern + theme-commands proof point (37 -> 1 substring matches). PR-S2 (#148, merged) extended the pattern to update / upgrade / diff command tests (total tests/unit 203 -> 198). PR-S3 (#150, draft) extends the pattern to 21 remaining command + utility tests plus 13 prod-side import swaps (total tests/unit 198 -> 104). PR-S4 will flip the budget gate to enforce once total < 50, after addressing the three test files the cluster S spec listed in PR-S3 scope but PR-S3 deferred (`remote-installer.test.ts`, `init-file-generator.test.ts`, `registry-router.test.ts`; ~26 substring matches combined). Runs in parallel with P (no file overlap).
- **T (property-based + edge cases):** BLOCKED on cluster A (`.strict()` adoption).
- **U (story `play()` interactions):** unblocked but spec not yet written.

### Phase 4-P: Cluster P — SHIPPED 2026-05-02

Coverage rationalization shipped across four sequential PRs on `ft/cluster-p-phase-{1..4}`.

- **PR-P1** (#143): F-122 + F-124a/b/c (paired). Excluded runtime artifacts (templates, test fixtures, generated metadata) from the unit-only coverage denominator. Propagated `NODE_V8_COVERAGE` through `runKigumi` and the e2e execa sites so subprocess coverage attaches. Added a merged `coverage:all` harness so unit + e2e + integration aggregate cleanly. No threshold raise yet (the gate stayed where it was).
- **PR-P2** (#144): F-120 + F-123. New unit tests for `src/utils/registry.ts` and the `add` command's `buildSelectorChoices` (extracted for testability). Thresholds raised to 80/70/84/80.
- **PR-P3** (#145): F-121. Extended unit coverage on `src/commands/init/index.ts` (16% to 81% lines) by promoting and testing `validateAndPrepare`, `showPostInstallInstructions`, `handleTierMigration`, and `file-generator.ts`. Thresholds raised to 85/75/86/85 (the final number).
- **PR-P4** (#146): F-125. Snapshot-pinned the three template generators (`scripts/generate-{react,vue,angular}-templates.ts`) and the changeset post-processor (`scripts/post-changeset-version.ts`). Added `tests/unit/scripts/{react,vue,angular,post-changeset}.test.ts` (34 tests, 18 snapshots) using inline `LOCAL_REGISTRY.button` / `LOCAL_REGISTRY.badge` / `LOCAL_REGISTRY.switch` fixtures. Extended `vitest.unit.config.ts` `coverage.include` to bring the four scripts into the unit-only gate at ≥70% per file. Mutation sanity: a deliberate regression in each generator flips the corresponding Button (or Switch) snapshot — recorded in the #146 description.

Acceptance gates closed:

- Spec line 375: four scripts ≥ 70% line coverage in `pnpm test:coverage` (React 70.4 / Vue 73.0 / Angular 73.1 / post-changeset 82.3) ✅
- Spec line 376: deliberate regression flips snapshot red — verified for all three generators ✅
- Threshold trajectory: no raise (#143) → 80/70/84/80 (#144) → 85/75/86/85 (#145) → unchanged (#146) ✅

Side effect: #146 surfaced two latent bugs in `scripts/generate-angular-templates.ts` (`getEvents` and `getMethods` accessed `e.type?.text` / `p.type?.text` against a flat-string metadata shape, so all Angular events were emitted as `EventEmitter<CustomEvent>` and all method parameters as `unknown`). Fixed inline; the snapshots reflect the corrected output (e.g. `EventEmitter<FocusEvent>` for the focus event, `focus(options?: FocusOptions): void` instead of `focus(options?: unknown)`).

### Phase 4-S: Cluster S — IN-PROGRESS

Mock reduction. Four sequential PRs on `ft/cluster-s-pr-s{1..4}`.

- **PR-S1** (#147, MERGED 2026-05-02): seam pattern + helpers + advisory budget gate.
  - `src/output/index.ts` + `src/prompts/index.ts` (new wrapper) gained `setOutputForTesting` / `setPromptsForTesting` / `reset*ForTesting` registration hooks. Production code uses `getOutput()` / `getPrompts()` so tests can inject typed adapters via the seam without `vi.mock`.
  - `tests/unit/_helpers/{output,prompts,tier}.ts` ship `createRecordingOutput`, `createTestPrompts`, `writeTierFixture` for the new pattern. Documented in `tests/AGENTS.md`.
  - `scripts/check-mock-budget.ts` + `pnpm check:mocks` lands as advisory (`MOCK_BUDGET_ENFORCE=1` flips it strict in PR-S4). `TOTAL_BUDGET = 50`, per-file budget `theme-commands.test.ts: 10`.
  - Proof point: `tests/unit/theme-commands.test.ts` rewritten from a 7-vi.mock-decl setup to helpers + DI hooks + per-test `vi.spyOn` for residual seams. Substring count 37 -> 1.

- **PR-S2** (#148, MERGED 2026-05-02): extended the pattern to update / upgrade / diff command tests.
  - Production: `src/commands/update.ts` and `src/commands/upgrade.ts` swap `import * as p from '@clack/prompts'` to `import * as p from '../prompts/index.js'`. Both files only use `p.confirm` and `p.isCancel` so the swap is a behavioural no-op.
  - Tests: `tests/unit/{update-command,upgrade-command,diff-roundtrip,diff-command}.test.ts` drop their `vi.mock` decls for `@clack/prompts`, `output/index.js`, and `tier.js` in favour of the PR-S1 helpers. `diff-command.test.ts` also drops a dead `vi.mock('../../src/utils/tier.js')` since `diff.ts` never imports tier.
  - Substring delta: cluster S targets 48 -> 42, total `tests/unit/` 203 -> 198 (post-merge). Most surviving substring matches in these files are `vi.mocked(generateComponent)` / `vi.mocked(renderDiff)` operations on residual mocks (template, registry, diff-renderer) that PR-S2 explicitly keeps.
  - 1297 unit tests passing; lint, type-check, registry, templates, AGENTS validation all clean; build smoke (`init --framework react --yes --no-install`) renders intro / outro / note normally.

- **PR-S3** (#150, DRAFT 2026-05-03): extends the pattern to 21 remaining command + utility tests; total `tests/unit/` 198 -> 104 (-94, well under the < 120 PR-S3 target).
  - Production: 13 `src/*` files swap `import * as p from '@clack/prompts'` to the wrapper (`src/commands/{add/component-selector,add/installer,add/remote-component-selector,add/remote-installer,brand,palette,init/config-builder,init/existing-config,init/index,registry/add-component,registry/add-theme,registry/init}.ts` + `src/output/console.ts`). All 13 use only methods the wrapper re-exports (`confirm`, `intro`, `isCancel`, `log.*`, `multiselect`, `note`, `outro`, `select`, `spinner`, `text`); behavioural no-op. Single commit, mirrors PR-S2's prod-swap shape.
  - Tests: 21 files refactored across 22 commits (one per file). Substring deltas per file: `init-tier-migration` 28 -> 14 (kept migration mock + its `vi.mocked` accessors), `registry-add-theme` 11 -> 0 (vi.spyOn on wrapper), `registry-add-component` 10 -> 0 (vi.spyOn), `palette-command` 9 -> 1 (kept regenerate), `registry-init-command` 7 -> 0, `brand-command` 7 -> 1 (kept regenerate), `component-installer` 6 -> 3 (kept diff-renderer/template/registry), `status-json` 5 -> 0, `remote-component-selector` 5 -> 0, `list` 5 -> 0, `registry-list-remove-command` 4 -> 2 (kept `vi.mocked(process.exit)`), `init-config-preservation` 4 -> 2 (kept tier-restrictions + display-options), `component-selector` 4 -> 0, `regenerate` 3 -> 0, `init-validate-and-prepare` 3 -> 0, `registry-validate-command` 2 -> 0, `list-json` 2 -> 0, `init-existing-config` 2 -> 0, `add-command-cross-framework` 2 -> 1 (kept registry-cache), `registry-connect-command` 1 -> 0, `add-command` 1 -> 0.
  - Three refactor patterns ladder per file: (a) `setOutputForTesting` + `setPromptsForTesting` for command tests that go through `getOutput()` + `getPrompts()`; (b) `vi.spyOn(p, '...')` on the wrapper for tests that need call-shape assertions or per-test return-value control (selectors, registry-add-\*, list, init-tier-migration); (c) `writeTierFixture(testDir, 'free' \| 'pro')` for tier-driven flows that previously mocked `detectTier`. The `regenerate.test.ts` rewrite caught a pre-existing leak: without the mock, `detectTierSync` falls back to token detection on the user's global `~/.npmrc` / `WEBAWESOME_NPM_TOKEN` env, so the fixture is a deterministic-state guarantee, not just a substitute.
  - The `status-json` "tier mismatch warning" test case exercises a synthetic state (`tier === 'free' && package === 'pro'`) that's unreachable without mocking once `detectTier` and `getPackageInfo` both read the same `package.json`; preserved via per-test `vi.spyOn(tierMod, 'detectTier').mockResolvedValue('free')`.
  - 1297 unit tests passing; lint, type-check, registry, templates, AGENTS validation all clean; `pnpm check:mocks` shows total 104 / 50 (advisory); build smoke (`init --framework react --yes --no-install`) renders intro / outro / spinner normally.

- **PR-S4** (pending): pick up the three test files the cluster S spec listed in PR-S3 scope but PR-S3 deferred (`remote-installer.test.ts` (9 substring matches; includes the undici.MockAgent HTTP migration), `init-file-generator.test.ts` (9), `registry-router.test.ts` (8)). Also consolidates any further mock reductions needed to drive total `tests/unit/` `vi.mock` substring count under 50, then flips `MOCK_BUDGET_ENFORCE=1` in CI.

### Phase 5: Cluster V — PENDING

Evidence layer. See [V spec](../specs/2026-04-29-cluster-v-evidence-layer-design.md). Runs after the Phase 4 parallel work (P, S, T, U) lands.

### Phase 6: v0.20.0 ship — PENDING

After all 8 clusters SHIPPED, the architectural changes ship against the new safety net.
