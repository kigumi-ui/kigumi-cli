# PLAN: Deterministic Guardrails, Clusters A + B + C

Phased roadmap mirroring SPEC.md. **Three PRs, landed strictly in order
A, then B, then C.** Each on its own worktree branch under `.claude/worktrees/`,
each with a changeset.

Why three PRs rather than one: the diffs have different shapes and risk
profiles. A is script logic plus tests with no CI behavior change. B is a
57-entry registry data change. C is the only one that can turn PRs red.
Bundling means a revert of the CI wiring also reverts the backfill.

Why this order:

- A establishes the export + import-guard + pure-function testing convention
  that B's test rewrite mirrors.
- B must be green on `main` before C gates parity, or C wires a still-inert
  check and repeats the exact failure A exists to fix.
- C should wire the _repaired_ `validate:changes`, not the current one.

---

## PR 1: Cluster A, Trust Repair

Branch: `.claude/worktrees/guardrails-a-trust-repair`

### Phase A1 - Make the script testable (do this first)

Target: `scripts/validate-changes.ts`

- Export `validateChanges` (currently a bare `async function`).
- Guard the entry point: replace the unconditional `main()` at `:426` with
  `if (process.argv[1] === fileURLToPath(import.meta.url)) { main(); }`,
  copying the pattern from `validate-parity.ts:185`.
- Verify: `pnpm validate:changes` still exits 0, and a throwaway import of the
  module no longer triggers `process.exit`.

Doing this first means every later edit in this PR lands under test.

### Phase A2 - Extract the pure matcher

- Pull the regex application out of `checkAntiPatterns` (`:283-322`) into an
  exported pure function:
  `export function scanAntiPatterns(content: string, filePath: string): ValidationIssue[]`.
- Leave the filesystem walk as a thin shell that reads files and delegates.
- Do **not** touch `findFiles` (`:39-101`). Its substring-based ignore matching
  is adequate for the two globs actually in use. Note it as a Cluster E
  candidate.

### Phase A3 - Remove the dead checks

- Delete the `className` entry from the `antiPatterns` array (`:290-293`).
  Leave a comment stating why a line regex cannot work here and pointing at
  Cluster E, so nobody re-adds it.
- Delete `checkTierLogic()` (`:170-178`) entirely, plus its call at `:338`, plus
  its bullet in the header `CHECKS:` list. Leave a comment pointing at
  Cluster J.
- Keep the `.hide()` entry.
- Widen the glob at `:284` from `src/**/*.ts` to also cover `.tsx`.
- Remove the `--fix` line from the header comment (`process.argv` is never
  read).

### Phase A4 - Regression fixture

New file: `tests/unit/validate-changes.test.ts`

Two tiers, mirroring the shape already used in `tests/unit/validate-parity.test.ts`:

- **Structural**, against real repo state: result shape is well formed, exits
  clean today.
- **Table tests on `scanAntiPatterns`**, the tier that was entirely missing.
  Known-bad input yields exactly 1 finding; known-good input yields 0. Cover
  `.hide()` versus `.requestClose()`. Add equivalent coverage for
  `checkImportPaths` (mixed free/pro) and `checkTemplateParity`
  (missing variant) where they can be exercised without a filesystem rewrite.

### Phase A5 - Validate

```bash
pnpm validate:changes
pnpm test && pnpm lint && pnpm type-check
```

**Bug injection (required):** delete the `.hide()` rule and confirm the test
suite fails. A guardrail whose removal breaks nothing is not a guardrail.

Changeset: patch.

---

## PR 2: Cluster B, Parity Teeth

Branch: `.claude/worktrees/guardrails-b-parity-teeth`

Prerequisite: PR 1 merged.

### Phase B1 - Measure the Angular baseline

Before changing any severity:

- Add `'angular'` to both loops (`validate-parity.ts:71`, `:91`).
- Run `pnpm validate:parity` and record the finding count.
- 85 template directories against 84 registry components means at least one
  `orphaned-template` finding is likely. Resolve whatever surfaces in this PR,
  or hold Angular findings at `warning` behind an explicit documented carve-out.
  Do not let a fresh backlog ride in under a newly strict gate.

### Phase B2 - Backfill the 57 vue entries

Target: `src/utils/registry.ts`

- Populate `files.vue` for the 57 components that have vue templates but an
  empty entry, using the flat convention `components/<Name>.vue`.
- Normalize the four nested outliers (`Video`, `VideoPlaylist`, `DatePicker`,
  `DateInput`) to the same flat shape, matching their react siblings.
