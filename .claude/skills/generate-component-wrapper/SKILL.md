---
name: generate-component-wrapper
description: >
  Generate React (and Vue) wrapper templates for Web Awesome components
  from documentation. Use when the user wants to add a new Web Awesome
  component to the CLI templates, create component wrappers, generate
  from webawesome.com/docs, or scaffold a new wa-* wrapper.
user-invocable: true
allowed-tools: Read, Glob, Bash, WebFetch
---

# Generate Component Wrapper

This skill guides you through generating React and Vue wrapper templates for Web Awesome components by analyzing their documentation.

## When to Use

Use this skill when the user:

- Asks to add a new Web Awesome component (e.g., "add button-group to the CLI")
- Wants to generate templates from Web Awesome docs
- Provides a webawesome.com/docs/components/\* URL
- Mentions creating a wrapper for a wa-\* component

## Quick Start Workflow

```
1. [ ] Fetch and analyze Web Awesome documentation
2. [ ] Extract component metadata (props, events, methods, slots)
3. [ ] Detect component complexity (simple vs complex)
4. [ ] Generate registry entry
5. [ ] Create React template files (.tsx, .jsx, .test.tsx, .test.jsx, .css)
6. [ ] Create Vue template files (.vue, .js.vue, .test.ts, .test.js, .css)
7. [ ] Validate templates
```

## Step 1: Fetch Documentation

Use WebFetch to get the component documentation:

```
https://webawesome.com/docs/components/{componentName}
```

## Step 2: Extract Metadata

Parse the HTML to extract structured data. Web Awesome docs follow a consistent structure:

### Component Name & Tag

- **H1 heading**: Component display name (e.g., "Button Group")
- **Code tag under H1**: Web component tag (e.g., `<wa-button-group>`)
- **First paragraph**: Component description

### Props (Attributes & Properties table)

| Column                             | Extract                                |
| ---------------------------------- | -------------------------------------- |
| Name (both attribute and property) | `name` field                           |
| Type info                          | Parse to `type`, `values[]`, `default` |
| Description                        | `description` field                    |

**Type parsing examples:**

- `'horizontal' | 'vertical'` → `type: 'string', values: ['horizontal', 'vertical']`
- `boolean` → `type: 'boolean'`
- `number` → `type: 'number'`

### Events table

| Name      | Description       |
| --------- | ----------------- |
| `wa-show` | "Emitted when..." |

### Methods table

| Name     | Description    | Arguments              |
| -------- | -------------- | ---------------------- |
| `show()` | "Shows the..." | `options: ShowOptions` |

### Slots table

| Name        | Description      |
| ----------- | ---------------- |
| `(default)` | "Main content"   |
| `footer`    | "Footer content" |

### CSS Parts table

| Name   | Description    | CSS selector   |
| ------ | -------------- | -------------- |
| `base` | "Base wrapper" | `::part(base)` |

### Dependencies

Look for "Dependencies" section listing sub-components like `<wa-button>`, `<wa-icon>`.

### Import Path

In "Importing" section, npm tab shows:

```typescript
import '@awesome.me/webawesome/dist/components/button-group/button-group.js';
```

## Step 3: Detect Complexity

**Simple component** if:

- No custom events (only standard: blur, focus, input, change)
- No custom methods (only standard: focus, blur, select)
- No state props needing sync (open, checked, value)

**Complex component** if:

- Has wa-\* events (e.g., wa-show, wa-hide)
- Has imperative methods (e.g., show(), hide(), requestClose())
- Has state props requiring synchronization

**Examples:**

- Simple: Button, Input, Card, Badge, Icon, Button Group
- Complex: Dialog, Drawer, Dropdown, Popover, Color Picker

## Step 4: Generate Registry Entry

Add to `src/utils/registry.ts` in the LOCAL_REGISTRY object:

```typescript
'button-group': {
  name: 'ButtonGroup',
  tagName: 'wa-button-group',
  category: inferCategory(metadata),
  description: 'Button groups organize related buttons',
  dependencies: [],
  files: {
    react: [
      'components/ButtonGroup.tsx',
      'types/button-group.d.ts',
    ],
  },
  props: [
    {
      name: 'label',
      type: 'string',
      default: "''",
      description: 'Accessible label for screen readers',
    },
  ],
  importPath: '@awesome.me/webawesome/dist/components/button-group/button-group.js',
  tier: 'free',
},
```

**Category inference:**

- Has "button" in name → 'Actions'
- Has "input", "select", "textarea" → 'Form Controls'
- Has "dialog", "drawer", "popover" → 'Overlays'
- Has "avatar", "badge", "icon" → 'Display'
- Default → 'Components'

## Step 5: Create React Templates

Create directory: `templates/react/{ComponentName}/`

### 5a. TypeScript Component (.tsx.hbs)

**For simple components:**

```typescript
import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '{{{importPath}}}';
import './{{name}}.css';

export interface {{name}}Props extends HTMLAttributes<HTMLElement> {
  // Generate from metadata.props
}

export const {{name}} = forwardRef<HTMLElement, {{name}}Props>(
  ({ children, className, ...props }, ref) => {
    return (
      <{{tagName}} ref={ref} class={clsx('{{name}}', className)} {...props}>
        {children}
      </{{tagName}}>
    );
  }
);

{{name}}.displayName = '{{name}}';
```

