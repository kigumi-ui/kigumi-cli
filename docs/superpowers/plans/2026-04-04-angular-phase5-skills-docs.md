# Phase 5: Angular Skills + Docs -- Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Angular support to all Kigumi agent skills and documentation so AI agents can generate correct Angular code.

**Architecture:** Foundation-first -- extend the generator script to produce `angular-api-surface.md`, build the `kigumi-angular` conversion skill on top of it, then update all 4 compose skills with separate Angular reference files (conditionally loaded), update all 4 AGENTS.md files, and validate everything via `ng build` + visual testing in kigumi-angular-starter.

**Tech Stack:** TypeScript, Handlebars templates, Angular 17+ standalone components, Web Awesome web components, pnpm

**Spec:** `docs/superpowers/specs/2026-04-04-angular-phase5-skills-docs-design.md`

---

## File Map

### New Files

| File                                                                           | Responsibility                                        |
| ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `.claude/skills/shared/angular-api-surface.md`                                 | Generated Angular component reference (73 components) |
| `.claude/skills/kigumi-angular/SKILL.md`                                       | WA HTML -> Angular conversion skill                   |
| `.claude/skills/kigumi-angular/evals/evals.json`                               | 10-12 eval assertions                                 |
| `.claude/skills/kigumi-compose-layout/references/layout-archetypes-angular.md` | Angular layout archetypes                             |
| `.claude/skills/kigumi-compose-form/references/form-patterns-angular.md`       | Angular form patterns                                 |
| `.claude/skills/kigumi-compose-overlay/references/overlay-patterns-angular.md` | Angular overlay patterns                              |
| `.claude/skills/kigumi-compose-data/references/data-patterns-angular.md`       | Angular data display patterns                         |

### Modified Files

| File                                             | Change                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `scripts/generate-skill-references.ts`           | Add `generateCompactAngularSurface()` + Angular template verification |
| `.claude/skills/kigumi-compose-layout/SKILL.md`  | Add Angular framework notes + conditional reference loading           |
| `.claude/skills/kigumi-compose-form/SKILL.md`    | Same                                                                  |
| `.claude/skills/kigumi-compose-overlay/SKILL.md` | Same                                                                  |
| `.claude/skills/kigumi-compose-data/SKILL.md`    | Same                                                                  |
| `AGENTS.md`                                      | Angular skill in table, template diagram, critical rules              |
| `src/AGENTS.md`                                  | Angular plugin patterns, generate-angular-templates.ts                |
| `templates/AGENTS.md`                            | Verify accuracy, add angular-api-surface.md cross-ref                 |
| `tests/AGENTS.md`                                | Angular eval structure, starter testing procedure                     |

---

## Task 1: Extend Generator Script for Angular API Surface

**Files:**

- Modify: `scripts/generate-skill-references.ts`
- Create: `.claude/skills/shared/angular-api-surface.md` (generated output)

### Context

The script (639 lines) already generates React and Vue surfaces from `custom-elements.json`. Key functions:

- `generateCompactReactSurface()` (lines 342-430) -- uses `deriveReactName()` for events (`wa-hide` -> `onHide`)
- `generateCompactVueSurface()` (lines 435-522) -- uses raw `@wa-hide` syntax
- `verifyEventNamesAgainstTemplates()` (lines 533-575) -- reads React `.tsx.hbs` files to confirm events exist
- `writeOutput()` (lines 577-590) -- writes both files

Angular event naming differs from both:

- Strip `wa-` prefix, camelCase, then check template for actual `@Output()` name
- Collision suffixes: `blur` -> `blurEvent`, `focus` -> `focusEvent`, `show` -> `showEvent`, `input` -> `inputEvent`
- Non-colliding: `wa-hide` -> `hide`, `wa-after-show` -> `afterShow`

Angular also adds ControlValueAccessor info for form controls. The templates mark this via `NG_VALUE_ACCESSOR` in the providers array.

- [ ] **Step 1: Read the current generator script**

Read `scripts/generate-skill-references.ts` in full to understand the exact structure before editing.

- [ ] **Step 2: Add `deriveAngularOutputName()` helper**

Add after the existing `deriveReactName()` function (around line 90). This function strips the `wa-` prefix and camelCases, matching the base Angular convention:

```typescript
/**
 * Derive the base Angular @Output() name from a WA event.
 * wa-after-hide -> afterHide, wa-show -> show, blur -> blur
 * Note: collision suffixes (blurEvent, showEvent) are handled by template verification.
 */
function deriveAngularBaseName(eventName: string): string {
  const stripped = eventName.replace(/^wa-/, '');
  return stripped.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
```

- [ ] **Step 3: Add `verifyAngularEventNames()` function**

Add after `verifyEventNamesAgainstTemplates()` (around line 575). This reads Angular `.component.ts.hbs` templates and extracts actual `@Output()` names to detect collision suffixes:

```typescript
/**
 * Verify Angular event names against actual .hbs templates.
 * Returns a Map<tagName, Map<ceEventName, angularOutputName>>.
 * If an event isn't found in the template, it's excluded (unimplemented).
 */
async function verifyAngularEventNames(
  ceMap: Map<string, ComponentCEMetadata>,
  registry: RegistryEntry[]
): Promise<Map<string, Map<string, string>>> {
  const result = new Map<string, Map<string, string>>();

  for (const entry of registry) {
    const tagName = `wa-${entry.name
      .toLowerCase()
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()}`;
    // Use the kebab-case name for Angular template paths
    const kebab = toKebabCase(entry.name);
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'angular',
      entry.name,
      `${kebab}.component.ts.hbs`
    );

    const ce = ceMap.get(tagName);
    if (!ce || ce.events.length === 0) continue;

    const eventMap = new Map<string, string>();

    try {
      const content = await fs.readFile(templatePath, 'utf-8');

      // Extract all @Output() names from the template
      const outputMatches = [...content.matchAll(/@Output\(\)\s+(\w+)/g)];
      const outputNames = new Set(outputMatches.map((m) => m[1]));

      for (const event of ce.events) {
        const baseName = deriveAngularBaseName(event.name);

        // Check if base name or suffixed name exists as @Output()
        if (outputNames.has(baseName)) {
          eventMap.set(event.name, baseName);
        } else if (outputNames.has(`${baseName}Event`)) {
          eventMap.set(event.name, `${baseName}Event`);
        }
        // If neither found, event is unimplemented -- skip it
      }
    } catch {
      // Template doesn't exist -- skip component
      continue;
    }

    if (eventMap.size > 0) {
      result.set(tagName, eventMap);
    }
  }

  return result;
}
```

Note: `toKebabCase` is already imported from `src/utils/naming.ts` (check the imports at the top of the file; if not imported, add it).

- [ ] **Step 4: Add `detectCVAComponents()` helper**

This reads Angular templates to detect which components implement ControlValueAccessor:

