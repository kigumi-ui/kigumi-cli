# Foundations & Layout Restructure

**Status:** Approved
**Date:** 2026-04-06
**Branch:** `feat/foundations-restructure`
**Worktree:** `.claude/worktrees/feat/foundations-restructure`

## Problem

The Storybook documentation has three sidebar groups (Style, Layout, Design Tokens) with inconsistent structure, missing content, and conceptual overlap. Specifically:

1. **No overview pages** - the three groups exist only as implicit sidebar categories with no introductory landing pages.
2. **Conceptual overlap** - colors, typography, and border-radius each have two pages (one for utility classes under Style, one for tokens under Design Tokens). Consumers must hop between sidebar groups to find related information.
3. **Incomplete coverage** - several utility classes and CSS custom properties shipped in the upstream package are not documented:
   - Typography role classes (`.wa-body`, `.wa-heading`, `.wa-caption`, `.wa-longform`) and their size variants are entirely missing.
   - Visibility variants (`-force`, `-hint`, `-label`) are missing.
   - Several token categories are missing (raw color palette ~150 tokens, variant scale ~65 tokens, decomposed shadow tokens, native form modifiers, table classes, scale multipliers).
4. **Two presentation patterns** - Style and Layout pages use a `DocPage`/`DocTable` component system; Design Tokens pages use raw `Unstyled` HTML tables. There is no unified visual treatment for token previews.
5. **No cascade layer documentation** - the layer system that enables override-without-`!important` is fundamental to using the design system but undocumented.

The goal: restructure the documentation so that consumers never need to leave the Storybook to look up tokens, classes, or override patterns.

## Constraints

These come from explicit user instructions and project memory:

- **Default theme and default color palette only.** No alternative themes, no Pro themes, no palette switching. Whenever it's important to mention a brand color, use the Kigumi brand color.
- **No verbatim text from upstream documentation.** All prose must be original to avoid licensing concerns. Upstream reference files in `node_modules/@awesome.me/webawesome/dist/skills/webawesome/references/**/*.md` may be used as a source of truth for _what exists_ and _what concepts mean_, but never as a source of _prose_.
- **No mentions of the upstream library by name.** Documentation must read as Kigumi's own. At the same time, it must not falsely claim Kigumi authored these styles, layouts, or tokens.
- **No em dashes** or other AI-tells in the prose.
- **Classes first, tokens second** within each topic page.
- **Use Kigumi wrappers** (`@/components/ui`) in all MDX, never raw `wa-*` tags.
- **Skills sync stays a separate project.** This restructure plants seeds (frontmatter) but does not implement the sync pipeline.

## Architecture

### Sidebar Structure

The new sidebar order in `docs/.storybook/preview.ts`:

```
General → Guides → Foundations → Layout → Components
```

The `Style` and `Design Tokens` top-level groups disappear. The `src/stories/style/` and `src/stories/design-tokens/` directories are deleted. A new `src/stories/foundations/` directory is created. The existing `src/stories/layout/` directory is restructured.

### Two Sidebar Groups

**Foundations** holds 11 topic pages plus an overview page. Each topic page documents both the utility classes and the tokens for one conceptual area (color, typography, spacing, etc.).

**Layout** holds 7 topic pages plus an overview page. Each documents one composition primitive (Stack, Cluster, Grid, etc.).

### Page Template (consistent across all topics)

Every Foundations and Layout page follows this five-section structure:

1. **Intro** - one to two sentences explaining the concept and its mental model.
2. **Utility Classes** - a table of classes with their effects, plus a live rendered example. Omitted on topics that have no classes (Elevation, Focus, Motion, Component Tokens, Cascade Layers).
3. **Visual Reference** - a live rendered preview of the values (color swatches, type samples, spacing sticks, radius boxes, focus rings, transition demos, etc.). Present on every topic.
4. **Tokens** - a table of CSS custom properties with their values, organized into clusters where the count is large. Omitted on topics that have no direct tokens (Visibility, Native Elements, all Layout topics).
5. **Customizing** - a short code snippet showing how to override at `:root` or via `theme.css`. Omitted on topics with no overridable tokens (Visibility, Native Elements). Layout topics show how to override gaps and inner properties.

