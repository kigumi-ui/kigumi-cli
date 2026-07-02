---
name: kigumi-angular
description: >
  Convert Web Awesome HTML snippets to Kigumi Angular components.
  Use when the user pastes WA HTML, copies code from webawesome.com/docs,
  asks to "convert to Angular", "transform to Kigumi Angular", or mentions
  wa-* tags needing Angular equivalents. Check kigumi.config.json for
  framework: "angular" to confirm this is an Angular project.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Transform Web Awesome to Kigumi Angular

Converts Web Awesome HTML to production-ready Kigumi Angular standalone components.

## Quick Start

Input (WA HTML from docs):

```html
<wa-dialog label="Confirm">
  <p>Are you sure?</p>
  <wa-button slot="footer" variant="primary">Yes</wa-button>
</wa-dialog>
```

Output (Kigumi Angular):

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DialogComponent } from '@/components/ui/Dialog/dialog.component';
import { ButtonComponent } from '@/components/ui/Button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [DialogComponent, ButtonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <k-dialog label="Confirm" (hide)="onHide()">
      <p>Are you sure?</p>
      <k-button slot="footer" variant="brand" (click)="onConfirm()"
        >Yes</k-button
      >
    </k-dialog>
  `,
})
export class ConfirmDialogComponent {
  onHide() {
    /* handle close */
  }
  onConfirm() {
    /* handle confirm */
  }
}
```

## How It Works

### Step 1: Read Config

Read `kigumi.config.json` in the project root. Confirm:

- `framework` is `"angular"`
- Note `componentsDir` (default: `src/components/ui`)
- Note `aliases` for import path resolution (default: `@/` maps to `src/`)
- `typescript` must be `true` (Angular requires TypeScript)

### Step 2: Detect Installed Components

List subdirectories of `componentsDir`. Each subdirectory name = installed component (e.g., `Button/`, `Dialog/`).

### Step 3: Parse WA HTML

Extract from the input:

- `<wa-*>` tag names -> component names (`wa-button` -> `Button`)
- Attributes -> Input bindings
- Event handlers -> Output bindings
- `slot="..."` attributes -> preserved as-is
- `class="wa-*"` utility classes -> preserved as-is
- `style="--wa-*"` custom properties -> preserved as-is

### Step 4: Generate Install Commands

For each `<wa-*>` tag that maps to a component NOT in the installed list:

```bash
npx kigumi add button dialog
```

Always output install commands BEFORE the component code.

## Transformation Rules

| WA HTML                           | Angular                                     |
| --------------------------------- | ------------------------------------------- |
| `<wa-button>`                     | `<k-button>`                                |
| `<wa-dialog>`                     | `<k-dialog>`                                |
| `<wa-option>`                     | `<k-option>`                                |
| `variant="primary"`               | `[variant]="'brand'"` or `variant="brand"`  |
| `variant="default"`               | omit (default is absence)                   |
| `disabled`                        | `[disabled]="true"` (never bare `disabled`) |
| `open`                            | `[open]="isOpen"` (bind to property)        |
| `class="wa-stack wa-gap-l"`       | `class="wa-stack wa-gap-l"` (same)          |
| `style="--wa-panel-padding: ..."` | `style="--wa-panel-padding: ..."` (same)    |
| `<div slot="header">`             | `<div slot="header">` (same)                |

### Attribute Binding Rules

- **String literals:** Plain attributes: `label="Confirm"`, `variant="brand"`
- **Dynamic values:** Property binding: `[label]="title"`, `[variant]="currentVariant"`
- **Boolean true:** `[disabled]="true"` (always use binding -- bare `disabled` passes `""` which fails `boolean` type check)
- **Boolean false:** `[disabled]="false"` (must use binding)
- **Expressions:** `[open]="isOpen"`, `[value]="formData.name"`

## Variant Mapping (Critical)

| WA HTML             | Angular                    |
| ------------------- | -------------------------- |
| `variant="primary"` | `variant="brand"`          |
| `variant="default"` | omit entirely              |
| `variant="success"` | `variant="success"` (same) |
| `variant="warning"` | `variant="warning"` (same) |
| `variant="danger"`  | `variant="danger"` (same)  |
| `variant="neutral"` | `variant="neutral"` (same) |

## Event Mapping

Angular Kigumi wrappers use `@Output()` EventEmitters. The wrapper strips the `wa-` prefix and camelCases the event name. When the resulting name collides with a DOM property or component method, an `Event` suffix is added.

### Event Collision Rules

| WA Event        | Angular Output | Reason                        |
| --------------- | -------------- | ----------------------------- |
| `wa-show`       | `(showEvent)`  | Collides with `show()` method |
| `wa-hide`       | `(hide)`       | No collision                  |
| `wa-after-show` | `(afterShow)`  | No collision                  |
| `wa-after-hide` | `(afterHide)`  | No collision                  |
| `blur`          | `(blurEvent)`  | Collides with DOM `blur`      |
| `focus`         | `(focusEvent)` | Collides with DOM `focus`     |
| `input`         | `(inputEvent)` | Collides with DOM `input`     |
| `change`        | `(change)`     | No collision                  |
| `invalid`       | `(invalid)`    | No collision                  |
| `wa-select`     | `(select)`     | No collision on Dropdown      |

**Rule:** When unsure about collision suffixes, check [Angular API Surface](../shared/angular-api-surface.md) for the exact `(outputName)` per component.

### Event Handler Syntax

```html
<!-- Simple handler -->
<k-dialog (hide)="onClose()">
  <!-- With $event -->
  <k-input (change)="onNameChange($event)">
    <!-- Multiple events -->
    <k-dialog
      (showEvent)="onShow()"
      (afterHide)="onAfterHide()"
    ></k-dialog></k-input
></k-dialog>
```