```typescript
/**
 * Detect which components implement ControlValueAccessor by checking for NG_VALUE_ACCESSOR in templates.
 */
async function detectCVAComponents(
  registry: RegistryEntry[]
): Promise<Set<string>> {
  const cvaComponents = new Set<string>();

  for (const entry of registry) {
    const kebab = toKebabCase(entry.name);
    const templatePath = path.join(
      process.cwd(),
      'templates',
      'angular',
      entry.name,
      `${kebab}.component.ts.hbs`
    );

    try {
      const content = await fs.readFile(templatePath, 'utf-8');
      if (content.includes('NG_VALUE_ACCESSOR')) {
        cvaComponents.add(`wa-${kebab}`);
      }
    } catch {
      continue;
    }
  }

  return cvaComponents;
}
```

- [ ] **Step 5: Add `generateCompactAngularSurface()` function**

Add after `generateCompactVueSurface()` (around line 522). Follow the exact same structure as the React/Vue generators but with Angular-specific formatting:

```typescript
function generateCompactAngularSurface(
  components: ComponentData[],
  angularEventMap: Map<string, Map<string, string>>,
  cvaComponents: Set<string>
): string {
  const lines: string[] = [
    '# Kigumi Angular API Surface',
    '',
    '> Auto-generated. Do not edit. Run `pnpm tsx scripts/generate-skill-references.ts` to regenerate.',
    '> Angular events use `(outputName)` syntax. Collision suffixes: blur->blurEvent, focus->focusEvent, show->showEvent, input->inputEvent.',
    '',
    '## Transformation Rules',
    '',
    '| HTML | Angular |',
    '|------|---------|',
    '| `<wa-button>` | `<k-button>` |',
    '| `class="x"` | `class="x"` (same) |',
    '| `variant="primary"` | `[variant]="\'brand\'"` |',
    '| `disabled` | `[disabled]="true"` |',
    '| `style="--wa-x: y"` | `style="--wa-x: y"` (same) |',
    '| `<div slot="header">` | `<div slot="header">` (same) |',
    '| Event: `wa-hide` | `(hide)="handler()"` |',
    '| Event: `blur` | `(blurEvent)="handler()"` (collision suffix) |',
    '| Form value | `[(ngModel)]="value"` (requires FormsModule) |',
    '',
    '---',
    '',
  ];

  for (const comp of components) {
    const selectorKebab = comp.tagName.replace('wa-', 'k-');

    lines.push(`## ${comp.name}`);
    lines.push(`${comp.category} | ${comp.tier} | ${comp.description}`);
    lines.push(
      `${comp.tagName} -> <${comp.name}> (selector: ${selectorKebab})`
    );
    lines.push('');

    // Props
    if (comp.props.length > 0) {
      lines.push(`**Inputs:** ${formatCompactProps(comp.props)}`);
    }

    // Events -- use Angular output names from template verification
    const componentEvents = angularEventMap.get(comp.tagName);
    if (componentEvents && componentEvents.size > 0) {
      const eventList = [...componentEvents.entries()]
        .map(([_ceEvent, angularName]) => `(${angularName})`)
        .join(', ');
      lines.push(`**Outputs:** ${eventList}`);
    }

    // Slots
    if (comp.slots.length > 0) {
      const slotList = comp.slots.map((s) => s.name || 'default').join(', ');
      lines.push(`**Slots:** ${slotList}`);
    }

    // Methods
    if (comp.methods.length > 0) {
      const methodList = comp.methods
        .map(
          (m) =>
            `${m.name}(${m.parameters?.map((p: { name: string }) => p.name).join(', ') ?? ''})`
        )
        .join(', ');
      lines.push(`**Methods:** ${methodList}`);
    }

    // CSS Parts
    if (comp.cssParts.length > 0) {
      const partList = comp.cssParts.map((p) => p.name).join(', ');
      lines.push(`**Parts:** ${partList}`);
    }

    // CSS Properties
    if (comp.cssProperties.length > 0) {
      const propList = comp.cssProperties.map((p) => `${p.name}`).join(', ');
      lines.push(`**CSS Props:** ${propList}`);
    }

    // CVA indicator
    const isCVA = cvaComponents.has(comp.tagName);
    if (isCVA) {
      lines.push(
        '**Form:** ControlValueAccessor -- `[(ngModel)]="value"` (FormsModule) or `[formControl]="ctrl"` (ReactiveFormsModule)'
      );
    }

    lines.push('');
  }

  return lines.join('\n');
}
```

Note: `ComponentData`, `formatCompactProps`, and other types/helpers are already defined earlier in the script. Read the existing `generateCompactReactSurface()` carefully to ensure the `comp` property names match exactly (the exploration shows `comp.props`, `comp.slots`, `comp.methods`, `comp.cssParts`, `comp.cssProperties` -- verify these against the actual `ComponentData` type in the script).

- [ ] **Step 6: Update `main()` to call Angular generation**

In the `main()` function (around line 592), add the Angular generation calls alongside the existing React/Vue ones:

```typescript
// After the existing React/Vue generation (around line 620):
const angularEventMap = await verifyAngularEventNames(ceMap, LOCAL_REGISTRY);
const cvaComponents = await detectCVAComponents(LOCAL_REGISTRY);
const angularSurface = generateCompactAngularSurface(
  components,
  angularEventMap,
  cvaComponents
);

// In the writeOutput section (around line 630), add:
const angularPath = path.join(
  process.cwd(),
  '.claude',
  'skills',
  'shared',
  'angular-api-surface.md'
);
await fs.writeFile(angularPath, angularSurface, 'utf-8');
console.log(`  Angular: ${angularPath}`);
```

Read the exact `main()` function structure before editing -- the variable names for `components`, `ceMap`, and the registry may differ slightly from what's shown here. Match the existing patterns.

- [ ] **Step 7: Run the generator and verify output**

```bash
cd /Users/giregar/Documents/dev/git/kigumi-cli
pnpm tsx scripts/generate-skill-references.ts
```

Expected: Script completes without errors, outputs three file paths including the new Angular one.

- [ ] **Step 8: Spot-check generated Angular surface**

Read `.claude/skills/shared/angular-api-surface.md` and verify:

1. **Button:** Outputs should show `(blurEvent)`, `(focusEvent)`, `(invalid)` -- not `(blur)`, `(focus)`
2. **Dialog:** Outputs should show `(showEvent)`, `(afterShow)`, `(hide)`, `(afterHide)` -- not `(show)`
3. **Input:** Should have `**Form:** ControlValueAccessor` line. Outputs should show `(inputEvent)`, `(change)`, `(blurEvent)`, `(focusEvent)`
4. **Card:** Should NOT have Form/CVA line
5. All 73 components should be present

Cross-check each against the actual `.hbs` template `@Output()` names. Templates are source of truth.

- [ ] **Step 9: Commit**

```bash
git add scripts/generate-skill-references.ts .claude/skills/shared/angular-api-surface.md
git commit -m "feat(skills): generate Angular API surface from templates

