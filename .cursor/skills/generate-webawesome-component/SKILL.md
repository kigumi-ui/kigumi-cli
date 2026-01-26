---
name: generate-webawesome-component
description: Generate React wrapper templates for Web Awesome components from documentation. Use when the user wants to add a new Web Awesome component to the CLI templates, create component wrappers, or mentions generating from webawesome.com/docs.
---

# Generate Web Awesome Component

This skill guides you through generating React wrapper templates for Web Awesome components by analyzing their documentation.

## When to Use

Use this skill when the user:

- Asks to add a new Web Awesome component (e.g., "add button-group to the CLI")
- Wants to generate templates from Web Awesome docs
- Provides a webawesome.com/docs/components/\* URL
- Mentions creating a wrapper for a wa-\* component

## Quick Start Workflow

```
1. [ ] Fetch and analyze Web Awesome documentation
2. [ ] Extract component metadata (props, events, methods)
3. [ ] Detect component complexity (simple vs complex)
4. [ ] Generate registry entry
5. [ ] Create template files (.tsx, .jsx, .test.tsx, .test.jsx, .css)
6. [ ] Validate templates
```

## Step 1: Fetch Documentation

Use WebFetch to get the component documentation:

```typescript
const url = `https://webawesome.com/docs/components/${componentName}`;
const html = await WebFetch(url);
```

## Step 2: Extract Metadata

Parse the HTML to extract structured data. Web Awesome docs follow a consistent structure:

### Component Name & Tag

- **H1 heading**: Component display name (e.g., "Button Group")
- **Code tag under H1**: Web component tag (e.g., `<wa-button-group>`)
- **First paragraph**: Component description

### Props (Attributes & Properties table)

Look for "Attributes & Properties" heading, then parse the table:

| Column                             | Extract                                |
| ---------------------------------- | -------------------------------------- |
| Name (both attribute and property) | `name` field                           |
| Type info                          | Parse to `type`, `values[]`, `default` |
| Description                        | `description` field                    |

**Type parsing examples:**

- `'horizontal' \| 'vertical'` → `type: 'string', values: ['horizontal', 'vertical']`
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
  category: inferCategory(metadata), // e.g., 'Actions', 'Form Controls'
  description: 'Button groups organize related buttons',
  dependencies: [], // e.g., ['button', 'icon']
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
    {
      name: 'orientation',
      type: 'string',
      values: ['horizontal', 'vertical'],
      default: 'horizontal',
      description: "Button group's orientation",
    },
    // ... more props
  ],
  importPath: '@awesome.me/webawesome/dist/components/button-group/button-group.js',
  tier: 'free', // or 'pro' based on docs
},
```

**Category inference:**

- Has "button" in name → 'Actions'
- Has "input", "select", "textarea" → 'Form Controls'
- Has "dialog", "drawer", "popover" → 'Overlays'
- Has "avatar", "badge", "icon" → 'Display'
- Default → 'Components'

## Step 5: Create Templates

Create directory: `templates/react/{ComponentName}/`

### 5a. TypeScript Component (.tsx.hbs)

**For simple components:**

```typescript
import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '{{{importPath}}}';
import './{{name}}.css';

export interface {{name}}Props extends HTMLAttributes<HTMLElement> {
  // Generate from metadata.props:
  // For each prop with values: name?: 'value1' | 'value2';
  // For boolean props: name?: boolean;
  // For string props: name?: string;
  // Add JSDoc comment with description
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

**For complex components (with events/methods):**

See `templates/react/Dialog/Dialog.tsx.hbs` as reference. Key additions:

- `useRef` for internal element reference
- `useImperativeHandle` for exposing methods
- `useEffect` for event listeners
- Ref interface with method signatures

### 5b. JavaScript Component (.jsx.hbs)

Same structure but:

- `import React from 'react';` (default import)
- `React.forwardRef`, `React.useRef`, etc.
- JSDoc comments instead of TypeScript types
- No interfaces, use JSDoc @typedef

### 5c. Test Files (.test.tsx.hbs, .test.jsx.hbs)

Generate basic render tests:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { {{name}} } from './{{name}}';

describe('{{name}}', () => {
  it('renders without crashing', () => {
    const { container } = render(<{{name}} />);
    expect(container.querySelector('{{tagName}}')).toBeInTheDocument();
  });

  // For complex components with methods:
  it('exposes ref methods', () => {
    const ref = React.createRef();
    render(<{{name}} ref={ref} />);
    expect(ref.current).toHaveProperty('methodName');
  });
});
```

### 5d. CSS File (.css.hbs)

```css
/* .{{name}} {
  CSS Parts: https://webawesome.com/docs/components/{{tagName.replace('wa-', '')}}#css-parts

  {{#each cssParts}}
  &::part({{name}}) {
    /* {{description}} */
  }
  {{/each}}
} */
```

## Step 6: Validate Templates

Check that generated templates:

- [ ] Use correct React import pattern (named for .tsx, default for .jsx)
- [ ] Use `class` not `className` on web components
- [ ] Forward refs correctly
- [ ] Import Web Component JS file
- [ ] Event listeners have cleanup in useEffect
- [ ] No TypeScript errors
- [ ] Follow AGENTS.md patterns

## Template Generation Helpers

### Props Interface Generation

```typescript
// From metadata:
{
  name: 'variant',
  type: 'string',
  values: ['neutral', 'brand'],
  default: 'neutral',
  description: 'Visual variant'
}

// Generates:
/** Visual variant */
variant?: 'neutral' | 'brand';
```

### Event Handler Generation (Complex)

```typescript
// From event: { name: 'wa-show', description: 'Emitted when opens' }

// Add to Props interface:
/** Callback when opens */
onShow?: (event: CustomEvent) => void;

// Add to component body:
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
// From method: { name: 'show', description: 'Shows element' }

// Create ref interface:
export interface {{name}}Ref {
  show: () => void;
  hide: () => void;
  element: HTMLElement | null;
}

// Add to component:
useImperativeHandle(ref, () => ({
  show: () => elementRef.current?.show?.(),
  hide: () => elementRef.current?.hide?.(),
  element: elementRef.current,
}), []);
```

## Common Pitfalls

1. **Don't use `className` on web components** - Use `class` attribute
2. **Remove `wa-` prefix from event props** - `wa-show` → `onShow`
3. **Add cleanup to event listeners** - Return cleanup function from useEffect
4. **Check tier restrictions** - Pro-only components go in tier: 'pro'
5. **Import web component JS** - Required for registration
6. **Use triple braces for importPath** - `{{{importPath}}}` to avoid escaping

## Additional Resources

- Reference existing templates: `templates/react/Button/` (simple), `templates/react/Dialog/` (complex)
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

✓ Created templates:
  - templates/react/ComponentName/ComponentName.tsx.hbs
  - templates/react/ComponentName/ComponentName.jsx.hbs
  - templates/react/ComponentName/ComponentName.test.tsx.hbs
  - templates/react/ComponentName/ComponentName.test.jsx.hbs
  - templates/react/ComponentName/ComponentName.css.hbs

Next steps:
1. Build CLI: pnpm build
2. Test: kigumi add component-name
```