The order is fixed: **classes first, tokens second**. Topics that have no classes start at the Visual Reference section. Topics with no tokens end at the Visual Reference section.

### Component Primitives

Two patterns coexist in the new system, both lightweight:

- **Existing `DocTable`** continues to handle "class to effect" tables. No changes.
- **New `TokenTable`** handles "variable to value to preview" rows. Built fresh.

Plus six new visual sample components used inside `TokenTable` rows and on overview cards:

| Component      | Purpose                                   |
| -------------- | ----------------------------------------- |
| `ColorSwatch`  | Color box with hex display                |
| `SpaceSample`  | Spacing block with pixel display          |
| `TypeSample`   | Live text in a given font / size / weight |
| `RadiusSample` | Box with applied border-radius            |
| `ShadowSample` | Box with applied shadow token             |
| `MotionSample` | Hover/click box with applied transition   |

All new components live in `docs/src/components/storybook/` next to `DocTable.tsx`.

## Foundations Topic Catalog

11 topics. Coverage validated against `node_modules/@awesome.me/webawesome/dist/styles/themes/default.css` and `node_modules/@awesome.me/webawesome/dist/styles/utilities/*.css`.

### 1. Color

**Classes:** `.wa-brand`, `.wa-success`, `.wa-warning`, `.wa-danger`, `.wa-neutral` (variant scoping); `.wa-color-text-normal`, `.wa-color-text-quiet`, `.wa-color-text-link` (text colors); `.wa-light`, `.wa-dark`, `.wa-invert` (color scheme).

**Tokens (six clusters):**

- **Raw Palette** (~150 tokens) - `--wa-color-{red,orange,yellow,green,cyan,blue,indigo,purple,pink,gray}-{05,10,20,30,40,50,60,70,80,90,95}` plus `--wa-color-{hue}` and `--wa-color-{hue}-key` shortcuts plus `--wa-color-{hue}-gte-60` and `--wa-color-{hue}-on` from `base.css`.
- **Variant Scale** (~65 tokens) - `--wa-color-{brand,success,warning,danger,neutral}-{05..95}` plus `--wa-color-{role}` and `--wa-color-{role}-on` per role.
- **Surface** - `--wa-color-surface-{default,raised,lowered,border}`.
- **Text** - `--wa-color-text-{normal,quiet,link}`.
- **Variant Roles** (45 tokens) - `--wa-color-{brand,success,warning,danger,neutral}-{fill,border,on}-{quiet,normal,loud}`. Plus the contextual shorthand `--wa-color-{fill,border,on}-{quiet,normal,loud}` set by the variant scoping classes.
- **Mix and Effect** - `--wa-color-mix-{hover,active}`, `--wa-color-shadow`, `--wa-color-focus`, `--wa-color-overlay-{modal,inline}`.

**Visual reference:** Surface boxes, text color samples, a 3x3 grid (quiet/normal/loud × fill/border/on) per variant role, an overlay demo, a hue grid for the raw palette.

### 2. Typography

**Classes:** Role classes `.wa-body`, `.wa-heading`, `.wa-caption`, `.wa-longform` plus combined role-and-size variants `.wa-{role}-{size}` for sizes `3xs` through `5xl`. Size-only `.wa-font-size-{size}`. Weights `.wa-font-weight-{light,normal,semibold,bold}`. `.wa-text-truncate`. Links `.wa-link`, `.wa-link-plain`. `.wa-list-plain`. Form-control text classes `.wa-form-control-{label,value,hint,placeholder}`.

**Tokens:**

- **Font Families** - `--wa-font-family-{body,heading,code,longform}`.
- **Font Sizes** - `--wa-font-size-{3xs,2xs,xs,s,m,l,xl,2xl,3xl,4xl,5xl}` plus relative `-smaller` / `-larger` plus `--wa-font-size-scale`.
- **Font Weights** - base weights `light/normal/semibold/bold` plus role aliases `body/heading/code/longform/action`.
- **Line Heights** - `--wa-line-height-{condensed,normal,expanded}`.
- **Link Decoration** - `--wa-link-decoration-{default,hover}`.

