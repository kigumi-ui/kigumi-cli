# Test Infrastructure Hardening — Live Status

**Last updated:** 2026-04-30 (Q2 in flight)
**Initiative spec:** [`docs/superpowers/initiatives/2026-04-28-test-infrastructure-hardening.md`](../initiatives/2026-04-28-test-infrastructure-hardening.md)
**Active cluster:** Q2 (in PR #138)
**Active spec:** [`docs/superpowers/specs/2026-04-30-cluster-q2-ci-completeness-design.md`](../specs/2026-04-30-cluster-q2-ci-completeness-design.md)
**Active plan:** _(local working plan only; gitignored at `.claude/plans/`)_
**Local 2nd brain dashboard (private):** `~/.claude/projects/-Users-giregar-Documents-dev-git-kigumi-cli/memory/project-test-infrastructure-hardening.md` _(seeded by user after this PR merges)_

---

## PR

This bootstrap PR: _(filled in after `gh pr create`)_

Per-cluster PRs: tracked in the status table below as each cluster ships.

---

## Cluster Status Table

| Cluster | Codename                                                | Primary F-IDs                                   | Depends on                       | Status          | PR        | Spec                                                                | Plan                |
| ------- | ------------------------------------------------------- | ----------------------------------------------- | -------------------------------- | --------------- | --------- | ------------------------------------------------------------------- | ------------------- |
| **Q1**  | Test foundation                                         | F-132, F-050, F-052                             | —                                | **SHIPPED**     | #137      | [Q1 spec](../specs/2026-04-29-cluster-q1-test-foundation-design.md) | _accumulated in PR_ |
| **Q2**  | CI completeness                                         | F-046, F-119, F-127, F-051, F-048, F-128, F-045 | Q1                               | **IN-PROGRESS** | #138      | [Q2 spec](../specs/2026-04-30-cluster-q2-ci-completeness-design.md) | _local_             |
| **R**   | Real-world starter e2e (+ snapshot diff)                | F-X1, F-X2, F-X3, F-X4, F-X5 (NEW)              | Q2                               | **BLOCKED**     | _pending_ | _pending_                                                           | _pending_           |
| **S**   | Mock reduction                                          | F-126 (full)                                    | Q1                               | **BLOCKED**     | _pending_ | _pending_                                                           | _pending_           |
| **P**   | Coverage rationalization                                | F-122+F-124 (pair), F-120, F-123, F-121, F-125  | Q1                               | **BLOCKED**     | _pending_ | _pending_                                                           | _pending_           |
| **T**   | Property-based + edge cases (+ negative-path inventory) | F-X6, F-X7, F-X8, F-X9 (NEW)                    | Q1 (+ Cluster A for `.strict()`) | **BLOCKED**     | _pending_ | _pending_                                                           | _pending_           |
| **U**   | Story `play()` interactions                             | F-129                                           | Q1, Q2                           | **BLOCKED**     | _pending_ | _pending_                                                           | _pending_           |
| **V**   | Evidence layer (mutation, bug-bash, bug-injection)      | F-X10, F-X11, F-X12 (NEW)                       | Q1, Q2                           | **BLOCKED**     | _pending_ | [V spec](../specs/2026-04-29-cluster-v-evidence-layer-design.md)    | _pending_           |

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

### Phase 2: Q2 — PENDING

CI completeness. Spec to be written.

### Phase 3: Parallel work — PENDING

After Q1 ships, S/P/T can run in parallel sessions. R waits on Q2. U waits on Q1+Q2. Specs to be written.

### Phase 4: Cluster V — PENDING

Evidence layer. See [V spec](../specs/2026-04-29-cluster-v-evidence-layer-design.md). Runs after Q1+Q2 ship.

### Phase 5: v0.20.0 ship — PENDING

After all 8 clusters SHIPPED, the architectural changes ship against the new safety net.
