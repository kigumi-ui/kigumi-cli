---
name: kigumi-react
description: Transforms Web Awesome HTML to Kigumi React components. Detects missing components and suggests installation via npx kigumi add. Use when converting wa-button, wa-card, wa-dialog, wa-input, wa-textarea, etc. to React.
license: MIT
metadata:
  author: Kigumi
  version: '1.0.0'
  homepage: https://kigumi.style
  repository: https://github.com/Siregar/kigumi-cli
compatibility: Works with Cursor, Claude Code, VS Code, and any Agent Skills compatible tool.
allowed-tools: Read, Glob
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

→ Transforms to:

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

| Web Awesome      | React                 | Example                       |
| ---------------- | --------------------- | ----------------------------- |
| `class="..."`    | `className="..."`     | Standard React                |
| `style="..."`    | `style={{ }}`         | Object syntax                 |
| Kebab-case props | Keep as-is            | `with-caret`, `light-dismiss` |
| `slot="..."`     | `slot="..."`          | Preserved                     |
| `aria-*`         | `aria-*`              | Preserved                     |
| `data-*`         | `data-*`              | Preserved                     |
| Boolean attrs    | `{true}` or prop only | `disabled`, `loading`         |

### Event Handlers

See [references/event-mapping.md](references/event-mapping.md) for complete list.

| Web Awesome Event | React Handler | Type                       |
| ----------------- | ------------- | -------------------------- |
| `wa-change`       | `onChange`    | `(e: CustomEvent) => void` |
| `wa-input`        | `onInput`     | `(e: CustomEvent) => void` |
| `wa-show`         | `onShow`      | `(e: CustomEvent) => void` |
| `wa-hide`         | `onHide`      | `(e: CustomEvent) => void` |

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
<!-- Web Awesome -->
<div class="wa-cluster wa-justify-content-end wa-gap-2">
  <!-- React -->
  <div className="wa-cluster wa-justify-content-end wa-gap-2"></div>
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
<wa-button disabled loading>
  <!-- React -->
  <button disabled loading></button
></wa-button>
```

## Validation Checklist

After transformation, verify:

- [ ] All `<wa-*>` tags mapped to Kigumi components
- [ ] `class` converted to `className`
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

---

**Documentation**: [kigumi.style](https://kigumi.style)
**Repository**: [github.com/Siregar/kigumi-cli](https://github.com/Siregar/kigumi-cli)