**Visual reference:** "Aa" sample for each family, a vertical size scale with live samples, a weight comparison strip, a line-height demo.

### 3. Spacing

**Classes:** `.wa-gap-0` through `.wa-gap-5xl` (migrating from the existing Layout group).

**Tokens:** `--wa-space-scale`, `--wa-space-{3xs,2xs,xs,s,m,l,xl,2xl,3xl,4xl,5xl}`, and the alias `--wa-content-spacing`.

**Visual reference:** A vertical scale of sample sticks, one per step.

### 4. Border & Radius

**Classes:** `.wa-border-radius-{square,s,m,l,pill,circle}`.

**Tokens:**

- **Style** - `--wa-border-style`.
- **Width** - `--wa-border-width-scale`, `--wa-border-width-{s,m,l}`.
- **Radius** - `--wa-border-radius-scale`, `--wa-border-radius-{square,s,m,l,pill,circle}`.

**Visual reference:** A row of boxes for each radius value, a row of lines for each width.

### 5. Elevation

**Classes:** none.

**Tokens:**

- **Composite** - `--wa-shadow-{s,m,l}`.
- **Decomposed Scale** - `--wa-shadow-{offset-x,offset-y,blur,spread}-scale`.
- **Decomposed per Step** - `--wa-shadow-{offset-x,offset-y,blur,spread}-{s,m,l}`.

**Visual reference:** Three boxes with the composite shadows applied.

### 6. Focus

**Classes:** none.

**Tokens:** `--wa-focus-ring-{style,width,offset}` and `--wa-focus-ring` (shorthand).

**Visual reference:** A button with an active focus ring.

### 7. Motion

**Classes:** none.

**Tokens:** `--wa-transition-{fast,normal,slow}` and `--wa-transition-easing`.

**Visual reference:** Three hover boxes, one per transition duration.

### 8. Visibility

**Classes:** `.wa-visually-hidden` (default; visible on focus), `.wa-visually-hidden-force` (always hidden), `.wa-visually-hidden-hint` (hides `::part(hint)`), `.wa-visually-hidden-label` (hides `::part(label)` and `::part(form-control-label)`), and `.wa-cloak` for preventing flash of unstyled content.

**Tokens:** none.

**Visual reference:** Skip-link demo and a cloak comparison (before/after custom-element registration).

### 9. Native Elements

**Classes:**

- HTML element styling for `h1`-`h6`, `p`, `ul`, `ol`, `code`, `blockquote`, `strong`, `em`, `mark`, `a`.
- Native form modifier classes `.wa-button`, `.wa-filled`, `.wa-outlined`, `.wa-plain`, `.wa-accent`, `.wa-pill`.
- Size modifier classes `.wa-size-{s,m,l}`.
- Table classes `.wa-hover-rows`, `.wa-zebra-rows`.
- Native element styling for `<details>`, `<dialog>`, `<progress>`.
- Empty-state utility `.wa-placeholder`.

**Tokens:** none direct, with a cross-reference to `--wa-content-spacing`.

**Visual reference:** Live demo of each element category and modifier comparison.

### 10. Component Tokens

**Classes:** none.

**Tokens (three clusters):**

- **Form Controls** (~22 tokens) - `--wa-form-control-{background-color, border-color, border-style, border-width, border-radius, activated-color, label-color, label-font-weight, label-line-height, value-color, value-font-weight, value-line-height, hint-color, hint-font-weight, hint-line-height, placeholder-color, required-content, required-content-color, required-content-offset, padding-block, padding-inline, height, toggle-size}`.
- **Panels** - `--wa-panel-{border-style, border-width, border-radius}`.
- **Tooltips** - `--wa-tooltip-{arrow-size, background-color, border-color, border-style, border-width, border-radius, content-color, font-size, line-height}`.

**Visual reference:** A live `Input`, a live `Card`, a live `Tooltip` each rendered with their tokens highlighted.

### 11. Cascade Layers & Customizing

This is the most conceptual page. It documents the layer system that makes overrides predictable.

**Sections:**