## Form Controls (ControlValueAccessor)

Kigumi Angular wrappers for form components implement `ControlValueAccessor`. They work natively with Angular's forms system.

### Template-driven (FormsModule)

```typescript
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, InputComponent],
  template: `<k-input [(ngModel)]="name" label="Name" />`,
})
export class MyForm {
  name = '';
}
```

### Reactive (ReactiveFormsModule)

```typescript
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule, InputComponent],
  template: `<k-input [formControl]="nameCtrl" label="Name" />`,
})
export class MyForm {
  nameCtrl = new FormControl('');
}
```

### CVA Components

These support `[(ngModel)]` and `[formControl]`: Input, Textarea, Select, Switch, Checkbox, Radio, RadioGroup, ColorPicker, Rating, Range, NumberInput, Combobox.

Do NOT manually wire `(change)` or `(inputEvent)` for value tracking. CVA handles it. Only use event bindings for side effects.

## Slot Syntax

Web component slots use the `slot` HTML attribute. Identical across React, Vue, and Angular:

```html
<k-card>
  <div slot="header">Card Title</div>
  <p>Card content in default slot</p>
  <div slot="footer">
    <k-button variant="brand">Save</k-button>
  </div>
</k-card>
```

Do NOT use Angular content projection (`<ng-content select="...">`) for Kigumi wrappers. The wrapper handles projection to the web component.

## Control Flow (Angular 17+)

Always use the modern block syntax, never structural directives:

```html
<!-- Conditional -->
@if (isLoggedIn) {
<k-button variant="brand">Dashboard</k-button>
} @else {
<k-button (click)="login()">Sign In</k-button>
}

<!-- Loop -->
@for (item of items; track item.id) {
<k-card>{{ item.name }}</k-card>
}

<!-- Switch -->
@switch (status) { @case ('active') {
<k-badge variant="success">Active</k-badge> } @case ('inactive') {
<k-badge variant="neutral">Inactive</k-badge> } }
```

Never output `*ngIf`, `*ngFor`, or `*ngSwitch`.

## Output Format

Every conversion outputs a complete standalone Angular component:

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// Only import FormsModule if form controls with ngModel are used:
import { FormsModule } from '@angular/forms';
// Import each Kigumi wrapper used:
import { ButtonComponent } from '@/components/ui/Button/button.component';
import { InputComponent } from '@/components/ui/Input/input.component';

@Component({
  selector: 'app-descriptive-name',
  standalone: true,
  imports: [FormsModule, ButtonComponent, InputComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: ` ... `,
})
export class DescriptiveNameComponent {
  // Properties and methods
}
```

### Import Path Convention

Components are imported from `@/components/ui/{Name}/{kebab-name}.component`:

- `Button` -> `@/components/ui/Button/button.component`
- `ButtonGroup` -> `@/components/ui/ButtonGroup/button-group.component`

The `@/` alias maps to `src/` via tsconfig paths.

### When to Include `schemas: [CUSTOM_ELEMENTS_SCHEMA]`

Always include it. Even if all `<wa-*>` tags are wrapped by Kigumi components, the inner web component tags exist in the DOM and Angular's template compiler needs the schema.

## Pro Components

Some WA Pro components have Lit type declarations that don't fully extend HTMLElement. When converting code that uses Pro components with direct element access:

```typescript
// If you need addEventListener on a Pro component ref:
const el = this.elementRef.nativeElement as unknown as HTMLElement;
el.addEventListener('wa-show', this.onShow);
```

Free components don't need this cast. Check the tier column in the [Angular API Surface](../shared/angular-api-surface.md).

## Style Hierarchy

Generated code must prefer WA utilities over inline styles:

1. **WA layout utility classes** -- `wa-stack`, `wa-grid`, `wa-cluster`, `wa-flank`, `wa-gap-m`, `wa-align-items-stretch`
2. **CSS custom properties on components** -- `style="--banner-height: 200px"`, `style="--wa-panel-padding: var(--wa-space-m)"`
3. **Inline styles only as last resort** -- when no class or custom property exists

Setting CSS custom properties via `style="--wa-x: y"` is correct usage, not an "inline style."

## Validation Checklist

Before outputting the converted component, verify:

- [ ] All `<wa-*>` tags converted to `<k-*>` equivalents
- [ ] `variant="primary"` mapped to `variant="brand"`
- [ ] `variant="default"` removed entirely
- [ ] Event names use correct collision suffixes (check API surface)
- [ ] Form controls use `[(ngModel)]` with FormsModule, not manual event wiring
- [ ] `slot="..."` attributes preserved as-is
- [ ] `class="wa-*"` utility classes preserved, no `className`
- [ ] `@if`/`@for` used, never `*ngIf`/`*ngFor`
- [ ] `standalone: true` and `schemas: [CUSTOM_ELEMENTS_SCHEMA]` present
- [ ] All component imports use `@/components/ui/` paths
- [ ] Missing components have `npx kigumi add` commands before the code

## Component API Reference

For the complete list of all 80 components with their Inputs, Outputs, Slots, Methods, and CSS Parts:

[Angular API Surface](../shared/angular-api-surface.md)

## Related Skills

- [kigumi-theme](../kigumi-theme/SKILL.md) -- CSS custom properties, dark mode, scale
- [compose-layout](../kigumi-compose-layout/SKILL.md) -- page layouts, dashboards
- [compose-form](../kigumi-compose-form/SKILL.md) -- forms with validation
- [compose-overlay](../kigumi-compose-overlay/SKILL.md) -- dialogs, drawers, toasts
- [compose-data](../kigumi-compose-data/SKILL.md) -- tables, lists, data display
