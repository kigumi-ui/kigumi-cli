---
name: wa-sync
description: >
  Detect and reconcile drift between Web Awesome's upstream API
  (custom-elements.json) and the local registry/templates. Use after
  upgrading the Web Awesome package or when checking for API changes.
allowed-tools: Read, Glob, Grep, Bash
---

# Web Awesome Sync Agent

Detect API drift between the installed Web Awesome package and the local component registry and templates.

## When to Use

Use this agent when:

- Web Awesome has been updated to a new version (`pnpm update @awesome.me/webawesome`)
- You need to check if the registry is still in sync with upstream
- You want to find new components, props, events, or slots added upstream
- You need to identify breaking changes before a release

## Context

The sync chain:

```
Web Awesome package (custom-elements.json)
  -> scripts/parse-custom-elements.ts
    -> src/utils/component-metadata.ts (auto-generated)
      -> src/utils/registry.ts (hand-maintained, references metadata)
        -> templates/**/*.hbs (Handlebars templates using registry data)
```

**Key files:**

- `src/utils/component-metadata.ts` - Auto-generated from `custom-elements.json`; contains detailed prop types, events, methods, slots
- `src/utils/registry.ts` - Hand-maintained; all `ComponentDefinition` entries with name, tagName, category, props, importPath, tier, dependencies (see file for current count)
- `src/utils/registry/types.ts` - TypeScript interfaces for registry entries
- `scripts/parse-custom-elements.ts` - Parser that reads `custom-elements.json` and generates metadata

## Workflow

### Step 1: Capture Current State

Before regenerating metadata, capture the current state for diffing:

1. Read `src/utils/component-metadata.ts` and note:
   - Which components are defined
   - Their props, events, methods, slots
2. Read `src/utils/registry.ts` and note:
   - All component keys and their `importPath`, `tier`, `props` arrays
3. Check the installed WA version:
   ```bash
   cat node_modules/@awesome.me/webawesome/package.json | grep version
   # or for pro:
   cat node_modules/@awesome.me/webawesome-pro/package.json | grep version
   ```

### Step 2: Regenerate Metadata

Run the metadata parser against the currently installed package:

```bash
pnpm generate:metadata
```

This updates `src/utils/component-metadata.ts` with the latest data from `custom-elements.json`.

### Step 3: Diff and Classify Changes

Compare the old vs. new metadata. For each component, check:

| Change Type       | Classification       | Action                                                |
| ----------------- | -------------------- | ----------------------------------------------------- |
| New optional prop | Non-breaking         | Update registry entry props array                     |
| Removed prop      | Breaking             | Flag for manual review + deprecation                  |
| New event         | Non-breaking         | Update registry + may need template update            |
| Removed event     | Breaking             | Flag for manual review                                |
| New method        | Non-breaking         | May need template update for imperative handle        |
| Changed prop type | Potentially breaking | Review if registry type matches                       |
| New component     | Addition             | Needs full scaffolding via generate-component-wrapper |
| Removed component | Breaking             | Flag for removal workflow                             |
| New slot          | Non-breaking         | Informational (slots pass through)                    |

### Step 4: Generate Drift Report

Produce a structured report:

```markdown
## Web Awesome Sync Report

**Installed version:** X.Y.Z (previous: A.B.C)
**Components in WA:** N
**Components in registry:** M

### New Components (not in registry)

- wa-new-thing - [description]

### Breaking Changes

- wa-dialog: prop `open` removed (was boolean)
- wa-select: event `wa-change` renamed to `wa-input`

### Non-Breaking Additions

- wa-button: new prop `loading` (boolean, default: false)
- wa-card: new event `wa-activate`
- wa-input: new method `stepUp()`

### Registry Drift (registry does not match metadata)

- wa-tooltip: registry has prop `distance` but metadata says `offset`
- wa-drawer: registry missing event `wa-request-close`

### Template Impact

- 5 components need template updates for new events
- 2 components need template updates for new methods
- 1 component needs template update for renamed prop
```

### Step 5: Apply Safe Updates

For **non-breaking additions** only (new optional props):

1. Update `src/utils/registry.ts` entries to add new props
2. Run `pnpm validate:registry` to verify consistency
3. Run `pnpm build && pnpm test` to verify nothing breaks

**Do NOT auto-apply:**

- Breaking changes (prop removals, renames)
- Template changes (need manual review for event handler patterns)
- New components (use `generate-component-wrapper` skill instead)

### Step 6: Check Hand-Maintained Doc Surfaces

Validators only cover code/registry drift. These surfaces are hand-maintained and must be checked against the same diff (they were the source of all drift in the WA 3.7.0–3.10.0 audit — see the "Web Awesome Version Bump" checklist in `AGENTS.md` for the full list):

- `docs/src/components/storybook/StorybookComponentGrid.tsx` — hardcoded component grid + PNG per component in `docs/src/assets/components/`
- Story files (`docs/src/stories/`) — argTypes `defaultValue` summaries for changed defaults, demo stories for new enum values
- `docs/.storybook-test/main.ts` + `docs/vitest.storybook.config.ts` — explicit story lists for the interaction-test lane
- `.claude/skills/kigumi-theme/references/{css-variables,available-themes}.md` — hand-sourced from `dist/styles/themes/default.css`; re-validate values and "Source:" footer
- `kigumi-compose-*` skill selection tables — new components in the matching category
- Component counts in `templates/AGENTS.md` and `.claude/skills/kigumi-angular/SKILL.md`
- `INTENTIONALLY_UNWRAPPED` in `scripts/validate-cem-sync.ts` — every new upstream component must be either wrapped or consciously allowlisted with rationale

Include a "Doc surface impact" section in the drift report listing which of these need updates.

### Step 7: Suggest Next Steps

Based on the report, suggest:

- Which templates need manual updates (link to specific files)
- Whether `generate-component-wrapper` should be run for new components
- Whether a breaking change warrants a major version bump

## Important Notes

- The registry uses `@awesome.me/webawesome` as the base package in `importPath`. The tier system (`{{{importPath}}}` Handlebars variable) handles free vs. pro at generation time.
- `component-metadata.ts` is auto-generated. Never edit it manually.
- The registry is the source of truth for the CLI. Metadata is supplementary.
- Some components in `custom-elements.json` may be internal/undocumented. Only sync components that have public Web Awesome documentation.
- Chart sub-components (`bar-chart`, `line-chart`, `bubble-chart`, etc.) may appear as separate entries in `custom-elements.json` but are grouped under `charts` in the registry.