1. **Layer Hierarchy** - a visual diagram showing the 7 internal layers (`wa-native`, `wa-utilities`, `wa-color-palette`, `wa-color-variant`, `wa-theme`, `wa-theme-dimension`, `wa-theme-overrides`) wrapped in the outer `base` and `theme` layers, with what lives in each.
2. **Token Cascade Pattern** - how raw palette → variant scale → semantic roles cascade, walked through with the brand color as the example.
3. **Where to Override** - the difference between `:root`, `.wa-dark`, `theme.css`, and `@layer wa-theme-overrides`, with a decision matrix.
4. **Scale Tokens** - the eight global multipliers (`--wa-space-scale`, `--wa-font-size-scale`, `--wa-border-radius-scale`, `--wa-border-width-scale`, `--wa-shadow-{offset-x,offset-y,blur,spread}-scale`) explained as a single concept, with live examples (sharp corners via `--wa-border-radius-scale: 0`, larger spacing via `--wa-space-scale: 1.5`).
5. **The `color-mix()` Pattern** - how hover, active, shadow, and overlay tokens are computed from base tokens and what that means for overrides.
6. **Dark Mode Pattern** - the `.wa-dark` class, how it triggers token swaps, and how to add custom dark overrides.

**Visual reference:** A live scale slider for `--wa-border-radius-scale` and a side-by-side light/dark switcher.

## Layout Topic Catalog

7 topics. Coverage validated against `utilities/layout.css`, `utilities/align-items.css`, `utilities/justify-content.css`, `utilities/flex-wrap.css`.

### 1. Stack

`.wa-stack` - vertical flex column. Modified via `.wa-align-items-*` and `.wa-gap-*`. Default gap is `--wa-space-m`.

### 2. Cluster

`.wa-cluster` - horizontal flex with wrapping. Default gap is `--wa-space-m`. Ideal for tags, chips, action groups.

### 3. Grid

`.wa-grid` and `.wa-span-grid`, plus the custom property `--min-column-size` (default `20ch`). Auto-fit responsive grid.

### 4. Split

`.wa-split`, `.wa-split:row`, `.wa-split:column` - distributes children with space-between.

### 5. Flank

`.wa-flank`, `.wa-flank:start`, `.wa-flank:end`. Custom properties `--flank-size` and `--content-percentage`. Sidebar plus content layout.

### 6. Frame

`.wa-frame`, `.wa-frame:square`, `.wa-frame:landscape`, `.wa-frame:portrait`, plus inline `aspect-ratio`. Composable with `.wa-border-radius-*` classes.

### 7. Alignment

This consolidates four current pages (Align Items, Justify Content, Flex Wrap, plus Align Self):

- `.wa-align-items-{start,end,center,stretch,baseline}`
- `.wa-align-self-{start,end,center,stretch,baseline}`
- `.wa-justify-content-{start,end,center,space-around,space-between,space-evenly}`
- `.wa-flex-wrap`, `.wa-flex-nowrap`, `.wa-flex-wrap-reverse`

Each gets its own H2 with a cross-axis or main-axis diagram.

## Overview Pages

Two new overview pages, both using the card grid pattern from `Guides / Agent Skills` but without icons.

### `Foundations / Overview`

A `wa-grid` with `--min-column-size: 320px` and 11 cards. Each card uses Kigumi's `Card` component (`appearance="outlined"`) and contains:

- An optional mini-preview at the top (visual hook).
- An `<h3>` with the topic name.
- A one-line description.
- A link to the topic page.

Mini-previews where they add value:

| Topic                        | Mini-Preview                             |
| ---------------------------- | ---------------------------------------- |
| Color                        | Five swatches in a row (brand fill loud) |
| Typography                   | "Aa" sample in two fonts                 |
| Spacing                      | Three sample sticks (s/m/l)              |
| Border & Radius              | Three boxes with s/m/l radii             |
| Elevation                    | Three boxes with s/m/l shadows           |
| Focus                        | Button with focus ring                   |
| Motion                       | Hover box demonstrating transition       |
| Visibility                   | (text only)                              |
| Native Elements              | Heading sample plus inline code          |
| Component Tokens             | Mini input plus mini tooltip             |
| Cascade Layers & Customizing | Stacked layer visual                     |

