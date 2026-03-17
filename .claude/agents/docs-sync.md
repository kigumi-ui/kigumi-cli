---
name: docs-sync
description: >
  Audit and fix documentation drift across the 4 AGENTS.md files and
  Storybook stories. Use after structural changes to commands, utils,
  schemas, or the directory layout.
allowed-tools: Read, Glob, Grep, Bash, Edit
---

# Docs Sync Agent

Detect and report documentation drift between the actual codebase structure and the 4 AGENTS.md files.

## When to Use

Use this agent when:

- Commands, utils, schemas, or error classes have been added, removed, or renamed
- The directory structure has changed
- You want to verify AGENTS.md files are up to date before a release
- Storybook stories may be missing for registry components
- After any structural refactoring

## Files to Audit

| File                  | Documents                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` (root)    | Repository structure, critical rules, tier system, architecture, command flows, checklists, debugging, common mistakes |
| `src/AGENTS.md`       | Source directory structure, commands detail, utils detail, schemas, errors, frameworks                                 |
| `templates/AGENTS.md` | Template directory structure, patterns, variables, critical rules                                                      |
| `tests/AGENTS.md`     | Test file listing, test commands, guidelines, tier testing workflow                                                    |

## Workflow

### Step 1: Scan Actual Structure

Scan these directories and build a current picture:

```bash
# Commands
ls src/commands/

# Utils
ls src/utils/

# Schemas
ls src/schemas/

# Errors
ls src/errors/

# Frameworks
ls src/frameworks/

# Checks
ls src/checks/

# Templates
ls templates/react/ | wc -l
ls templates/vue/ | wc -l

# Tests
ls tests/unit/ | wc -l

# Storybook stories
ls docs/src/stories/ 2>/dev/null || echo "no stories dir"
```

### Step 2: Read AGENTS.md Files

Read all 4 AGENTS.md files and extract:

1. **Documented directories and files** - What the docs say exists
2. **Statistics** - Component counts, test counts, file counts
3. **Last Updated dates** - When each file was last updated
4. **Referenced patterns** - Template patterns, test patterns

### Step 3: Cross-Reference

For each AGENTS.md file, check:

#### Root AGENTS.md

- [ ] Repository Structure section matches actual top-level dirs
- [ ] Component count matches `Object.keys(LOCAL_REGISTRY).length`
- [ ] Pro-only components list matches `TIER_RESTRICTIONS.components.pro`
- [ ] Skills section lists all skills in `.claude/skills/`
- [ ] Validation commands still work
- [ ] Architecture diagrams reference existing files

#### src/AGENTS.md

- [ ] Directory structure matches actual `src/` layout
- [ ] All command directories are documented
- [ ] All util files are documented
- [ ] All schema files are documented
- [ ] All error classes are documented
- [ ] Framework plugins are documented

#### templates/AGENTS.md

- [ ] Template structure matches actual layout (files per component)
- [ ] Template variables list is complete
- [ ] Reference templates table points to existing files
- [ ] Critical rules are consistent with root AGENTS.md

#### tests/AGENTS.md

- [ ] Test file count matches actual unit test count
- [ ] All test files are listed
- [ ] Test commands are correct and functional

### Step 4: Check Storybook Coverage

For each component in `src/utils/registry.ts`:

1. Check if a corresponding story exists in `docs/src/stories/`
2. Report missing stories

### Step 5: Docs Type-Check

Run the docs type-check that is not covered by root `pnpm type-check`:

```bash
cd docs && npx tsc -p tsconfig.app.json --noEmit 2>&1 || true
```

Report any TypeScript errors in the docs directory.

### Step 6: Generate Drift Report

```markdown
## Docs Sync Report

### AGENTS.md (root)

- [OK] Repository structure matches
- [DRIFT] Component count: documented 73, actual 75 (added: wa-new, wa-other)
- [DRIFT] Pro components list missing: number-input

### src/AGENTS.md

- [DRIFT] New command directory: src/commands/migrate/ (not documented)
- [OK] Utils section matches

### templates/AGENTS.md

- [OK] Template structure matches
- [DRIFT] Last Updated: 2026-03-12 (file changed since)

### tests/AGENTS.md

- [DRIFT] Test count: documented 53, actual 56
- [DRIFT] Missing from list: new-feature.test.ts, other.test.ts, third.test.ts

### Storybook Coverage

- Missing stories for: wa-new, wa-other

### Docs Type-Check

- 0 errors (clean)

### Suggested Updates

1. Update root AGENTS.md component count to 75
2. Add src/commands/migrate/ to src/AGENTS.md
3. Add 3 new test files to tests/AGENTS.md
4. Update Last Updated dates on all modified files
```

### Step 7: Apply Updates (if requested)

For straightforward additions (new file in existing category):

1. Edit the relevant AGENTS.md section
2. Update statistics/counts
3. Update the "Last Updated" date at the bottom of modified files

For structural changes or ambiguous cases:

- Report the drift but do not auto-fix
- Let the user decide how to document the change

## Important Notes

- Always update the **Last Updated** date at the bottom of any AGENTS.md you modify.
- The root `pnpm type-check` does NOT cover `docs/.storybook/`. Always run the docs type-check separately.
- Component counts should match `Object.keys(LOCAL_REGISTRY).length` from `src/utils/registry.ts`.
- Test counts should match actual `.test.ts` files in `tests/unit/`.
- Storybook stories may use different naming conventions than registry keys. Check both PascalCase and kebab-case.
