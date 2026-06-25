---
name: kigumi-feature-spec
description: >
  Create structured feature specifications and implementation plans for Kigumi.
  Use this skill whenever the user wants to plan a new feature, spec a component,
  design a CLI command, add framework support, or discuss architecture changes.
  Triggers include: "plan", "spec", "feature", "new component", "add support for",
  "design the API for", "how should we implement", "what would it take to add",
  or any discussion about what a new Kigumi feature should look like before coding starts.
  This skill produces SPEC.md and PLAN.md documents — it does NOT write code or scaffold files.
user-invocable: false
internal: true
allowed-tools: Read, Glob, Grep, Bash, WebFetch
---

# Kigumi Feature Spec

This skill helps you create two documents for any new Kigumi feature:

1. **SPEC.md** — The contract. Defines what the feature does, its API surface, edge cases, and acceptance criteria. Written for anyone who needs to understand the feature (consumers, reviewers, future you).

2. **PLAN.md** — The roadmap. Breaks the implementation into phases with concrete file targets, task ordering, and session boundaries. Written for the implementor (you or an AI agent).

Both documents land in `specs/{feature-name}/` at the repo root.

## Workflow

### Phase 1: Discovery

Before writing anything, understand the feature. This phase is interactive — ask the user questions to narrow scope and surface constraints.

**Step 1: Classify the feature type.**

Read `references/feature-types.md` to determine which category applies. The four types are:

- **Component** — A new Web Awesome wrapper (React, Vue, Angular, Next.js)
- **CLI** — A new command, subcommand, or flag
- **Build/Infra** — Changes to the build pipeline, validation scripts, or dev tooling
- **Framework** — Adding or improving support for a framework target

Each type has different spec sections and different questions to ask. The reference file contains a decision tree and the specific questions for each type.

**Step 2: Gather context from the repo.**

Depending on the feature type, read these files to understand the current state:

| Feature type | Read these files                                                                                                                                                                                                                                                                 |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component    | `src/utils/registry.ts` (existing components), the relevant WA docs at `docs/node_modules/@awesome.me/webawesome-pro/dist/skills/webawesome/references/components/{name}.md`, and one existing template pair (e.g. `templates/react/Dialog/`) for a complexity-matched reference |
| CLI          | `src/commands/` (existing commands), `src/index.ts` (commander routing), `src/schemas/` (config schema)                                                                                                                                                                          |
| Build/Infra  | `scripts/`, `tsup.config.ts`, `package.json` scripts section, `.claude/hooks/`                                                                                                                                                                                                   |
| Framework    | `src/utils/detect-framework.ts` (detection branches), `src/utils/template.ts` (generation + per-framework code paths), `templates/<framework>/` (component templates for an existing framework like `templates/react/`)                                                          |

Always also read:

- `AGENTS.md` (root) — critical rules and architecture overview
- `CLAUDE.md` — hard constraints that apply to all work

**Step 3: Ask clarifying questions.**

Don't assume scope. Ask 3-5 targeted questions based on the feature type. Good questions surface:

- **Scope boundaries** — What's in v1 vs. what's deferred?
- **Edge cases** — What happens when X? What if the user already has Y?
- **Dependencies** — Does this need another feature first? Does it touch the config schema?
- **Trade-offs** — Performance vs. DX? Flexibility vs. simplicity?
- **Naming** — Component name, command name, flag names (naming is hard, decide early)

For components specifically, also ask about:

- Which props should be exposed vs. left on the raw `<wa-*>` element?
- Are there framework-specific considerations (e.g. v-model for Vue, controlled vs. uncontrolled for React)?
- Does the component have complex state (open/close, value sync) that needs special handling?

### Phase 2: Write the SPEC

Read `references/spec-template.md` for the full template. The template adapts per feature type — not every section applies to every feature.

**Core sections (all feature types):**

```
# {Feature Name} — Specification
## Overview
## Goals & Non-Goals
## API Surface
## Behavior & Edge Cases
## Acceptance Criteria
## Open Questions
```

**Component-specific sections:**

```
## Props
## Events
## Slots
## CSS Parts & Custom Properties
## Accessibility
## Framework-Specific Notes
```

**CLI-specific sections:**

```
## Command Interface
## Config Schema Changes
## User-Facing Messages
## Error Handling
```

**Build/Infra-specific sections:**

```
## Affected Scripts & Pipelines
## Migration Path
## Breaking Changes
```

**Framework-specific sections:**

```
## Plugin Interface Implementation
## Template Patterns
## Detection Strategy
## Test Strategy
```