### `Layout / Overview`

Same card grid pattern, 7 cards. Every card has a visual mini-preview because layout is inherently visual:

| Topic     | Mini-Preview                       |
| --------- | ---------------------------------- |
| Stack     | Three boxes vertical               |
| Cluster   | Five pills horizontal with wrap    |
| Grid      | Four boxes in 2x2                  |
| Split     | Two boxes, one each side           |
| Flank     | Sidebar plus content schematic     |
| Frame     | Square with aspect ratio hint      |
| Alignment | Three boxes with cross-axis arrows |

## Bridge Work for Future Skills Sync

This restructure plants the seeds for a future project that auto-generates skill references and `llms.txt` content from the Storybook docs. Three deliberate decisions enable that:

### Frontmatter on every MDX file

Every Foundations and Layout MDX page gets a structured frontmatter block:

```yaml
---
title: Foundations/Color
tokens:
  - --wa-color-surface-default
  - --wa-color-surface-raised
  # ...
classes:
  - .wa-brand
  - .wa-success
  # ...
---
```

A future sync script can parse this frontmatter (no MDX AST traversal needed) to generate skill manifests.

### `TokenTable` as a single source

All tokens are rendered through one `TokenTable` component. A future sync script only needs to know one component to extract every documented token across the entire docs site.

### `docs/public/llms.txt` cleanup

The existing `llms.txt` mentions the upstream library by name and predates this restructure. As part of this project, that file is rewritten to:

- Remove all upstream library references.
- Reflect the current framework support (React, Vue, Svelte, Angular).
- Link to the new Foundations and Layout sidebar URLs.
- Stay focused on what consumers and agents actually need.

The full sync pipeline (auto-generated skill files, `kigumi-foundations` SKILL.md, build hooks) is **out of scope** and will be tracked as a separate follow-up project in memory.

## Phase Plan

Eight phases, each a single commit with a clean resume point.

| #   | Phase                        | Pages | Risk        | End State                                                                                                      |
| --- | ---------------------------- | ----- | ----------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | Setup & Primitives           | 0     | medium      | Worktree, folder structure, all 7 visual primitives in Storybook with stories, sidebar order updated. Validation via type-check + lint + build-storybook. |
| 2   | Token Pages Bundle           | 6     | low         | Focus, Motion, Elevation, Border & Radius, Spacing, Visibility live                                            |
| 3   | Heavy Pages                  | 3     | medium      | Typography, Native Elements, Component Tokens live (9 Foundations pages total)                                 |
| 4   | Color Page                   | 1     | high        | Color page live with all six clusters (10 pages total)                                                         |
| 5   | Cascade Layers & Customizing | 1     | medium-high | Final Foundations page live (11 pages total)                                                                   |
| 6   | Layout Migration             | 7     | low         | Layout group restructured: 7 pages (3 old pages consolidated into Alignment)                                   |
| 7   | Overview & Cleanup           | 2     | low         | Both overview pages live, old folders deleted, `llms.txt` cleaned, final sidebar order                         |
| 8   | Validation                   | 0     | high        | `validate:foundations` script passes, manual Storybook review complete, PR ready for review                    |

**Why this order:** Setup first because nothing else can be built. Token Pages second because they stress-test the primitives early and produce visible value quickly. Heavy Pages third because the pattern is established. Color is isolated because of its size. Cascade Layers comes after all other Foundations pages because it cross-references them. Layout migration is low-risk because the content already exists. Overview pages come after every topic page exists. Validation last as a safety net.

**Multi-session phases:** Phase 3 (three big pages) and Phase 4 (Color alone, around 300 tokens) will likely span multiple sessions. The two-tier memory strategy below handles that.

## Memory & Resumption Strategy

Two memory tiers, each with a distinct purpose.

### Tier 1: Persistent Project Memory

**File:** `~/.claude/projects/-Users-giregar-Documents-dev-git-kigumi-cli/memory/project-foundations-restructure.md`

