---
name: kigumi-react
description: >
  Convert Web Awesome HTML snippets to Kigumi React components.
  Use when the user pastes WA HTML, copies code from webawesome.com/docs,
  asks to "convert to React", "transform to Kigumi", or mentions
  wa-* tags needing React equivalents.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Transform Web Awesome to Kigumi React

Converts Web Awesome HTML code to production-ready Kigumi React components with proper imports, TypeScript support, and component detection.

## Quick Start

Paste Web Awesome HTML and ask to "convert to Kigumi React":

```html
<wa-card>
  <div slot="header">My Card</div>
  <wa-button variant="brand">Click me</wa-button>
</wa-card>
```

> Transforms to:

```tsx
import { Button, Card } from '@/components/ui';

<Card>
  <div slot="header">My Card</div>
  <Button variant="brand">Click me</Button>
</Card>;
```

## How It Works

This skill performs four key steps:

### 1. Read Project Configuration

Reads `kigumi.config.json` to determine:

- **Framework**: Must be "react" (otherwise suggest correct skill)
- **TypeScript**: true/false (affects output syntax)
- **ComponentsDir**: Component location (default: "src/components/ui")
- **Aliases**: Import path aliases (default: "@/components")

### 2. Detect Installed Components

Lists files in the `componentsDir` directory to identify which Kigumi components are already installed.

```
componentsDir/
├── Button/
├── Card/
└── Input/
```

= Installed components: Button, Card, Input

### 3. Parse Web Awesome HTML

Extracts all `<wa-*>` tags and identifies:

- Component names (e.g., `wa-button` → Button)
- Attributes and values
- Slot usage (`slot="header"`)
- CSS classes (`class="wa-heading-m"`)
- Inline styles

### 4. Generate Installation Commands

Compares required components against installed components:

```
Required: [Button, Card, Dialog]
Installed: [Button, Card]
Missing: [Dialog]
```

If components are missing:

```bash
# Install missing components first:
npx kigumi add dialog
```

## Transformation Rules

### Component Mapping

See [references/transformation-rules.md](references/transformation-rules.md) for complete mapping.

| Web Awesome   | Kigumi React   | Notes                    |
| ------------- | -------------- | ------------------------ |
| `<wa-button>` | `<Button>`     | Standard component       |
| `<wa-card>`   | `<Card>`       | Standard component       |
| `<wa-dialog>` | `<Dialog>`     | Has ref methods          |
| `<wa-input>`  | `<Input>`      | Form control             |
| `<wa-*>`      | `<PascalCase>` | Kebab-case to PascalCase |

### Attribute Transformation

| Web Awesome      | React             | Example                                                                        |
| ---------------- | ----------------- | ------------------------------------------------------------------------------ |
| `class="..."`    | `className="..."` | ALL elements -- both HTML (`<div>`) and Kigumi wrappers (`<Button>`, `<Card>`) |
| `style="..."`    | `style={{ }}`     | Object syntax                                                                  |
| Kebab-case props | Keep as-is        | `with-caret`, `light-dismiss`                                                  |
| `slot="..."`     | `slot="..."`      | Preserved                                                                      |
| `aria-*`         | `aria-*`          | Preserved                                                                      |
| `data-*`         | `data-*`          | Preserved                                                                      |
| Boolean attrs    | Prop only         | `disabled`, `loading`                                                          |

### Variant Mapping

WA docs/examples use variant names that differ from Kigumi's prop values:

| WA HTML             | Kigumi React        | Notes                              |
| ------------------- | ------------------- | ---------------------------------- |
| `variant="primary"` | `variant="brand"`   | "primary" does not exist in Kigumi |
| `variant="default"` | _(omit prop)_       | Default is the absence of variant  |
| `variant="success"` | `variant="success"` | Same                               |
| `variant="warning"` | `variant="warning"` | Same                               |
| `variant="danger"`  | `variant="danger"`  | Same                               |
| `variant="neutral"` | `variant="neutral"` | Same                               |

**Critical rule:** In React, ALWAYS use `className` -- on both standard HTML elements (`<div>`, `<span>`) AND Kigumi wrapper components (`<Button>`, `<Card>`, etc.). The Kigumi wrapper accepts `className` via its `HTMLAttributes` interface and internally passes it to the web component as `class={clsx('ComponentName', className)}`. Using `class` on a Kigumi React wrapper causes TS2322.

> **Note on CLAUDE.md rule #2:** CLAUDE.md says "`class` not `className` on `<wa-*>` elements." That rule applies to **template/wrapper source code** (the `.tsx.hbs` files that generate the wrapper internals). In **consumer code** (your app code using `<Button>`, `<Card>`, etc.), always use `className` because you are using React wrapper components, not raw `<wa-*>` elements.