Extends generate-skill-references.ts with Angular output.
Reads @Output() names and NG_VALUE_ACCESSOR from .hbs templates
to produce accurate event names with collision suffixes and CVA markers."
```

---

## Task 2: Create `kigumi-angular` Conversion Skill

**Files:**

- Create: `.claude/skills/kigumi-angular/SKILL.md`

### Context

This skill converts WA HTML snippets to Angular standalone components using Kigumi wrappers. It mirrors the structure of `kigumi-react` and `kigumi-vue` skills but with Angular-specific syntax. Read both existing skills before writing this one.

Key Angular patterns (from `.hbs` templates):

- `k-` selector prefix (not `wa-` or app-)
- `standalone: true`, `schemas: [CUSTOM_ELEMENTS_SCHEMA]`
- `[attr.prop]="value"` for attribute binding
- `(outputName)="handler()"` for events, with collision suffixes
- `[(ngModel)]="value"` for form controls (requires `FormsModule` import)
- `@if (cond) { }` / `@for (item of items; track item.id) { }` control flow (Angular 17+)
- `slot="header"` attribute for web component slots (identical to React/Vue)

- [ ] **Step 1: Read existing skills for structure**

Read these files in full to understand the exact section structure, frontmatter format, and patterns:

- `.claude/skills/kigumi-react/SKILL.md`
- `.claude/skills/kigumi-vue/SKILL.md`

- [ ] **Step 2: Read Angular templates for accuracy**

Read these templates to verify transformation rules against actual generated code:

- `templates/angular/Button/button.component.ts.hbs`
- `templates/angular/Dialog/dialog.component.ts.hbs`
- `templates/angular/Input/input.component.ts.hbs`
- `templates/angular/Card/card.component.ts.hbs`

- [ ] **Step 3: Read the generated Angular API surface**

Read `.claude/skills/shared/angular-api-surface.md` (generated in Task 1) to understand what the skill will reference.

- [ ] **Step 4: Create the skill file**

Create `.claude/skills/kigumi-angular/SKILL.md` with the following structure. The content below is the complete skill -- write it as-is, then adjust details after reading the templates in steps 1-3:

```markdown
---
name: kigumi-angular
description: >
  Convert Web Awesome HTML snippets to Kigumi Angular components. Use when the user
  pastes WA HTML, copies code from webawesome.com/docs, asks to "convert to Angular",
  "transform to Kigumi", or mentions wa-* tags needing Angular equivalents.
  Check kigumi.config.json for framework: "angular" to confirm this is an Angular project.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Kigumi Angular Conversion

Convert Web Awesome HTML to Angular standalone components using Kigumi wrappers.

## Quick Start

Input (WA HTML from docs):
` `` html
<wa-dialog label="Confirm">

  <p>Are you sure?</p>
  <wa-button slot="footer" variant="primary">Yes</wa-button>
</wa-dialog>
` ``

Output (Kigumi Angular):
` `` typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { DialogComponent } from '@/components/ui/Dialog/dialog.component';
import { ButtonComponent } from '@/components/ui/Button/button.component';

@Component({
selector: 'app-confirm-dialog',
standalone: true,
imports: [DialogComponent, ButtonComponent],
schemas: [CUSTOM_ELEMENTS_SCHEMA],
template: `     <k-dialog label="Confirm" (hide)="onHide()">
      <p>Are you sure?</p>
      <k-button slot="footer" variant="brand" (click)="onConfirm()">Yes</k-button>
    </k-dialog>
  `,
})
export class ConfirmDialogComponent {
onHide() { /_ handle close _/ }
onConfirm() { /_ handle confirm _/ }
}
` ``

## How It Works

### Step 1: Read Config

Read `kigumi.config.json` in the project root. Confirm:

- `framework` is `"angular"`
- Note `componentsDir` (default: `src/components/ui`)
- Note `aliases` for import path resolution (default: `@/` -> `src/`)
- Note `typescript` must be `true` (Angular requires TypeScript)

### Step 2: Detect Installed Components

List subdirectories of `componentsDir`. Each subdirectory name = installed component (e.g., `Button/`, `Dialog/`).

### Step 3: Parse WA HTML

Extract from the input:

- `<wa-*>` tag names -> component names (wa-button -> Button)
- Attributes -> Input bindings
- Event handlers -> Output bindings
- `slot="..."` attributes -> preserved as-is
- `class="wa-*"` utility classes -> preserved as-is
- `style="--wa-*"` custom properties -> preserved as-is

### Step 4: Generate Install Commands

For each `<wa-*>` tag that maps to a component NOT in the installed list:
` ``bash
npx kigumi add button dialog ` ``

Always output install commands BEFORE the component code.

## Transformation Rules

| WA HTML                           | Angular                                  |
| --------------------------------- | ---------------------------------------- |
| `<wa-button>`                     | `<k-button>`                             |
| `<wa-dialog>`                     | `<k-dialog>`                             |
| `variant="primary"`               | `[variant]="'brand'"`                    |
| `variant="default"`               | omit (default is absence)                |
| `disabled`                        | `[disabled]="true"`                      |
| `open`                            | `[open]="isOpen"` (bind to property)     |
| `class="wa-stack wa-gap-l"`       | `class="wa-stack wa-gap-l"` (same)       |
| `style="--wa-panel-padding: ..."` | `style="--wa-panel-padding: ..."` (same) |
| `<div slot="header">`             | `<div slot="header">` (same)             |

### Attribute Binding Rules

- **String literals:** Use plain attributes: `label="Confirm"`, `variant="brand"`
- **Dynamic values:** Use property binding: `[label]="title"`, `[variant]="currentVariant"`
- **Boolean true:** `[disabled]="true"` or `disabled` (shorthand)
- **Boolean false:** `[disabled]="false"` (must use binding, not just omit)
- **Expressions:** `[open]="isOpen"`, `[value]="formData.name"`

### Variant Mapping (Critical)

| WA HTML             | Angular                    |
| ------------------- | -------------------------- |
| `variant="primary"` | `variant="brand"`          |
| `variant="default"` | omit entirely              |
| `variant="success"` | `variant="success"` (same) |
| `variant="warning"` | `variant="warning"` (same) |
| `variant="danger"`  | `variant="danger"` (same)  |
| `variant="neutral"` | `variant="neutral"` (same) |

## Event Mapping

Angular uses `@Output()` EventEmitters. The wrapper component strips the `wa-` prefix and camelCases. When the resulting name collides with a DOM property or component method, an `Event` suffix is added.

### Event Collision Rules

| WA Event        | Angular Output | Reason                                   |
| --------------- | -------------- | ---------------------------------------- |
| `wa-show`       | `(showEvent)`  | Collides with `show()` method            |
| `wa-hide`       | `(hide)`       | No collision                             |
| `wa-after-show` | `(afterShow)`  | No collision                             |
| `wa-after-hide` | `(afterHide)`  | No collision                             |
| `blur`          | `(blurEvent)`  | Collides with DOM `blur`                 |
| `focus`         | `(focusEvent)` | Collides with DOM `focus`                |
| `input`         | `(inputEvent)` | Collides with DOM `input`                |
| `change`        | `(change)`     | No collision                             |
| `invalid`       | `(invalid)`    | No collision                             |
| `wa-select`     | `(waSelect)`   | Varies by component -- check API surface |

**Rule:** When unsure about collision suffixes, check [Angular API Surface](../shared/angular-api-surface.md) for the exact `(outputName)` per component.

### Event Handler Syntax