**Purpose:** "I am starting a new session, what is this project?" - 50-line summary, linked from `MEMORY.md`, survives every context clear.

**Contents:** Project name, branch, spec path, plan path, live state path, current phase, key decisions, full phase list, last action, next action.

**Update trigger:** Phase boundary crossings and `Last Action` / `Next Action` changes.

### Tier 2: Live In-Worktree Status

**File:** `.claude/worktrees/feat/foundations-restructure/docs/superpowers/state/foundations-restructure-status.md`

**Purpose:** "I am mid-phase, what was I just doing?" - granular checklists, in-progress notes. Lives in the worktree, travels with the branch, archived or deleted at project completion.

**Contents:** Current phase header, per-file checklist, open issues and blockers, decisions made this session, concrete next-session actions.

**Update trigger:** After every completed file within a phase, on every blocker, on any decision that deviates from the spec.

### Update Workflow

```
Phase Start
  1. Tier 1: update Current Phase + Last Action
  2. Tier 2: append new phase section, copy checklist from plan
  3. Commit: chore(state): start phase X

Within Phase
  - Tier 2 update after each completed file
  - Tier 2 Open Issues for blockers
  - Tier 1 Last Action only if project-threatening

Phase End
  1. Tier 2: tick checkboxes, clear Next session
  2. Tier 1: advance Current Phase, update Last Action and Next Action
  3. Commit: chore(state): complete phase X
```

### Why Two Tiers

A single file would be either too long (Tier 1 with all details, hard to scan in 30 seconds) or too unspecific (Tier 2 with no big picture, hard to onboard from). Splitting them means:

- Tier 1 is always readable in 30 seconds, ideal for session start.
- Tier 2 is always current at the file level, no "where was I" hunting.
- On context clear: `MEMORY.md` points to Tier 1, Tier 1 points to Tier 2, Tier 2 names the next concrete action.

The spec and plan files in `docs/superpowers/specs/` and `docs/superpowers/plans/` are committed and survive even if both memory tiers are wiped.

## Validation

A new script `pnpm validate:foundations` performs the completeness check:

1. Parse `node_modules/@awesome.me/webawesome/dist/styles/themes/default.css`, `palettes/default.css`, `palettes/base.css`, `variants/*.css`, and `utilities/*.css` for every CSS custom property and every utility class selector.
2. Parse the frontmatter `tokens:` and `classes:` arrays from every MDX file in `docs/src/stories/foundations/` and `docs/src/stories/layout/`.
3. Diff: any token or class that exists in the source but is not referenced in any frontmatter is reported as a missing entry.
4. Reverse diff: any token or class in frontmatter that does not exist in the source is reported as a stale entry.

Exit code is non-zero if either diff is non-empty. The script runs in CI as part of the existing validation pipeline.

## Risks

- **Color page length** - around 300 tokens on one page may overwhelm. Mitigated by clear cluster sections with anchor links and a collapsible Raw Palette section.
- **Alignment consolidation** - merging four concepts into one page may confuse. Mitigated by clear H2 separation and one cross-axis or main-axis diagram per section.
- **Validation script correctness** - the script itself needs tests; otherwise it lies about completeness.
- **Phase 3 and 4 multi-session work** - the two-tier memory strategy is the explicit mitigation. If memory drift happens, fall back to reading the spec.

## Out of Scope

These are deliberately deferred to follow-up projects:

- Auto-generated skill manifest files (`kigumi-foundations/SKILL.md`).
- Build pipeline that derives `llms.txt` and skill references from MDX frontmatter.
- Rewriting the existing `kigumi-theme` skill references.
- Documenting alternative themes, palettes, or Pro features.
- Component-specific documentation pages (those live in the existing `Components` group and are not touched).

## Open Questions

Two non-blocking questions to resolve during implementation:

1. Should the completeness check live as `pnpm validate:foundations` (its own script) or as part of `pnpm validate:templates`? Recommendation: separate script, since templates and foundations are unrelated concerns.
2. Customizing code snippets - per page or central? Recommendation: each topic page shows its own override example; the Cascade Layers page explains the concept in the abstract and links to the topic pages.