### Event Handlers

See [references/event-mapping.md](references/event-mapping.md) for complete list.

| Web Awesome Event | React Handler | Type                                |
| ----------------- | ------------- | ----------------------------------- |
| `change`          | `onChange`    | Native `Event` (form controls)      |
| `input`           | `onInput`     | Native `InputEvent` (form controls) |
| `blur`            | `onBlur`      | Native `FocusEvent`                 |
| `focus`           | `onFocus`     | Native `FocusEvent`                 |
| `wa-show`         | `onWaShow`    | `CustomEvent` (overlays)            |
| `wa-hide`         | `onWaHide`    | `CustomEvent` (overlays)            |
| `wa-invalid`      | `onWaInvalid` | `CustomEvent` (form validation)     |

## Output Format

Always provide:

1. **Installation commands** (if components missing):

   ```bash
   npx kigumi add icon dialog
   ```

2. **Complete import statement**:

   ```tsx
   import { Button, Card, Icon, Dialog } from '@/components/ui';
   ```

3. **Functional component** (TypeScript or JavaScript based on config):

   ```tsx
   export default function MyComponent() {
     return (
       // Transformed JSX
     );
   }
   ```

4. **Brief explanation** of transformations made

## TypeScript vs JavaScript

Based on `kigumi.config.json` `typescript` field:

### TypeScript (typescript: true)

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';

export default function Example() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Dialog open={open} onHide={() => setOpen(false)}>
        Content
      </Dialog>
    </>
  );
}
```

### JavaScript (typescript: false)

```jsx
import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';

export default function Example() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Dialog open={open} onHide={() => setOpen(false)}>
        Content
      </Dialog>
    </>
  );
}
```

## Complex Components

Some components require special handling:

### Stateful Components (Dialog, Drawer, Dropdown)

```tsx
import { useState } from 'react';
import { Button, Dialog } from '@/components/ui';

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      <Dialog open={open} label="Dialog Title" onHide={() => setOpen(false)}>
        Dialog content
      </Dialog>
    </>
  );
}
```

### Components with Slots

```tsx
<Card>
  <div slot="header">
    <Icon slot="start" name="info" />
    <span>Card Header</span>
  </div>
  Main card content
  <div slot="footer">Footer content</div>
</Card>
```

## Edge Cases

### Self-Closing Tags

```html
<!-- Web Awesome -->
<wa-icon name="star"></wa-icon>

<!-- React -->
<Icon name="star" />
```

### Multiple Class Names

```html
<!-- Web Awesome (standard HTML element) -->
<div class="wa-cluster wa-gap-2">
  <!-- React (standard element → className) -->
  <div className="wa-cluster wa-gap-2"></div>
</div>
```

### Inline Styles

```html
<!-- Web Awesome -->
<form style="max-width: 60ch; margin: auto">

<!-- React -->
<form style={{ maxWidth: '60ch', margin: 'auto' }}>
```

### Boolean Attributes

```html
<!-- Web Awesome -->
<wa-button disabled loading>Click</wa-button>

<!-- React (Kigumi component) -->
<button disabled loading>Click</button>
```

## Validation Checklist

After transformation, verify:

- [ ] All `<wa-*>` tags mapped to Kigumi components
- [ ] `className` used on ALL elements (both HTML elements and Kigumi wrappers)
- [ ] Inline styles use React object syntax `{{ }}`
- [ ] Self-closing tags use JSX syntax `<Component />`
- [ ] Component names are PascalCase
- [ ] Imports use configured alias from config
- [ ] Web Awesome utility classes (`wa-*`) preserved
- [ ] Missing components have installation commands
- [ ] TypeScript/JavaScript matches config

## Component References

For detailed component APIs, props, and examples, see individual component references:

- [Button](references/components/button.md)
- [Card](references/components/card.md)
- [Dialog](references/components/dialog.md)
- [Input](references/components/input.md)
- [Icon](references/components/icon.md)
- [Full component list](references/transformation-rules.md)

## Troubleshooting

**Config not found:**

- Run `npx kigumi init` first to initialize the project

**Components not detected:**

- Verify `componentsDir` in `kigumi.config.json` points to correct location
- Ensure components are organized in subdirectories (e.g., `Button/Button.tsx`)

**Wrong framework:**

- This skill only works for React projects
- Check `framework` field in `kigumi.config.json`
- For Vue projects, use the `kigumi-vue` skill instead

## Related Skills

For multi-component composition patterns, use:

- **kigumi-compose-form** -- Build complete forms with validation and async submission
- **kigumi-compose-layout** -- Build page layouts using WA layout utilities
- **kigumi-compose-overlay** -- Build dialogs, drawers, dropdown menus, toasts
- **kigumi-compose-data** -- Build data tables, stats dashboards, list views
