# Feature Type Classification

Use this decision tree to determine the feature type. Some features span multiple types — in that case, pick the primary type for the spec structure and add sections from secondary types as needed.

## Decision Tree

```
Is the feature about wrapping a Web Awesome component?
├── Yes → COMPONENT
└── No
    ├── Does it add or change a CLI command/flag?
    │   ├── Yes → CLI
    │   └── No
    │       ├── Does it add or improve framework support?
    │       │   ├── Yes → FRAMEWORK
    │       │   └── No → BUILD/INFRA
    │       └── (catch-all for scripts, validation, CI, tooling)
```

## Feature Type Details

### Component

A new Web Awesome wrapper component added to the CLI templates and registry.

**Examples:** wa-combobox wrapper, wa-data-grid wrapper, wa-toast wrapper

**Discovery questions to ask:**

1. Which Web Awesome component is this wrapping? (Check if docs exist at `docs/node_modules/@awesome.me/webawesome-pro/dist/skills/webawesome/references/components/{name}.md`)
2. Is this a simple or complex component? (Does it have wa-\* events, imperative methods, or state props that need sync?)
3. Which props should be exposed in the wrapper API vs. left as pass-through?
4. Are there framework-specific concerns? (e.g., v-model binding for Vue, controlled/uncontrolled for React)
5. Does this component compose with other components? (e.g., dropdown-item inside dropdown)
6. Is it free or pro tier?
7. What category does it belong to? (Actions, Form Controls, Overlays, Display, Navigation, Layout, Data, Feedback)

**Key files to read:**

- WA component docs: `docs/node_modules/@awesome.me/webawesome-pro/dist/skills/webawesome/references/components/{name}.md`
- Registry: `src/utils/registry.ts`
- Complexity-matched existing template (simple: Button, complex: Dialog)
- Shared API surfaces: `.claude/skills/shared/react-api-surface.md`, `.claude/skills/shared/vue-api-surface.md`

### CLI

A new command, subcommand, or significant flag addition.

**Examples:** `kigumi search`, `kigumi migrate`, `kigumi add --dry-run`, `kigumi registry publish`

**Discovery questions to ask:**

1. What problem does this command solve? When would someone reach for it?
2. What's the command signature? (`kigumi <command> [args] [--flags]`)
3. Does it need interactive prompts? (Kigumi uses @clack/prompts)
4. Does it modify `kigumi.config.json`? If so, what schema changes?
5. Does it need network access? (e.g., fetching from a registry)
6. What happens on error? Should it be recoverable?
7. Should it support `--json` output for programmatic use?

**Key files to read:**

- Existing commands: `src/commands/` (pick the most similar one)
- Commander routing: `src/index.ts`
- Config schema: `src/schemas/config.ts`
- Error handling: `src/errors/`

### Framework

Adding or significantly improving support for a framework target.

**Examples:** Solid support, Qwik support, improving Vue template generation

**Discovery questions to ask:**

1. What's the minimum viable framework support? (detect → generate → test → docs)
2. What does the component wrapper look like in this framework? (Show a concrete example)
3. How does the framework handle web component interop? (Event forwarding, prop passing, slot projection)
4. What's the detection strategy? (package.json deps, config files, file patterns)
5. What test tooling does the framework use?
6. Are there TypeScript declaration needs specific to this framework?

**Key files to read:**

- Framework detection: `src/utils/detect-framework.ts` (per-framework branches + `ProjectInfo`)
- Component generation: `src/utils/template.ts` (`materializeTemplate` + per-framework code paths like Next.js `'use client'` injection)
- Template structure: `templates/react/` or `templates/vue/` (for pattern reference)
- Existing worktrees: `.claude/worktrees/` (check if work already started)

### Build/Infra

Changes to the build pipeline, validation scripts, development tooling, CI, or project infrastructure.

**Examples:** Adding a new validation script, changing the template compilation pipeline, adding parity checks, improving the quality hook

**Discovery questions to ask:**

1. What's broken or missing in the current setup?
2. Does this change affect the developer workflow? (Local dev, CI, or both?)
3. Is there a migration path for existing setups?
4. Does this introduce new dependencies?
5. Could this break existing templates or generated output?

**Key files to read:**

- Build config: `tsup.config.ts`, `package.json` scripts
- Validation scripts: `scripts/`
- Quality hooks: `.claude/hooks/`
- Metadata freshness: `scripts/check-metadata-freshness.ts`

## Hybrid Features

Some features span types. Common combinations:

- **Component + CLI**: Adding a component that also needs a new CLI flag (e.g., `--with-tests`)
- **Framework + Component**: Adding Angular support requires both a new plugin AND new templates
- **CLI + Build**: A new command that also changes the build output

For hybrids: use the primary type's structure for SPEC.md, then append sections from secondary types. The PLAN.md should have separate phases for each concern.