` ``html

<!-- Simple handler -->

<k-dialog (hide)="onClose()">

<!-- With $event -->

<k-input (change)="onNameChange($event)">

<!-- Multiple events -->

<k-dialog (showEvent)="onShow()" (afterHide)="onAfterHide()">
` ``

## Form Controls (ControlValueAccessor)

Kigumi Angular wrappers for form components implement `ControlValueAccessor`. This means they work with Angular's forms system natively.

### Template-driven (FormsModule)

` ``typescript
import { FormsModule } from '@angular/forms';

@Component({
imports: [FormsModule, InputComponent],
template: `<k-input [(ngModel)]="name" label="Name" />`
})
export class MyForm {
name = '';
}
` ``

### Reactive (ReactiveFormsModule)

` ``typescript
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
imports: [ReactiveFormsModule, InputComponent],
template: `<k-input [formControl]="nameCtrl" label="Name" />`
})
export class MyForm {
nameCtrl = new FormControl('');
}
` ``

### CVA Components

These components support `[(ngModel)]` and `[formControl]`: Input, Textarea, Select, Switch, Checkbox, Radio, RadioGroup, ColorPicker, Rating, Range, NumberInput.

Do NOT manually wire `(change)` or `(inputEvent)` for value tracking -- CVA handles it. Only use event bindings for side effects (e.g., "clear search results when input changes").

## Slot Syntax

Web component slots use the `slot` HTML attribute. This is identical across React, Vue, and Angular:

` ``html
<k-card>

  <div slot="header">Card Title</div>
  <p>Card content in default slot</p>
  <div slot="footer">
    <k-button variant="brand">Save</k-button>
  </div>
</k-card>
` ``

Do NOT use Angular content projection syntax (`<ng-content select="...">`) -- the wrapper already handles projection to the web component.

## Control Flow (Angular 17+)

Always use the modern block syntax, not structural directives:

` ``html

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

@switch (status) {
@case ('active') { <k-badge variant="success">Active</k-badge> }
@case ('inactive') { <k-badge variant="neutral">Inactive</k-badge> }
}
` ``

Never output `*ngIf`, `*ngFor`, or `*ngSwitch`.

## Output Format

Every conversion outputs a complete standalone Angular component:

` ``typescript
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
template: `     ...
  `,
})
export class DescriptiveNameComponent {
// Properties and methods
}
` ``

### Import Path Convention

Components are imported from `@/components/ui/{Name}/{kebab-name}.component`:

- `Button` -> `@/components/ui/Button/button.component`
- `ButtonGroup` -> `@/components/ui/ButtonGroup/button-group.component`

The `@/` alias maps to `src/` via tsconfig paths.

### When to Include `schemas: [CUSTOM_ELEMENTS_SCHEMA]`

Always. Even if all `<wa-*>` tags are wrapped by Kigumi components, the inner web component tags exist in the DOM and Angular's template compiler needs the schema to accept them.

## Pro Components

Some WA Pro components have Lit type declarations that don't fully extend HTMLElement. When converting code that uses Pro components with direct element access:

` ``typescript
// If you need addEventListener on a Pro component ref:
const el = this.elementRef.nativeElement as unknown as HTMLElement;
el.addEventListener('wa-show', this.onShow); ` ``

Free components don't need this cast. Check the tier column in the [Angular API Surface](../shared/angular-api-surface.md).

## Style Hierarchy

Generated code must prefer WA utilities over inline styles:

1. **WA layout utility classes** -- `wa-stack`, `wa-grid`, `wa-cluster`, `wa-flank`, `wa-gap-m`, `wa-align-items-stretch`
2. **CSS custom properties on components** -- `style="--banner-height: 200px"`, `style="--wa-panel-padding: var(--wa-space-m)"`
3. **Inline styles only as last resort** -- when no class or custom property exists

Setting CSS custom properties via `style="--wa-x: y"` is correct, not an "inline style."

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

For the complete list of all 73 components with their Inputs, Outputs, Slots, Methods, and CSS Parts:

[Angular API Surface](../shared/angular-api-surface.md)

## Related Skills

- [kigumi-theme](../kigumi-theme/SKILL.md) -- CSS custom properties, dark mode, scale
- [compose-layout](../kigumi-compose-layout/SKILL.md) -- page layouts, dashboards
- [compose-form](../kigumi-compose-form/SKILL.md) -- forms with validation
- [compose-overlay](../kigumi-compose-overlay/SKILL.md) -- dialogs, drawers, toasts
- [compose-data](../kigumi-compose-data/SKILL.md) -- tables, lists, data display
```

Note: The backtick fencing in the code examples above uses spaces for escaping in this plan. In the actual file, use standard triple backticks.

- [ ] **Step 5: Verify skill references resolve**

Confirm that `../shared/angular-api-surface.md` exists (created in Task 1) and that the referenced component import paths match the actual Angular starter structure.

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/kigumi-angular/SKILL.md
git commit -m "feat(skills): add kigumi-angular conversion skill

Converts WA HTML to Angular standalone components with Kigumi wrappers.
Covers: variant remap, event collision suffixes, CVA/ngModel, slots,
control flow (@if/@for), and Pro component handling."
```

---

## Task 3: Create `kigumi-angular` Evals

**Files:**

- Create: `.claude/skills/kigumi-angular/evals/evals.json`

### Context

Evals follow the format used by `kigumi-vue/evals/evals.json`: each eval has an `id`, `prompt`, `expected_output`, `files`, and `expectations` array. Expectations are prose assertions that can be evaluated as true/false.

- [ ] **Step 1: Read existing evals for format reference**

Read `.claude/skills/kigumi-vue/evals/evals.json` to confirm the exact JSON structure.

- [ ] **Step 2: Create the evals file**

Create `.claude/skills/kigumi-angular/evals/evals.json`:

```json
{
  "skill_name": "kigumi-angular",
  "evals": [
    {
      "id": 1,
      "prompt": "Convert this WA HTML to an Angular component:\n<wa-button variant=\"primary\" size=\"large\">Submit</wa-button>",
      "expected_output": "A standalone Angular component using <k-button> with variant=\"brand\" and size=\"large\"",
      "files": [],
      "expectations": [
        "Uses <k-button> not <wa-button>",
        "Maps variant=\"primary\" to variant=\"brand\"",
        "Includes standalone: true in @Component decorator",
        "Includes schemas: [CUSTOM_ELEMENTS_SCHEMA]",
        "Imports ButtonComponent from @/components/ui/Button/button.component",
        "Does not use className anywhere"
      ]
    },
    {
      "id": 2,
      "prompt": "Convert this form to Angular:\n<wa-input label=\"Email\" type=\"email\" required></wa-input>\n<wa-switch>Enable notifications</wa-switch>\n<wa-button variant=\"primary\" type=\"submit\">Save</wa-button>",
      "expected_output": "Angular component with FormsModule, [(ngModel)] on Input and Switch, variant brand on Button",
      "files": [],
      "expectations": [
        "Imports FormsModule from @angular/forms",
        "Uses [(ngModel)] on k-input, not manual (inputEvent) for value tracking",
        "Uses [(ngModel)] on k-switch, not manual (change) for value tracking",
        "Maps variant=\"primary\" to variant=\"brand\"",
        "Generates npx kigumi add commands for any components not installed"
      ]
    },
    {
      "id": 3,
      "prompt": "Convert this dialog to Angular:\n<wa-dialog label=\"Delete Item\">\n  <p>This action cannot be undone.</p>\n  <wa-button slot=\"footer\" variant=\"default\">Cancel</wa-button>\n  <wa-button slot=\"footer\" variant=\"danger\">Delete</wa-button>\n</wa-dialog>",
      "expected_output": "Angular component with Dialog and Button, correct event names and slot usage",
      "files": [],
      "expectations": [
        "Uses (hide) for dialog close event, not (waHide) or (onHide)",
        "Uses (showEvent) if show event is handled (collision with show() method)",
        "Preserves slot=\"footer\" on both buttons",
        "Omits variant prop on Cancel button (variant=\"default\" means omit)",
        "Uses variant=\"danger\" on Delete button (no remap needed)"
      ]
    },
    {
      "id": 4,
      "prompt": "Convert this card layout to Angular:\n<div class=\"wa-grid\" style=\"--min-column-size: 300px\">\n  <wa-card>\n    <div slot=\"header\">Title</div>\n    <p>Content</p>\n  </wa-card>\n  <wa-card>\n    <div slot=\"header\">Title 2</div>\n    <p>Content 2</p>\n  </wa-card>\n</div>",
      "expected_output": "Angular component preserving wa-grid class and CSS custom property, with Card wrappers and slot attributes",
      "files": [],
      "expectations": [
        "Preserves class=\"wa-grid\" on the wrapper div",
        "Preserves style=\"--min-column-size: 300px\" (CSS custom property, not an inline style to remove)",
        "Uses <k-card> not <wa-card>",
        "Preserves slot=\"header\" attribute on header divs",
        "Does not convert class to className"
      ]
    },
    {
      "id": 5,
      "prompt": "Convert this to Angular, showing a list of users:\n<wa-card>\n  <div slot=\"header\">Users</div>\n  <div *ngFor=\"let user of users\">\n    <wa-avatar label=\"{{user.name}}\"></wa-avatar>\n    <span>{{user.name}}</span>\n  </div>\n</wa-card>",
      "expected_output": "Angular component using @for syntax (not *ngFor), with Avatar and Card wrappers",
      "files": [],
      "expectations": [
        "Converts *ngFor to @for with track expression",
        "Uses @for (user of users; track user.id) or track $index",
        "Does not output *ngFor or *ngIf anywhere",
        "Uses <k-card> and <k-avatar> wrappers"
      ]
    },
    {
      "id": 6,
      "prompt": "I have a Vue project with framework: \"angular\" -- wait, convert this HTML:\n<wa-button>Click</wa-button>",
      "expected_output": "Reads kigumi.config.json, detects framework is angular, outputs Angular component",
      "files": [],
      "expectations": [
        "Reads kigumi.config.json to determine the framework",
        "Outputs Angular component syntax (not Vue SFC)",
        "Uses @Component decorator, not <script setup>"
      ]
    },
    {
      "id": 7,
      "prompt": "Convert this to Angular:\n<wa-input label=\"Search\" (input)=\"onSearch($event)\">\n  <wa-icon slot=\"prefix\" name=\"search\"></wa-icon>\n</wa-input>",
      "expected_output": "Angular component with Input wrapper, correct event name, and Icon in prefix slot",
      "files": [],
      "expectations": [
        "Uses (inputEvent) not (input) for the input event (collision suffix)",
        "Preserves slot=\"prefix\" on the Icon",
        "Uses <k-input> and <k-icon> wrappers"
      ]
    },
    {
      "id": 8,
      "prompt": "Convert to Angular. The project has Button and Card installed but not Dialog:\n<wa-dialog label=\"Info\">\n  <wa-card><p>Details</p></wa-card>\n  <wa-button slot=\"footer\" variant=\"primary\">OK</wa-button>\n</wa-dialog>",
      "expected_output": "Install command for Dialog before the component code",
      "files": [],
      "expectations": [
        "Generates npx kigumi add dialog (or similar install command)",
        "Install command appears BEFORE the component code",
        "Does not generate install commands for Button or Card (already installed)",
        "Uses variant=\"brand\" not variant=\"primary\""
      ]
    },
    {
      "id": 9,
      "prompt": "Convert this reactive form to Angular:\n<form>\n  <wa-input label=\"Name\" required></wa-input>\n  <wa-textarea label=\"Bio\" rows=\"4\"></wa-textarea>\n  <wa-select label=\"Role\">\n    <wa-option value=\"admin\">Admin</wa-option>\n    <wa-option value=\"user\">User</wa-option>\n  </wa-select>\n  <wa-button variant=\"primary\" type=\"submit\">Save</wa-button>\n</form>",
      "expected_output": "Angular component with FormsModule, ngModel bindings on all form controls",
      "files": [],
      "expectations": [
        "Uses [(ngModel)] on k-input, k-textarea, and k-select",
        "Imports FormsModule",
        "Maps variant=\"primary\" to variant=\"brand\"",
        "Preserves rows=\"4\" on Textarea (or converts to [rows]=\"4\")",
        "Handles wa-option elements (these are native web component children, not Kigumi wrappers)"
      ]
    },
    {
      "id": 10,
      "prompt": "Convert this conditional layout to Angular:\n<div>\n  <wa-spinner *ngIf=\"loading\"></wa-spinner>\n  <wa-alert *ngIf=\"error\" variant=\"danger\">{{error}}</wa-alert>\n  <div *ngIf=\"data\">\n    <wa-badge>{{data.count}} items</wa-badge>\n  </div>\n</div>",
      "expected_output": "Angular component using @if blocks, not *ngIf directives",
      "files": [],
      "expectations": [
        "Converts all *ngIf to @if blocks",
        "Uses @if (loading) { <k-spinner /> }",
        "Uses @if (error) { <k-alert variant=\"danger\"> }",
        "Uses @if (data) { ... } for the data block",
        "Uses Kigumi wrappers (k-spinner, k-alert, k-badge)"
      ]
    }
  ]
}
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/kigumi-angular/evals/evals.json
git commit -m "test(skills): add kigumi-angular evals

10 eval prompts covering: variant remap, CVA/ngModel, event collision
suffixes, slot syntax, control flow, missing component detection,
layout utilities, and framework detection."
```

---

## Task 4: Update compose-layout for Angular

**Files:**

- Create: `.claude/skills/kigumi-compose-layout/references/layout-archetypes-angular.md`
- Modify: `.claude/skills/kigumi-compose-layout/SKILL.md`

### Context

The compose-layout skill has 6 archetypes (App Shell, Dashboard, Settings Page, Landing Page, Data Browser, Page Shell). The existing React/Vue code is in `references/layout-archetypes.md`. Read it first, then convert each archetype to Angular.

The style rule is critical here: use WA layout utility classes (`wa-stack`, `wa-grid`, `wa-flank`, `wa-sidebar`) and CSS custom properties, never inline `display: flex` / `gap` / etc.