- Prefer a scripted, reviewable transformation over 57 hand edits.
- Confirm: `grep -c "vue: \[" src/utils/registry.ts` reports 84.

Note for reviewers: per SPEC finding 2, this field has no runtime readers in the
local install path, so a wrong path here misleads a reader but breaks nothing.
`src/commands/registry/validate.ts:120` validates file existence for the
_community_ registry only.

### Phase B3 - Flip severities

- `registry-files-gap` (`:78-83`) and `orphaned-template` (`:105-110`) both
  become `severity: 'error'`.
- Document in the script header what `registry.files` actually means:
  community-registry documentation metadata, not the local install path.

### Phase B4 - Fix the debt-protecting test

Target: `tests/unit/validate-parity.test.ts:30-37`

- The current assertion `expect(gapFindings.length).toBeGreaterThan(0)` passes
  only while the debt exists. The backfill breaks it, correctly.
- Replace with a synthetic fixture: feed a component with an empty `files.vue`
  and assert exactly one `registry-files-gap` finding, so detection is proven
  independently of live repo state.

### Phase B5 - Validate

```bash
pnpm validate:parity   # expect 0 findings, exit 0
pnpm validate:all
pnpm test && pnpm lint && pnpm type-check
```

**Bug injection (required):** blank one `files.vue` entry and confirm
`validate:parity` exits 1. Add an unregistered template directory and confirm it
exits 1.

Changeset: patch.

---

## PR 3: Cluster C, CI Wiring

Branch: `.claude/worktrees/guardrails-c-ci-wiring`

Prerequisite: PR 2 merged **and green on `main`**.

### Phase C1 - Prep commit: unblock validate:agents

Keep as its own commit so it is revertable independently of the CI diff.

- Add the missing `theme-install-local-source.test.ts` entry to
  `tests/AGENTS.md`, in the correct tree position.
- Confirm `pnpm validate:agents` exits 0.
- Optional polish: add the `import.meta.url` guard to
  `scripts/validate-agents.ts`, which has the same defect A fixed.

### Phase C2 - Re-measure main

Immediately before wiring, re-run all five validators on current `main`. A
template directory added between PR 2 and PR 3 would otherwise land as a
mysterious failure on someone's unrelated PR.

```bash
pnpm validate:changes && pnpm validate:stories && pnpm validate:parity \
  && pnpm validate:agents && pnpm validate:cem-sync
```

### Phase C3 - Wire the quality job

Target: `.github/workflows/ci.yml`, appending after `:156`.

Five named steps: Validate Changes, Validate Stories, Validate Parity,
Validate AGENTS.md, Validate CEM Sync. See SPEC for the exact YAML.

Constraints, all three verified:

- Do **not** add a `permissions:` block to `quality`. It inherits the
  workflow-level one, and job-level `permissions` replace rather than merge, so
  a partial block would drop `contents: read` and break checkout.
- Do **not** add a build step. All five run from source via `tsx`.
- Do **not** add Pro-token gating for cem-sync. The script self-guards at
  `validate-cem-sync.ts:209`, and the presence check runs off committed
  metadata. Gating would mean installing docs deps in `quality` for no gain.

### Phase C4 - Validate

- Open the PR and confirm all five steps report green individually.
- **Bug injection (required):** push a commit removing a line from
  `tests/AGENTS.md` and confirm exactly the AGENTS.md step turns red and no
  other. Revert before merge.

Changeset: patch.

---

## Follow-ups to file, not in scope here

- **CEM prop-value drift is still ungated in CI.** Only the presence half runs.
  `docs-typecheck` already installs docs deps with the Pro token and is the
  natural home. Own cluster.
- **Meta-check candidate:** statically flag any `scripts/validate-*.ts` whose
  failure predicate references a severity no emit site produces. It would have
  caught both bugs repaired here.
- **No shared validator helper.** All 9 validators reinvent their own
  finding/result types; there is no `scripts/lib/`.
- **Backlog entries.** Per the new-findings-to-backlog rule, each finding above
  (inert className regex, always-warning parity, the debt-protecting parity
  test, the missing `tests/AGENTS.md` entry, the phantom `--fix` flag) needs an
  F-XXX entry in `overview.md` even though it is fixed in these same PRs. Those
  IDs belong in `overview.md` and commit messages only, never in code comments.

## Next steps

1. Review SPEC.md, especially the three open questions.
2. Resolve the flat-versus-nested `files.vue` convention question before PR 2.
3. Execute PR 1, then PR 2, then PR 3, verifying bug injection at each phase.
