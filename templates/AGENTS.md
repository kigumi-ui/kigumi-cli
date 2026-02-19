# Templates Guide

> Handlebars templates for component generation - extends [root AGENTS.md](../AGENTS.md)

## Directory Structure

```
templates/
└── react/
    └── {Component}/
        ├── {Component}.tsx.hbs    # TypeScript (with interfaces)
        ├── {Component}.jsx.hbs    # JavaScript (with JSDoc)
        ├── {Component}.test.tsx.hbs
        ├── {Component}.test.jsx.hbs
        └── {Component}.css.hbs
```

## Template Variables

Available in all `.hbs` templates:

| Variable           | Example                           | Description                 |
| ------------------ | --------------------------------- | --------------------------- |
| `{{{importPath}}}` | `@awesome.me/webawesome/dist/...` | Web Awesome import path     |
| `{{name}}`         | `Button`                          | Component name (PascalCase) |
| `{{tagName}}`      | `wa-button`                       | Web component tag           |
| `{{description}}`  | `Buttons represent actions...`    | From Web Awesome docs       |

---

## Component Patterns

### Simple Component (no events/methods)

Use for: Icon, Badge, Divider, Spinner, etc.

```typescript
import { forwardRef, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '{{{importPath}}}';
import './{{name}}.css';

export interface {{name}}Props extends HTMLAttributes<HTMLElement> {
  // Props matching wa-* attributes
}

export const {{name}} = forwardRef<HTMLElement, {{name}}Props>(
  ({ className, ...props }, ref) => (
    <wa-{{tagName}} ref={ref} class={clsx('{{name}}', className)} {...props} />
  )
);

{{name}}.displayName = '{{name}}';
```

### Complex Component (with events/methods)

Use for: Dialog, Drawer, Dropdown, Select, etc.

```typescript
import { forwardRef, useRef, useImperativeHandle, useEffect, type HTMLAttributes } from 'react';
import clsx from 'clsx';
import '{{{importPath}}}';
import './{{name}}.css';

export interface {{name}}Props extends Omit<HTMLAttributes<HTMLElement>, 'dir'> {
  // Props
  onShow?: (event: CustomEvent) => void;   // wa-show
  onHide?: (event: CustomEvent) => void;   // wa-hide
}

export interface {{name}}Ref {
  show: () => void;
  hide: () => void;
  element: HTMLElement | null;
}

export const {{name}} = forwardRef<{{name}}Ref, {{name}}Props>(
  ({ className, onShow, onHide, ...props }, ref) => {
    const internalRef = useRef<HTMLElement & { show?: () => void; requestClose?: () => void }>(null);

    useImperativeHandle(ref, () => ({
      show: () => internalRef.current?.show?.(),
      hide: () => internalRef.current?.requestClose?.(),
      get element() { return internalRef.current; },
    }), []);

    useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      const handleShow = (e: Event) => onShow?.(e as CustomEvent);
      const handleHide = (e: Event) => onHide?.(e as CustomEvent);

      el.addEventListener('wa-show', handleShow);
      el.addEventListener('wa-hide', handleHide);

      return () => {
        el.removeEventListener('wa-show', handleShow);
        el.removeEventListener('wa-hide', handleHide);
      };
    }, [onShow, onHide]);

    return (
      <wa-{{tagName}} ref={internalRef} class={clsx('{{name}}', className)} {...props} />
    );
  }
);

{{name}}.displayName = '{{name}}';
```

---

## Critical Rules

### 1. Use `class`, NOT `className`

```typescript
// Correct
<wa-button class={clsx('Button', className)}>

// Wrong
<wa-button className={className}>
```

### 2. React Import Style

**TypeScript (.tsx.hbs):** Named imports

```typescript
import { forwardRef, useRef, useEffect } from 'react';
```

**JavaScript (.jsx.hbs):** Default import

```javascript
import React from 'react';
const { forwardRef, useRef, useEffect } = React;
```

### 3. Event Naming Convention

**Form controls** (wa-button, wa-input, wa-number-input, wa-file-input, wa-textarea, wa-select, wa-checkbox, wa-switch) emit **native DOM events** — no `wa-` prefix:

| Native Event | React Prop |
| ------------ | ---------- |
| `blur`       | `onBlur`   |
| `focus`      | `onFocus`  |
| `input`      | `onInput`  |
| `change`     | `onChange` |

**Overlay/complex components** (wa-dialog, wa-drawer, wa-dropdown, wa-popup, etc.) emit **custom `wa-` events**:

| Web Awesome Event | React Prop    |
| ----------------- | ------------- |
| `wa-show`         | `onShow`      |
| `wa-hide`         | `onHide`      |
| `wa-after-show`   | `onAfterShow` |
| `wa-after-hide`   | `onAfterHide` |
| `wa-clear`        | `onClear`     |
| `wa-invalid`      | `onInvalid`   |

### 4. Always Cleanup Event Listeners

```typescript
useEffect(() => {
  const el = ref.current;
  if (!el) return;

  el.addEventListener('wa-show', handler);
  return () => el.removeEventListener('wa-show', handler); // REQUIRED
}, [dep]);
```

### 5. Use `requestClose()`, not `hide()`

For dialogs/drawers, Web Awesome uses `requestClose()`:

```typescript
hide: () => dialogRef.current?.requestClose(),
```

### 6. Omit Conflicting HTMLAttributes

Some wa-\* attributes conflict with HTMLAttributes:

```typescript
// Omit conflicting types
export interface DialogProps extends Omit<HTMLAttributes<HTMLElement>, 'onLoad' | 'dir'> {
```

---

## Adding New Components

1. **Check Web Awesome docs** at `https://webawesome.com/docs/components/{name}`
2. **Update registry** in `src/utils/registry.ts`
3. **Create template folder** in `templates/react/{Name}/`
4. **Create all files:**
   - `{Name}.tsx.hbs` (TypeScript)
   - `{Name}.jsx.hbs` (JavaScript)
   - `{Name}.test.tsx.hbs`
   - `{Name}.test.jsx.hbs`
   - `{Name}.css.hbs`
5. **Build and test:**
   ```bash
   pnpm build
   node dist/index.js add {name} --overwrite
   ```

---

## Reference Templates

| Pattern                   | Example                          |
| ------------------------- | -------------------------------- |
| Simple                    | `Button/Button.tsx.hbs`          |
| Complex (events)          | `Dialog/Dialog.tsx.hbs`          |
| Complex (two-way binding) | `Input/Input.tsx.hbs`            |
| Sub-components            | `Breadcrumb/`, `BreadcrumbItem/` |

---

**Parent:** [AGENTS.md](../AGENTS.md)