- [ ] **Step 1: Read existing layout references**

Read these files in full:

- `.claude/skills/kigumi-compose-layout/SKILL.md` (especially Framework Notes section and Critical Rules)
- `.claude/skills/kigumi-compose-layout/references/layout-archetypes.md`
- `.claude/skills/kigumi-compose-layout/references/layout-utilities-complete.md`
- `.claude/skills/kigumi-compose-layout/references/responsive-patterns.md`

- [ ] **Step 2: Read Angular starter for verification context**

Read `~/Documents/dev/git/kigumi-angular/tsconfig.json` and `~/Documents/dev/git/kigumi-angular/angular.json` to confirm build settings.

- [ ] **Step 3: Create Angular layout archetypes reference**

Create `.claude/skills/kigumi-compose-layout/references/layout-archetypes-angular.md`.

**Structure:** One section per archetype, each containing a complete standalone Angular component. Convert every archetype from the React/Vue reference to Angular, following these rules:

- `class` not `className` (same as Vue)
- `@if` / `@for` control flow, never `*ngIf` / `*ngFor`
- `[(ngModel)]` for any form inputs (with FormsModule import)
- `(outputName)` event syntax with collision suffixes
- `slot="header"` for web component slots
- WA layout utility classes for all layout: `wa-stack`, `wa-grid`, `wa-cluster`, `wa-flank`, `wa-sidebar`, gap modifiers
- CSS custom properties via `style="--prop: value"` for component tokens
- No arbitrary inline styles when a utility class exists
- `standalone: true`, `schemas: [CUSTOM_ELEMENTS_SCHEMA]` always
- Import components from `@/components/ui/{Name}/{kebab-name}.component`
- Pro tier: use `<k-page>` component with `style="--banner-height: ..."` when available; show Free fallback with `.wa-sidebar` layout

Each archetype should be a complete, compilable component. Read the source archetype carefully and convert every pattern -- do not skip or simplify.

- [ ] **Step 4: Update compose-layout SKILL.md**

Add Angular to the Framework Notes section and the conditional reference loading. Find the existing framework notes (around line 124) and add Angular:

In the **Critical Rules** section, update rule #1:

```markdown
1. **React: `className`. Vue/Angular: `class`.** Both HTML elements and Kigumi wrappers.
```

In the **Framework Notes** section, add:

```markdown
**Angular:** `class="wa-stack wa-gap-l"`, custom properties via `style="--min-column-size: 250px"` (same as Vue). `@if`/`@for` for control flow. `[(ngModel)]` for form inputs with FormsModule.
```

In the **References** section, add:

```markdown
- [Angular Layout Archetypes](references/layout-archetypes-angular.md) -- all archetypes as Angular standalone components
- [Angular API Surface](../shared/angular-api-surface.md) -- component inputs, outputs, slots, CSS parts
```

In the **Framework Adaptation** section (or wherever the skill conditionally selects patterns), add:

```markdown
If `framework: "angular"` in `kigumi.config.json`, use Angular archetypes from `references/layout-archetypes-angular.md` instead of the React/Vue versions.
```

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/kigumi-compose-layout/
git commit -m "feat(skills): add Angular archetypes to compose-layout

Adds layout-archetypes-angular.md with all archetypes as Angular
standalone components. Updates SKILL.md for conditional loading."
```

---

## Task 5: Update compose-form for Angular

**Files:**

- Create: `.claude/skills/kigumi-compose-form/references/form-patterns-angular.md`
- Modify: `.claude/skills/kigumi-compose-form/SKILL.md`

### Context

The compose-form skill covers form validation, error states, and async submission. Angular has two forms approaches: template-driven (FormsModule + ngModel) and reactive (ReactiveFormsModule + FormControl). The reference should show both.

- [ ] **Step 1: Read existing form references**

Read these files in full:

- `.claude/skills/kigumi-compose-form/SKILL.md` (especially Framework Adaptation section)
- `.claude/skills/kigumi-compose-form/references/form-patterns.md`
- `.claude/skills/kigumi-compose-form/references/form-component-cheatsheet.md`
- `.claude/skills/kigumi-compose-form/references/validation-patterns.md`

- [ ] **Step 2: Read Angular form-control templates for accuracy**

Read these to understand CVA implementation details:

- `templates/angular/Input/input.component.ts.hbs`
- `templates/angular/Switch/switch.component.ts.hbs`
- `templates/angular/Select/select.component.ts.hbs`
- `templates/angular/Textarea/textarea.component.ts.hbs`

- [ ] **Step 3: Create Angular form patterns reference**

Create `.claude/skills/kigumi-compose-form/references/form-patterns-angular.md`.

**Structure:** Convert all form patterns from the existing references to Angular. Must cover:

- **Template-driven forms** (`FormsModule` + `[(ngModel)]`) -- simpler, recommended for most Kigumi forms
- **Reactive forms** (`ReactiveFormsModule` + `FormControl` / `FormGroup`) -- for complex validation
- **Validation patterns** -- Angular's built-in validators + custom validators, error display with `@if`
- **Form archetypes** from the React/Vue reference (Login, Settings, Contact, etc.) -- each as complete Angular component
- **Async submission** -- `[disabled]="submitting"` on submit button, loading state
- **Error display** -- Using Kigumi Alert/Callout for form-level errors, native WA validation for field-level

CVA means form controls "just work" with ngModel/formControl. The reference must NOT show manual `(change)` event wiring for value tracking -- only for side effects.

Apply the style rule: use WA layout classes (`wa-stack`, `wa-cluster`) for form layout, not inline styles.

- [ ] **Step 4: Update compose-form SKILL.md**

Same pattern as Task 4. Add Angular to:

- Critical Rules (class not className)
- Framework Adaptation section
- References section (link to `form-patterns-angular.md` + `angular-api-surface.md`)
- Conditional loading note

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/kigumi-compose-form/
git commit -m "feat(skills): add Angular patterns to compose-form

Adds form-patterns-angular.md with template-driven and reactive form
examples. Updates SKILL.md for conditional loading."
```

---

## Task 6: Update compose-overlay for Angular

**Files:**

- Create: `.claude/skills/kigumi-compose-overlay/references/overlay-patterns-angular.md`
- Modify: `.claude/skills/kigumi-compose-overlay/SKILL.md`

### Context

The compose-overlay skill covers dialogs, drawers, toasts, dropdowns, tooltips, and popovers. Angular overlay patterns differ from React/Vue primarily in event handling (collision suffixes) and state management (no useState/ref -- use class properties).

- [ ] **Step 1: Read existing overlay references**

Read these files in full:

- `.claude/skills/kigumi-compose-overlay/SKILL.md`
- `.claude/skills/kigumi-compose-overlay/references/overlay-patterns.md`
- `.claude/skills/kigumi-compose-overlay/references/overlay-state-management.md`

- [ ] **Step 2: Read Angular overlay templates for event names**

Read these to confirm exact @Output() names:

- `templates/angular/Dialog/dialog.component.ts.hbs`
- `templates/angular/Drawer/drawer.component.ts.hbs`
- `templates/angular/Dropdown/dropdown.component.ts.hbs`
- `templates/angular/Tooltip/tooltip.component.ts.hbs`

Also check if Toast has an Angular template: `templates/angular/Toast/toast.component.ts.hbs`

- [ ] **Step 3: Create Angular overlay patterns reference**

Create `.claude/skills/kigumi-compose-overlay/references/overlay-patterns-angular.md`.

**Structure:** Convert all overlay patterns to Angular. Must cover:

- **Dialog** -- `(showEvent)`, `(hide)`, `(afterHide)`, `requestClose()` method
- **Confirmation dialog** -- with form controls in body, controlled open state
- **Drawer** -- side panel pattern, same events as Dialog
- **Toast** -- if Toast wrapper exists, show usage; if Pro-only, note tier
- **Dropdown** -- `(showEvent)`, `(hide)`, `(waSelect)` for item selection
- **Tooltip/Popover** -- simpler patterns, mostly attribute-driven

Angular state management: class properties + methods, no useState/ref equivalent needed. Example:

```typescript
export class MyComponent {
  dialogOpen = false;
  openDialog() {
    this.dialogOpen = true;
  }
  onDialogHide() {
    this.dialogOpen = false;
  }
}
```

Apply style rule for overlay content layout.

- [ ] **Step 4: Update compose-overlay SKILL.md**

Same pattern as Tasks 4-5. Add Angular to Critical Rules, Framework Adaptation, References, conditional loading.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/kigumi-compose-overlay/
git commit -m "feat(skills): add Angular patterns to compose-overlay

Adds overlay-patterns-angular.md with Dialog, Drawer, Toast, Dropdown
patterns. Updates SKILL.md for conditional loading."
```

---

## Task 7: Update compose-data for Angular

**Files:**

- Create: `.claude/skills/kigumi-compose-data/references/data-patterns-angular.md`
- Modify: `.claude/skills/kigumi-compose-data/SKILL.md`

### Context

The compose-data skill covers tables, lists, detail views, stats cards, and data visualization. Angular patterns use `@for` for iteration and pipes for formatting.

- [ ] **Step 1: Read existing data references**

Read these files in full:

- `.claude/skills/kigumi-compose-data/SKILL.md`
- `.claude/skills/kigumi-compose-data/references/data-display-patterns.md`
- `.claude/skills/kigumi-compose-data/references/formatting-components.md`

- [ ] **Step 2: Create Angular data patterns reference**

Create `.claude/skills/kigumi-compose-data/references/data-patterns-angular.md`.

**Structure:** Convert all data patterns to Angular. Must cover:

- **Sortable table** -- `@for` rows, click handlers on headers, `aria-sort` for a11y
- **Search/filter** -- `[(ngModel)]` on Input for filter text, filtered array via getter or pipe
- **Pagination** -- component state for page/pageSize, computed slice
- **Stats cards** -- `@for` over metrics array, FormatNumber component if available
- **Detail view** -- description list pattern with `wa-grid`
- **Badge status indicators** -- variant mapping from data values

Use `@for` with `track` for all iteration. Use Angular `DatePipe`, `DecimalPipe` for formatting where appropriate (these are built-in, no extra imports needed with standalone components importing `CommonModule` or individual pipes).

Apply style rule: `wa-grid`, `wa-stack`, `wa-cluster` for data layout.

- [ ] **Step 3: Update compose-data SKILL.md**

Same pattern as Tasks 4-6. Add Angular to Critical Rules, Framework Adaptation, References, conditional loading.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/kigumi-compose-data/
git commit -m "feat(skills): add Angular patterns to compose-data

Adds data-patterns-angular.md with table, filter, pagination, stats
patterns. Updates SKILL.md for conditional loading."
```

---

## Task 8: Update AGENTS.md Files (All 4)

**Files:**

- Modify: `AGENTS.md` (root)
- Modify: `src/AGENTS.md`
- Modify: `templates/AGENTS.md`
- Modify: `tests/AGENTS.md`

### Context

Each file has specific Angular gaps identified during exploration. This task fills them all. Read each file fully before editing.

- [ ] **Step 1: Read all 4 AGENTS.md files**

Read in full:

- `AGENTS.md`
- `src/AGENTS.md`
- `templates/AGENTS.md`
- `tests/AGENTS.md`

- [ ] **Step 2: Update root AGENTS.md**

**Skills table** (around line 63-75): Add a row for kigumi-angular:

```markdown
| kigumi-angular | WA HTML -> Angular standalone components | User |
```

**Template pipeline Mermaid diagram** (around line 369): Add `tpl_angular` node alongside `tpl_react` and `tpl_vue`:

```mermaid
tpl_angular["angular/\n.component.ts.hbs + .component.css.hbs + .component.spec.ts.hbs"]
```

**Critical rules section**: Add Angular-specific rules:

```markdown
8. **Angular: `CUSTOM_ELEMENTS_SCHEMA`** -- always include in `schemas` array for standalone components.
9. **Angular: `k-` selector prefix** -- all Kigumi Angular components use `k-` (e.g., `<k-button>`).
10. **Angular: event collision suffixes** -- `blur`->`blurEvent`, `focus`->`focusEvent`, `show`->`showEvent`, `input`->`inputEvent`.
11. **Angular: CVA for form controls** -- use `[(ngModel)]` or `[formControl]`, never manual event wiring for value tracking.
```

- [ ] **Step 3: Update src/AGENTS.md**

Add to the `frameworks/` section (around line 74):

```markdown
- `angular/AngularPlugin` -- detects `@angular/core`, generates `.component.ts` + `.component.spec.ts` + `.component.css`. No `web-awesome.d.ts` (uses `CUSTOM_ELEMENTS_SCHEMA` instead). No `clsx` dependency. TypeScript-only (no JS variant). Angular templates are generated by `scripts/generate-angular-templates.ts` -- do not hand-edit.
```

Add `scripts/generate-angular-templates.ts` to the Scripts section if one exists, or note it alongside the template generation documentation.

- [ ] **Step 4: Update templates/AGENTS.md**

This file is already the most complete for Angular. Verify accuracy of the existing Angular Template Notes section against current templates. Add cross-reference:

```markdown
See also: `.claude/skills/shared/angular-api-surface.md` for the complete Angular component API reference (auto-generated).
```

- [ ] **Step 5: Update tests/AGENTS.md**

Add Angular eval documentation:

```markdown
### Angular Skill Evals

- `.claude/skills/kigumi-angular/evals/evals.json` -- 10 eval prompts covering variant remap, CVA, event suffixes, control flow, slot syntax

### Angular Starter Testing

Validate skill output in `~/Documents/dev/git/kigumi-angular/`:

1. Generate example component from skill output
2. Add to `src/app/` or `src/components/`
3. Run `ng build` -- must compile without errors
4. Run `ng serve` + visual verification via Chrome DevTools
```

- [ ] **Step 6: Update Last Updated dates**

Update the "Last Updated" date at the bottom of each modified AGENTS.md file to `2026-04-04`.

- [ ] **Step 7: Commit**

