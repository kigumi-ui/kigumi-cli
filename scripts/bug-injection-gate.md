# Bug-injection acceptance gate (Cluster V — Phase 4)

## DO NOT MERGE

This document describes a one-time procedure for the test-infrastructure-hardening
initiative's Cluster V acceptance gate. It is **not** a recurring CI job. The
gate is run once per release of the initiative; the resulting `gate/` branch is
**discarded after completion** (do not push, do not merge, do not open a PR).

The gate exists to convert "≥99% confidence" from an estimate into a number
with documented evidence. Five deliberate bugs are planted on a discardable
scratch branch; the full test suite must catch all five. Anything less is an
actionable gap.

## Hygiene rules

- Branch name **must** start with `gate/` (e.g. `gate/v-evidence-layer-2026-MM-DD`).
  The prefix is a visual reminder that the branch is throwaway.
- Branch must **never** be pushed to `origin`. The local-only remote check is
  part of the gate.
- Each planted bug is its own commit (clean revert path between bugs).
- After 5/5 confirmed: `git checkout main && git branch -D gate/...`. Do not
  preserve the branch.
- **Do not** include the bug-injection diffs themselves in any committed PR.
  The bugs below are reference recipes for re-running the gate; planting them
  on `main` would obviously break production.

## Procedure

```bash
git fetch origin main
git checkout -b gate/v-evidence-layer-$(date +%Y-%m-%d) origin/main

# For each B1..B5 below:
#   1. apply the diff exactly
#   2. git add -u && git commit -m "inject Bn: <description>"
#   3. pnpm test:all && pnpm test:e2e && pnpm test:integration
#      (test:all already chains build + unit + integration + e2e + stories;
#       running test:e2e and test:integration redundantly is fine but not
#       required.)
#   4. record which test(s) turned red and on what mutation
#   5. git reset --hard HEAD~1   (revert the bug, ready for next)
# Capture all 5 commit SHAs + branch tip SHA before reset.
git log --oneline gate/v-evidence-layer-$(date +%Y-%m-%d)
git checkout main && git branch -D gate/v-evidence-layer-$(date +%Y-%m-%d)
```

Pass criterion: each of the 5 bugs causes at least one identifiable test
failure (not an unrelated/spurious failure caused by build-side noise).
**5/5 → V can ship.**

If any of the 5 bugs is **not** caught:

1. Identify which bug went undetected.
2. Identify the gap (which test class should have caught it).
3. Open a follow-up PR that adds the missing test coverage.
4. After that PR merges to `main`, re-run the gate.

Do **not** flip the cluster-V status row to **SHIPPED** until 5/5 is reached.

## The five bugs

Each bug is described as a literal patch to the current main. Apply with
`git apply` from the root of the worktree, or hand-edit the file at the
indicated location. Lines are numbered against the current `main` HEAD —
adjust as needed if intervening commits move them.

### B1 — Schema default typo

**Target:** `src/schemas/config.ts` — `kigumiConfigSchema` defaults

Mutate the `componentsDir` default so `mergeWithDefaults({})` returns the
wrong value. Real-world consequence: `kigumi init --yes` writes components
into the wrong directory; `kigumi add button` cannot find them on the next
run.

```diff
-    componentsDir: z.string().min(1, 'Components directory cannot be empty'),
+    componentsDir: z.string().min(1, 'Components directory cannot be empty').default('src/UI'),
```

(or, equivalently, mutate `DEFAULT_CONFIG.componentsDir` to `'src/UI'`).

**Expected catchers:** any unit test asserting `DEFAULT_CONFIG.componentsDir`
or `getConfig({})` shape — `tests/unit/config.test.ts`,
`tests/unit/init-config-preservation.test.ts`,
`tests/unit/scripts/snapshot tests` against starter outputs.

### B2 — Off-by-one in update.ts

**Target:** `src/commands/update.ts` — the `for...of componentsToCheck` loop
that iterates over installed components when scanning for updates.

Drop the last item by slicing off the tail of the iteration source:

```diff
- for (const componentName of componentsToCheck) {
+ for (const componentName of componentsToCheck.slice(0, -1)) {
```

(Apply at the existing for-of site; `grep -n 'for (const componentName' src/commands/update.ts`.)

**Expected catchers:** `tests/unit/update-command.test.ts` integration paths
that install ≥2 components and assert all are checked. `tests/integration/`
config-lifecycle scenarios.

### B3 — Tier-guard logic flip

**Target:** `src/utils/tier-restrictions.ts` — `isPaletteAvailable`.

Flip the tier guard so free projects accept Pro palettes:

```diff
- return TIER_RESTRICTIONS.palettes[tier].includes(palette);
+ return TIER_RESTRICTIONS.palettes['pro'].includes(palette);
```

**Expected catchers:** `tests/unit/regression/f-013-palette-tier-gating.test.ts`
must turn red on every Pro-only palette assertion.

### B4 — Early-return in the component installer

**Target:** `src/commands/add/installer.ts` — `ComponentInstaller.installComponents`,
the `for (const componentName of componentNames)` loop that drives the
per-component file write. (`addCommand` in `src/commands/add/index.ts`
delegates to this method; injecting in the outer command misses the
write path.)

Insert an unconditional early-return as the first statement inside the
for-of loop body so `kigumi add` silently does nothing:

```diff
     for (const componentName of componentNames) {
+      return;
       // ... existing per-component logic
     }
```

(Apply at the existing for-of site; `grep -n 'for (const componentName of componentNames' src/commands/add/installer.ts`.)

**Expected catchers:** `tests/unit/add-command.test.ts` "should create
component files for React TypeScript" + every other "should create" case.
`tests/integration/add-command-*.test.ts` end-to-end cases.

### B5 — Generator filename typo

**Target:** `scripts/generate-react-templates.ts` — the per-component output
filename.

Mutate the filename so the generator writes `Buttn.tsx` instead of
`Button.tsx`:

```diff
- const componentFile = path.join(outDir, `${componentName}.tsx`);
+ const componentFile = path.join(outDir, `${componentName.replace('o', '')}.tsx`);
```

(Or replace the literal call site with a hardcoded typo for the first
component encountered.)

**Expected catchers:** Cluster R starter snapshot tests
(`tests/e2e/starter-snapshots.test.ts` or whichever lane covers React
output), plus `pnpm validate:templates` if run as part of `test:all`.

## Recording the result

After 5/5 confirmed, append a paragraph to
`docs/superpowers/state/test-infrastructure-hardening-status.md` Phase 5
section with:

- Run date (ISO).
- Gate-branch tip SHA (captured **before** the branch was deleted; e.g.
  via `git rev-parse gate/v-evidence-layer-2026-MM-DD` immediately after
  the last reset).
- Per-bug catcher list (which test file flagged each B1..B5).
- Final kill rate (must read `5/5`).
- A one-line reproduction note: "Re-run by recreating each B1..B5 diff
  on a fresh `gate/` branch from `main` at <SHA>".

Then flip the V cluster-status row to **SHIPPED** in the same PR (PR-V3 in
the V cluster cadence).

## Future re-runs

Spec line 249 anticipates that the same five bugs become "trained on" if
re-used every release. Future maintainers should swap in fresh bugs at the
same five mutation classes (default value, off-by-one, tier-guard flip,
early-return, generator filename) for any later re-run. The five above are
canonical for the V1 gate; cluster V's _next_ iteration uses different ones.
