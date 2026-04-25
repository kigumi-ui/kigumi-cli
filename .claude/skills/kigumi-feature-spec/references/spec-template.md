# SPEC.md Template

Use this template as the starting point for every feature spec. Remove sections that don't apply to the feature type, and add type-specific sections as indicated.

---

## Template

````markdown
# {Feature Name} — Specification

> One-sentence summary of what this feature does and why it exists.

**Type:** Component | CLI | Framework | Build/Infra
**Status:** Draft | In Review | Approved
**Author:** {name}
**Date:** {date}
**Kigumi Version:** {current version from package.json}

## Overview

2-3 paragraphs explaining:

- What this feature is
- Why it's needed (the problem it solves)
- How it fits into the existing Kigumi architecture

## Goals

What this feature will achieve in v1. Be specific and measurable.

- Goal 1
- Goal 2

## Non-Goals

What this feature explicitly will NOT do. This is just as important as goals — it prevents scope creep and sets expectations.

- Non-goal 1 (and brief reason why it's deferred)
- Non-goal 2

## API Surface

How users interact with the feature. This section varies by feature type.

### For Components

#### Props

| Prop      | Type                                                         | Default     | Description                     |
| --------- | ------------------------------------------------------------ | ----------- | ------------------------------- |
| `variant` | `'neutral' \| 'brand' \| 'success' \| 'warning' \| 'danger'` | `'neutral'` | Visual variant of the component |

#### Events

| Event    | Detail Type   | Description                               |
| -------- | ------------- | ----------------------------------------- |
| `onShow` | `CustomEvent` | Emitted when the component begins to show |

Map Web Awesome events to framework-idiomatic names:

- `wa-show` → `onShow` (React) / `@show` (Vue)
- `wa-hide` → `onHide` (React) / `@hide` (Vue)

#### Slots

| Slot      | Description         |
| --------- | ------------------- |
| (default) | Main content        |
| `footer`  | Footer content area |

#### CSS Parts

| Part    | Description              |
| ------- | ------------------------ |
| `base`  | The root wrapper element |
| `label` | The text label           |

#### CSS Custom Properties

| Property             | Description             | Default                       |
| -------------------- | ----------------------- | ----------------------------- |
| `--wa-example-color` | Controls the text color | `var(--wa-color-neutral-700)` |

#### Methods (exposed via ref)

| Method   | Signature             | Description         |
| -------- | --------------------- | ------------------- |
| `show()` | `() => Promise<void>` | Shows the component |

#### Usage Examples

Show concrete code for each supported framework.

**React:**

```tsx
import { Button } from '@/components/Button';

function MyComponent() {
  return (
    <Button variant="brand" size="large">
      Click me
    </Button>
  );
}
```
````

**Vue:**

```vue
<template>
  <Button variant="brand" size="large">Click me</Button>
</template>
```

### For CLI Commands

#### Command Signature

```
kigumi {command} [positional-args] [--flags]
```

#### Arguments

| Argument | Required | Description               |
| -------- | -------- | ------------------------- |
| `name`   | Yes      | The component name to add |

#### Flags

| Flag        | Short | Type    | Default | Description                           |
| ----------- | ----- | ------- | ------- | ------------------------------------- |
| `--dry-run` | `-d`  | boolean | `false` | Preview changes without writing files |

#### Config Schema Changes

If the command modifies `kigumi.config.json`, show the schema diff:

```typescript
// Added to KigumiConfig
newField: z.string().optional().default('value');
```

#### User-Facing Messages

Key messages the user will see (success, error, prompts):

- Success: "✓ Added {component} to {path}"
- Error: "✗ Component {name} not found in registry"
- Prompt: "Which framework are you using?"

### For Framework Support

#### Framework integration points (detect-framework.ts branches, template.ts paths, templates/\<framework\>/ assets)

#### Template Pattern

Show what a generated component looks like in this framework.

#### Detection Strategy

How the framework is detected (what files/deps are checked, confidence levels).

### For Build/Infra

#### Affected Scripts

| Script                          | Change Type | Description     |
| ------------------------------- | ----------- | --------------- |
| `scripts/validate-templates.ts` | Modified    | Add check for X |

#### Pipeline Changes

Describe how the build/validation pipeline changes.

## Behavior & Edge Cases

Describe how the feature behaves in non-obvious situations. Use a "What happens when..." format:

- **What happens when** the user already has this component installed? → Show diff, ask to overwrite
- **What happens when** the config file is missing? → Fall back to defaults, warn
- **What happens when** the Web Awesome package is not installed? → Error with install instructions

## Dependencies

Other features or changes this feature depends on:

- [ ] Dependency 1 (status: done/in-progress/blocked)
- [ ] Dependency 2

## Breaking Changes

Does this feature break existing behavior? If yes:

- What breaks
- Migration path
- Can it be feature-flagged?

## Acceptance Criteria

Concrete, testable criteria that define "done":

- [ ] Criterion 1 (e.g., "Running `kigumi add button` generates a working React component")
- [ ] Criterion 2
- [ ] All existing tests pass (`pnpm test`)
- [ ] Type-check passes (`pnpm type-check`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Validation passes (`pnpm validate:registry && pnpm validate:templates`)

## Open Questions

Unresolved decisions that need input before or during implementation. Mark with ❓:

- ❓ Should we support X in v1 or defer to v2?
- ❓ What's the naming convention for Y?

```

---

## Writing Tips

**Be concrete, not abstract.** Instead of "the component supports theming", write: "The component exposes `--wa-button-background` and `--wa-button-color` CSS custom properties. Users override them in `theme.css` within the `@layer theme` block."

**Show, don't tell.** Every API decision should have a code example. If you can't write the example, the API isn't defined enough.

**Steal from existing specs.** If Button already handles prop X a certain way, reference it: "Follows the same pattern as Button (see `templates/react/Button/Button.tsx` line 15)."

**Keep Open Questions honest.** If you're not sure about something, say so. A spec with honest unknowns is better than one with hidden assumptions.
```