```bash
git add AGENTS.md src/AGENTS.md templates/AGENTS.md tests/AGENTS.md
git commit -m "docs: add Angular to all AGENTS.md files

Root: skills table, template diagram, critical rules.
src: Angular plugin patterns, generate script.
templates: cross-ref to angular-api-surface.md.
tests: eval structure, starter testing procedure."
```

---

## Task 9: Type-Check Validation in Angular Starter

**Files:**

- Modify (temporarily): files in `~/Documents/dev/git/kigumi-angular/src/`

### Context

The Angular starter at `~/Documents/dev/git/kigumi-angular/` currently has only 4 components installed (Button, Card, Icon, Input) despite `kigumi.config.json` claiming 73. We need to install the components used by the test examples, then create test components from each skill's output and verify they compile.

- [ ] **Step 1: Check starter state**

```bash
cd ~/Documents/dev/git/kigumi-angular
ls src/components/ui/
cat kigumi.config.json | head -20
ng build
```

Verify the starter compiles in its current state before adding test files.

- [ ] **Step 2: Install components needed for testing**

Based on the compose skill examples, install the components we'll need. Build the CLI first, then install:

```bash
cd /Users/giregar/Documents/dev/git/kigumi-cli
pnpm build

cd ~/Documents/dev/git/kigumi-angular
npx kigumi add dialog drawer dropdown switch textarea select badge alert spinner avatar rating
```

Verify with `ls src/components/ui/` that the directories were created.

- [ ] **Step 3: Create test components from each skill**

Create one test component per skill in `src/app/test/`:

1. **kigumi-angular test:** Simple button + dialog + form conversion
2. **compose-layout test:** Dashboard archetype from `layout-archetypes-angular.md`
3. **compose-form test:** Settings form from `form-patterns-angular.md`
4. **compose-overlay test:** Dialog + confirmation from `overlay-patterns-angular.md`
5. **compose-data test:** Sortable table from `data-patterns-angular.md`

Each test component should be a direct copy of an archetype from the Angular reference files. Import them in `app.component.ts` to include in the build.

- [ ] **Step 4: Run `ng build` and fix errors**

```bash
cd ~/Documents/dev/git/kigumi-angular
ng build
```

If there are compilation errors:

1. Read the error messages carefully
2. Identify which reference file produced the bad code
3. Fix the reference file in the CLI repo (`.claude/skills/...`)
4. Regenerate the test component from the fixed reference
5. Re-run `ng build`
6. Repeat until clean

Common errors to watch for:

- Missing imports (FormsModule, component imports)
- Wrong event names (check against actual @Output() in templates)
- Missing `schemas: [CUSTOM_ELEMENTS_SCHEMA]`
- Wrong import paths (`@/components/ui/` must resolve via tsconfig paths)

- [ ] **Step 5: Commit fixes to skill references**

If any fixes were needed, commit them back to the CLI repo:

```bash
cd /Users/giregar/Documents/dev/git/kigumi-cli
git add .claude/skills/
git commit -m "fix(skills): Angular reference fixes from type-check validation

Fixes found by compiling skill output in kigumi-angular-starter."
```

- [ ] **Step 6: Clean up starter**

Remove test components from the starter (don't leave test files committed):

```bash
cd ~/Documents/dev/git/kigumi-angular
rm -rf src/app/test/
# Restore app.component.ts to its original state
git checkout src/app/
```

---

## Task 10: Visual Integration Pass

**Files:**

- Modify (temporarily): files in `~/Documents/dev/git/kigumi-angular/src/`

### Context

After all skills pass type-check, do a visual verification via `ng serve` + Chrome DevTools MCP. This catches rendering issues that `ng build` misses: slots not forwarding, layout utilities not applying, CSS custom properties not working.

- [ ] **Step 1: Re-create test components**

Same components as Task 9, but this time organized as a simple visual test page. Create a `TestPageComponent` in `src/app/test-page/` that renders all 5 test components vertically in a `wa-stack`:

```typescript
@Component({
  selector: 'app-test-page',
  standalone: true,
  imports: [
    LayoutTestComponent,
    FormTestComponent,
    OverlayTestComponent,
    DataTestComponent,
    ConversionTestComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="wa-stack wa-gap-xl" style="padding: var(--wa-space-l)">
      <h2>Layout Test</h2>
      <app-layout-test />
      <h2>Form Test</h2>
      <app-form-test />
      <h2>Overlay Test</h2>
      <app-overlay-test />
      <h2>Data Test</h2>
      <app-data-test />
      <h2>Conversion Test</h2>
      <app-conversion-test />
    </div>
  `,
})
export class TestPageComponent {}
```

Wire `TestPageComponent` as the root in `app.component.ts`.

- [ ] **Step 2: Serve and screenshot**

```bash
cd ~/Documents/dev/git/kigumi-angular
ng serve
```

Use Chrome DevTools MCP to:

1. Navigate to `http://localhost:4200`
2. Take a full-page screenshot
3. Check each section for:
   - Slot content renders (header/footer visible in cards, dialogs)
   - Layout utility classes work (`wa-stack`, `wa-grid`, `wa-flank` produce correct layouts)
   - CSS custom properties apply (gap sizes, panel padding, banner height)
   - Components render with correct variants (brand, danger, etc.)
   - Form controls accept input (click into input, toggle switch)

- [ ] **Step 3: Open and test overlays**

Use Chrome DevTools MCP to:

1. Click the button that opens the test dialog
2. Screenshot the open dialog
3. Verify: label visible, slot content in footer, backdrop present
4. Close the dialog via the close button or backdrop click
5. If a drawer or dropdown test exists, repeat

- [ ] **Step 4: Fix visual issues**

If any rendering issues found:

1. Identify the root cause (wrong slot syntax, missing class, wrong custom property)
2. Fix the reference file in the CLI repo
3. Update the test component
4. Re-serve and re-screenshot
5. Repeat until clean

- [ ] **Step 5: Commit any fixes**

```bash
cd /Users/giregar/Documents/dev/git/kigumi-cli
git add .claude/skills/
git commit -m "fix(skills): Angular reference fixes from visual verification

Fixes rendering issues found during ng serve + Chrome DevTools testing."
```

- [ ] **Step 6: Clean up starter and stop server**

```bash
cd ~/Documents/dev/git/kigumi-angular
# Stop ng serve (Ctrl+C)
rm -rf src/app/test-page/
git checkout src/app/
```

---

## Task Dependencies

```
Task 1 (generator script)
  └── Task 2 (kigumi-angular skill) ── depends on angular-api-surface.md
       └── Task 3 (evals)
Task 2 ──┬── Task 4 (compose-layout)
          ├── Task 5 (compose-form)
          ├── Task 6 (compose-overlay)
          └── Task 7 (compose-data)
              └── Task 8 (AGENTS.md) ── depends on knowing all new file paths
                   └── Task 9 (type-check) ── validates all skills
                        └── Task 10 (visual pass) ── final verification
```

Tasks 4-7 can run in parallel (independent compose skills).
Task 8 can start after Tasks 4-7 complete (needs final file paths).
Tasks 9-10 must run sequentially and after everything else.