Writing guidelines for the spec:

- Be concrete. Instead of "supports theming", write which CSS custom properties are exposed and what they control.
- Use tables for props, events, slots — they're scannable and precise.
- Include code examples showing the consumer-facing API. Show what it looks like to USE the feature, not how it's implemented internally.
- The "Open Questions" section is not optional. Every feature has unresolved decisions. Listing them explicitly prevents them from becoming hidden assumptions.
- Reference existing patterns. If Button does X, and this component should do X the same way, say so and link to the file.

### Phase 3: Write the PLAN

Read `references/plan-template.md` for the full template.

The plan breaks implementation into phases. Each phase has:

- **Goal** — What this phase achieves
- **File targets** — Exact paths that will be created or modified
- **Tasks** — Checkboxes, ordered by dependency
- **Acceptance criteria** — How to verify this phase is done
- **Session boundary** — Can this phase be done in one Claude Code session, or does it need multiple?

Standard phase ordering:

```
Phase 1: Analysis & Setup
Phase 2: Core Implementation
Phase 3: Framework Wrappers (if component)
Phase 4: Testing
Phase 5: Documentation & Validation
```

Planning guidelines:

- Each task should be achievable in a single Claude Code session (roughly 30-60 min of agent work). If a task is bigger, split it.
- Always include a "validate" step that runs `pnpm build && pnpm test && pnpm lint && pnpm type-check` — this is what the quality hook checks.
- For components, the plan should reference the `generate-component-wrapper` skill as the tool for Phase 2-3.
- Include rollback instructions if the feature touches shared infrastructure (config schema, registry format, etc.).
- End with "Next Steps" that connect to other skills or workflows (e.g., "Use `/generate-component-wrapper` to create the templates").

### Phase 4: Review & Iterate

After writing both documents, present them to the user and explicitly ask:

1. Does the scope match your expectations?
2. Are there missing edge cases?
3. Is the phasing realistic?
4. Any open questions you can already resolve?

Iterate until the user is satisfied. The spec is a living document — it's better to ship a "good enough" v1 and update it than to debate forever.

## Output

Save both files to `specs/{feature-name}/`:

```
specs/
└── {feature-name}/
    ├── SPEC.md
    └── PLAN.md
```

Use kebab-case for the feature name (e.g., `wa-combobox-wrapper`, `angular-support`, `registry-search-command`).

After saving, tell the user:

```
Created specs/{feature-name}/SPEC.md and specs/{feature-name}/PLAN.md

Next steps:
- Review both documents
- Resolve open questions marked with ❓
- When ready to implement, follow the plan phases in order
- For component features: use the generate-component-wrapper skill for Phase 2-3
```

## Important Context

### Web Awesome Documentation

Component docs are available locally — no need to fetch from the web:

```
docs/node_modules/@awesome.me/webawesome-pro/dist/skills/webawesome/references/components/{component-name}.md
```

The `llms.txt` file at `docs/node_modules/@awesome.me/webawesome-pro/dist/llms.txt` lists all available components with descriptions.

### Kigumi Architecture

Key architectural constraints to keep in mind when speccing features:

- **Templates-first**: Wrappers live as real framework source files under `templates/{react,vue,angular}/{Component}/`. The CLI reads them at install time and applies a single substitution (Free→Pro tier swap on the `@awesome.me/webawesome` import path).
- **Framework support**: Per-framework logic lives inline in `src/utils/template.ts` (generation) and `src/utils/detect-framework.ts` (detection). Adding a new framework means adding a `templates/<framework>/` directory, a detection branch in `detect-framework.ts`, and framework-specific code paths in `template.ts`.
- **Tier system**: Free vs. Pro components. Tier is detected from the installed package, never stored in config.
- **Registry as source of truth**: `src/utils/registry.ts` defines every component's metadata. New components must be added here.
- **Three-way merge**: Component updates use base/yours/theirs merge. This means templates must produce deterministic output.
- **CSS cascade layers**: `@layer base, theme` — base styles come from Web Awesome, theme styles are user-customizable.
- **`class` not `className`**: On `<wa-*>` elements in wrapper JSX, always use `class`. This is a hard rule from CLAUDE.md.

### Existing Skills

The `generate-component-wrapper` skill handles the actual template creation for components. This spec skill is the planning phase that comes before it. Don't duplicate its work — reference it as a downstream step.

The `shared/` directory contains `react-api-surface.md` and `vue-api-surface.md` which document the current API patterns across all components. Read these when speccing component APIs to stay consistent.