**For complex components (with events/methods):** See `templates/react/Dialog/Dialog.tsx.hbs` as reference. Key additions: `useRef`, `useImperativeHandle`, `useEffect` for event listeners with cleanup.

### 5b. JavaScript Component (.jsx.hbs)

Same structure but with `import React from 'react'`, `React.forwardRef`, and JSDoc instead of TypeScript types.

### 5c. Test Files (.test.tsx.hbs, .test.jsx.hbs)

Generate basic render tests using vitest + @testing-library/react.

### 5d. CSS File (.css.hbs)

Include CSS Parts documentation as commented-out selectors.

## Step 6: Create Vue Templates

Create directory: `templates/vue/{ComponentName}/`

Vue templates follow a similar pattern. Reference the Vue template generator at `scripts/generate-vue-templates.ts` for the current approach.

### Vue Template Structure

- **TypeScript SFC** (`.vue.hbs`): `<script setup lang="ts">` with typed props via `defineProps`
- **JavaScript SFC** (`.js.vue.hbs`): `<script setup>` with runtime props
- **Test files** (`.test.ts.hbs`, `.test.js.hbs`): vitest + @vue/test-utils
- **CSS file** (`.css.hbs`): Same as React

### Current Vue Limitations

Vue templates are functional but generic — they pass all props via `v-bind="props"` and expose a default `<slot />`. Component-specific named slots, events, and methods are not yet generated. Users can access those via `elementRef.value` on the underlying web component.

See the [Vue Template Implementation memory](../../memory/MEMORY.md) for details on the current state and planned improvements.

## Step 7: Validate Templates

Check that generated templates:

- [ ] Use correct React import pattern (named for .tsx, default for .jsx)
- [ ] Use `class` on raw `<wa-*>` elements inside wrapper JSX (React < 19 custom element handling)
- [ ] Forward refs correctly
- [ ] Import Web Component JS file via `{{{importPath}}}` (triple braces)
- [ ] Event listeners have cleanup in useEffect
- [ ] No TypeScript errors
- [ ] Follow AGENTS.md patterns

## Template Generation Helpers

### Props Interface Generation

```typescript
// From metadata:
{ name: 'variant', type: 'string', values: ['neutral', 'brand'], default: 'neutral', description: 'Visual variant' }

// Generates:
/** Visual variant */
variant?: 'neutral' | 'brand';
```

### Event Handler Generation (Complex)

```typescript
// From event: { name: 'wa-show', description: 'Emitted when opens' }

// Props interface:
onShow?: (event: CustomEvent) => void;

// Component body (with cleanup):
useEffect(() => {
  const el = elementRef.current;
  if (!el) return;
  const handleShow = (e: Event) => onShow?.(e as CustomEvent);
  el.addEventListener('wa-show', handleShow);
  return () => el.removeEventListener('wa-show', handleShow);
}, [onShow]);
```

### Method Ref Generation (Complex)

```typescript
// Ref interface:
export interface {{name}}Ref {
  show: () => void;
  hide: () => void;
  element: HTMLElement | null;
}

// Component:
useImperativeHandle(ref, () => ({
  show: () => elementRef.current?.show?.(),
  hide: () => elementRef.current?.hide?.(),
  element: elementRef.current,
}), []);
```

## Common Pitfalls

1. **Use `class` on raw `<wa-*>` elements in wrapper templates** -- React < 19 has inconsistent custom element attribute handling; `class` is more reliable on raw web component tags. Note: this applies only to the wrapper's internal JSX, NOT to the consumer-facing API (consumers use `className` via HTMLAttributes).
2. **Remove `wa-` prefix from event props** — `wa-show` → `onShow`
3. **Add cleanup to event listeners** — Return cleanup function from useEffect
4. **Check tier restrictions** — Pro-only components go in tier: 'pro'
5. **Import web component JS** — Required for registration
6. **Use triple braces for importPath** — `{{{importPath}}}` to avoid Handlebars HTML escaping
7. **Both frameworks required** — Create React AND Vue templates for every component

## Additional Resources

- Reference existing templates: `templates/react/Button/` (simple), `templates/react/Dialog/` (complex)
- Vue template generator: `scripts/generate-vue-templates.ts`
- Registry format: `src/utils/registry.ts`
- Template patterns: See AGENTS.md "Component Template Pattern" section

## Output Format

When complete, show:

```
✓ Extracted metadata
  - Props: X
  - Events: X
  - Methods: X
  - Complexity: simple/complex

✓ Updated registry: src/utils/registry.ts
  - Added 'component-name' entry

✓ Created React templates:
  - templates/react/ComponentName/ComponentName.tsx.hbs
  - templates/react/ComponentName/ComponentName.jsx.hbs
  - templates/react/ComponentName/ComponentName.test.tsx.hbs
  - templates/react/ComponentName/ComponentName.test.jsx.hbs
  - templates/react/ComponentName/ComponentName.css.hbs

✓ Created Vue templates:
  - templates/vue/ComponentName/ComponentName.vue.hbs
  - templates/vue/ComponentName/ComponentName.js.vue.hbs
  - templates/vue/ComponentName/ComponentName.test.ts.hbs
  - templates/vue/ComponentName/ComponentName.test.js.hbs
  - templates/vue/ComponentName/ComponentName.css.hbs

Next steps:
1. Build CLI: pnpm build
2. Test React: kigumi add component-name --framework=react
3. Test Vue: kigumi add component-name --framework=vue
```
