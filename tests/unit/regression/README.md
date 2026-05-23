# Regression suite

Each test in this directory protects against a specific historical bug that
shipped (and was fixed) in the past. The suite is the bug-bash arm of
[Cluster V](../../../docs/superpowers/specs/2026-04-29-cluster-v-evidence-layer-design.md):
mutation testing measures _whether_ tests catch breakage in general; this
directory provides documented evidence that the suite catches the specific
breakage real users have hit.

## Where it lives

The V spec writes the path as `tests/regression/`. Execution placed it under
`tests/unit/regression/` so the existing positional `pnpm test tests/unit`
glob, the `tests/unit/`-scoped `pnpm check:mocks` budget, the
`tsconfig.tests.json` baseline, and `.lintstagedrc.json`'s `vitest related`
gate all cover these tests automatically. See the cluster V plan in the
PR-V2 description for the full rationale.

## File-header contract

Every test in this directory opens with this header (spec lines 158–164):

```ts
/**
 * Protects: PR #117 (F-037)
 * Bug: <one-line user-visible symptom>
 * Fix: <commit-SHA-of-original-fix> — <one-line summary>
 */
```

The `describe()` block name should match the protected PR/F-ID so a failing
test is immediately traceable.

## How to add a new entry

1. Pick a bug from `~/.claude/projects/kigumi-cli-overview.md` (DONE F-IDs)
   or recent merged PRs. Curation criteria from the V spec:
   - was user-visible (crashed the CLI, produced wrong output, silently
     corrupted state),
   - had a non-trivial fix,
   - covers a structural area the rest of the suite already touches.
2. Read the original PR diff. Identify the invariant the fix established.
3. Write a test that asserts the invariant. Aim for one
   `it(...)` per file when feasible — small, tightly-scoped tests are easier
   to traceback.
4. Verify on a scratch branch:

   ```bash
   git checkout -b scratch/regression-verify-<id> main
   git revert <fix-merge-sha> --mainline 1
   pnpm test tests/unit/regression/<your-file>
   # must fail
   git checkout main && git branch -D scratch/regression-verify-<id>
   ```

5. If `git revert` is impossible (later refactors renamed files), assert the
   logical invariant instead and note "revert verification by manual code
   rollback" in the file header.
6. Capture the revert evidence in the PR description (scratch-branch name,
   revert SHA, the failing-test output).

## What this directory is not

- **Not** a coverage tool. Mutation testing (`pnpm test:mutation`) measures
  whether the suite catches generic breakage; this directory captures
  specific historical breakage.
- **Not** a comprehensive history. Curated for value (≥ 10 entries; nice-to-
  have 15–20). Forgotten bugs are fine — they're already fixed and the rest
  of the suite covers the same code paths.
- **Not** the bug-injection gate. That is documented separately in
  `scripts/bug-injection-gate.md` and runs once per cluster V iteration.
