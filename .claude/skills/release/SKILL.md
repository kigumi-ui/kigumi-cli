---
name: release
description: >
  Prepare and publish a Kigumi CLI release using changesets. Handles the full
  workflow: validation, changeset creation, version bumping, CHANGELOG review,
  commit, and PR creation. Use this skill when the user mentions releasing,
  publishing, version bumps, changesets, preparing a release, cutting a new
  version, or shipping a new version of kigumi.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Edit, Write
---

# Kigumi Release Workflow

Step-by-step release process for the Kigumi CLI using `@changesets/cli`. This is a single-package repo (not a monorepo), so changesets always target the `kigumi` package.

## Before you start

Confirm these prerequisites with the user:

1. **Branch**: You must be on a feature branch, not `main`. If on main, create a worktree first.
2. **Clean working tree**: All changes should be committed. Run `git status` to verify.
3. **Bump type**: Ask the user whether this is a `patch` (bugfixes, docs) or `minor` (new features, breaking changes) release.
4. **Summary**: Ask for a one-line release summary, or offer to derive it from recent commits.

## Step 1: Full validation

Run the complete validation suite. Every check must pass before proceeding.

```bash
pnpm build && pnpm type-check && pnpm lint && pnpm test
pnpm validate:registry && pnpm validate:templates
```

If any step fails, stop and fix the issue before continuing. Do not skip validation.

## Step 2: Create the changeset

Changesets are markdown files in `.changeset/` that describe what changed. The config at `.changeset/config.json` uses `"commit": false`, so changesets are not auto-committed.

Create the changeset file manually (since `pnpm changeset` is interactive and cannot be driven from a script):

```bash
# Generate a random changeset name
CHANGESET_NAME=$(node -e "console.log(Array.from({length: 3}, () => ['red','blue','green','gold','cool','warm','soft','bold','fast','slow','big','shy','old','new','raw','dry','wet','hot','icy','odd'][Math.floor(Math.random()*20)]).join('-'))")

cat > .changeset/${CHANGESET_NAME}.md << 'CHANGESET_EOF'
---
"kigumi": minor
---

Summary here
CHANGESET_EOF
```

Replace `minor` with `patch` if appropriate, and replace the summary with the actual release description.

The summary should follow the existing CHANGELOG style. Look at `CHANGELOG.md` for reference. Typical format:

**For a minor release with multiple changes:**

```markdown
### Features

- **Feature name**: Description of the feature
- **Another feature**: What it does

### Bug Fixes

- **fix(scope)**: What was fixed
```

**For a simple patch:**

```markdown
Fix description of what was wrong and what changed.
```

## Step 3: Version bump

Run the version command to consume the changeset and update `package.json` + `CHANGELOG.md`:

```bash
pnpm changeset version
```

This will:

- Delete the changeset file from `.changeset/`
- Bump the version in `package.json`
- Prepend the release notes to `CHANGELOG.md`

## Step 4: Review

Show the user:

1. The new version number from `package.json`
2. The new CHANGELOG entry (first ~30 lines of `CHANGELOG.md`)
3. The full diff (`git diff`)

Wait for the user to confirm before committing.

## Step 5: Commit

Stage and commit the version bump:

```bash
git add package.json CHANGELOG.md .changeset/
git commit -m "chore: release v$(node -p "require('./package.json').version")"
```

Do not add `Co-Authored-By` lines to the commit message.

## Step 6: Create PR

Push the branch and create a PR targeting `main`:

```bash
git push -u origin HEAD
gh pr create --title "chore: release v$(node -p "require('./package.json').version")" --body "$(cat <<'PR_EOF'
## Summary
- Version bump and CHANGELOG update via changesets

## Checklist
- [ ] Validation passed (build, type-check, lint, test, validators)
- [ ] CHANGELOG entry reviewed
- [ ] Version number correct
PR_EOF
)"
```

## Step 7: After merge (optional)

If the user asks to publish after the PR is merged:

```bash
git checkout main && git pull
pnpm release  # runs: pnpm build && changeset publish
```

This publishes to npm using the `publishConfig` in `package.json`.

## Important notes

- The `"commit": false` setting in `.changeset/config.json` means changesets stay as files until `changeset version` consumes them
- `baseBranch` is `main`
- `access` is `public` (npm public package)
- Current version can be checked with `node -p "require('./package.json').version"`
