# Phase 5: Angular Skills + Docs

> Design spec for adding Angular support to all Kigumi agent skills and documentation.

## Context

Phases 1-4 shipped Angular CLI support, 73 component templates, and the kigumi-angular-starter. Phase 5 closes the gap between "Angular works in the CLI" and "AI agents can generate Angular code via skills."

### Current State

- **Done:** Angular plugin, all 73 `.hbs` templates, generator script (`scripts/generate-angular-templates.ts`), kigumi-angular-starter, templates/AGENTS.md docs
- **Missing:** `kigumi-angular` conversion skill, `angular-api-surface.md`, Angular support in 4 compose skills, Angular in root/src/tests AGENTS.md

### Approach

Foundation-first (bottom-up): API surface -> conversion skill -> compose skills -> docs -> evals -> testing. Each layer depends on the previous.

## 1. Generator Script Extension + Angular API Surface

### Goal

Extend `scripts/generate-skill-references.ts` to emit `.claude/skills/shared/angular-api-surface.md` alongside the existing React/Vue surfaces.

### Input Sources

- `custom-elements.json` (WA component metadata) -- primary
- Angular `.hbs` templates in `templates/angular/` -- source of truth for wrapper-specific patterns

Templates override `custom-elements.json` where they disagree (per source-of-truth hierarchy).

### Output Format (per component)

```markdown
### Button

- Selector: `k-button`
- Inputs: `[variant]`, `[size]`, `[disabled]`, `[loading]`, ...
- Outputs: `(click)`, `(focusEvent)`, `(blurEvent)`
- Methods: `click()`, `focus()`, `blur()`
- Slots: `slot="prefix"`, `slot="suffix"`, `slot="start"`, `slot="end"`
- CSS Parts: `::part(base)`, `::part(label)`
- Form: No
```

For form controls:

```markdown
- Form: Yes (ControlValueAccessor)
- NgModel: `[(ngModel)]="value"` (requires FormsModule)
- Reactive: `[formControl]="ctrl"` (requires ReactiveFormsModule)
```

### Angular-Specific Patterns to Capture

- `[attr.prop]` binding syntax
- Event output names with collision suffixes (`showEvent`, `blurEvent`, `focusEvent`)
- ControlValueAccessor for form controls
- Pro component note: flag where `ElementRef.nativeElement as HTMLElement` cast is needed
- No `web-awesome.d.ts` -- Angular uses `CUSTOM_ELEMENTS_SCHEMA`

### Validation

After generation, spot-check Button, Dialog, Input against actual `.hbs` templates. Templates win on any discrepancy.

## 2. `kigumi-angular` Conversion Skill

### Goal

New skill at `.claude/skills/kigumi-angular/SKILL.md` that converts WA HTML to Angular standalone components using Kigumi wrappers.

### Trigger

User pastes `<wa-*>` HTML in an Angular project (`framework: "angular"` in `kigumi.config.json`), asks to "convert to Angular", or mentions wa-\* tags needing Angular equivalents.

### Flow

1. Read `kigumi.config.json` -- confirm `framework: "angular"`, read `componentsDir`, `aliases`
2. List `componentsDir` subdirs -- detect installed components
3. Parse WA HTML -- extract `<wa-*>` tags, attributes, slots, classes
4. Generate `npx kigumi add <missing>` commands for uninstalled components
5. Output complete standalone Angular component

### Transformation Rules

| WA HTML                           | Angular Output                                   |
| --------------------------------- | ------------------------------------------------ |
| `<wa-button variant="primary">`   | `<k-button [variant]="'brand'">`                 |
| `<wa-button variant="default">`   | `<k-button>` (omit prop)                         |
| `class="wa-stack"`                | `class="wa-stack"` (preserved)                   |
| `style="--wa-panel-padding: ..."` | `style="--wa-panel-padding: ..."` (preserved)    |
| `<wa-dialog>` with events         | `<k-dialog (showEvent)="..." (afterHide)="...">` |
| `<wa-input value="...">`          | `<k-input [(ngModel)]="value">` (FormsModule)    |
| `<div slot="header">`             | `<div slot="header">` (identical)                |
| `*ngIf` / `*ngFor` in input       | `@if` / `@for` in output (Angular 17+)           |

### Output Format

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [FormsModule, ButtonComponent, InputComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `...`
})
export class ExampleComponent { ... }
```

### Required Sections

- **Variant remap:** `primary` -> `brand`, `default` -> omit
- **Event naming:** Strip `wa-` prefix, camelCase, collision suffixes
- **Form controls:** CVA means `[(ngModel)]` or `[formControl]` -- not manual event wiring
- **Slot pattern:** `slot="header"` attribute (identical across all three frameworks)
- **Pro components:** Note `ElementRef.nativeElement as HTMLElement` cast where needed
- **Control flow:** `@if`, `@for` (Angular 17+), not `*ngIf`/`*ngFor`
- **Missing components:** Always generate `npx kigumi add` before code

### References

Points to `../shared/angular-api-surface.md` (generated in step 1).

### Evals

~10-12 assertions in `kigumi-angular/evals/evals.json`:

- Simple button conversion (variant remap)
- Form with Input + Switch (CVA, ngModel)
- Dialog with events (collision suffixes)
- Slot forwarding (header/footer)
- Layout utilities preserved (wa-stack, wa-grid classes)
- Pro component handling
- Missing component detection (generates `npx kigumi add`)
- Control flow conversion (@if/@for)

## 3. Compose Skill Updates

### Affected Skills

compose-layout, compose-form, compose-overlay, compose-data

### Pattern: Separate Angular Reference Files

Each skill gets a new reference file, conditionally loaded when `framework: "angular"` in `kigumi.config.json`.

| Skill           | New File                                  |
| --------------- | ----------------------------------------- |
| compose-layout  | `references/layout-archetypes-angular.md` |
| compose-form    | `references/form-patterns-angular.md`     |
| compose-overlay | `references/overlay-patterns-angular.md`  |
| compose-data    | `references/data-patterns-angular.md`     |

### Content Per Reference File

- All archetypes/patterns rewritten as Angular standalone components
- `class` not `className` (same as Vue)
- `@if`/`@for` control flow
- `[(ngModel)]` for form controls (FormsModule import)
- `(event)` syntax with correct output names from templates
- `slot="header"` attribute
- Pro vs Free tier branching (Page for layout, Toast for overlay, etc.)

### Style Rule (Cross-Cutting)

Generated code must prefer WA utilities over inline styles:

1. **WA layout utility classes first** -- `wa-stack`, `wa-grid`, `wa-cluster`, `wa-flank`, `wa-sidebar`, gap/alignment modifiers (`wa-gap-m`, `wa-align-items-stretch`)
2. **CSS custom properties on components** -- `--banner-height`, `--min-column-size`, `--wa-panel-padding` via `style="--prop: value"`
3. **Inline styles only as last resort** -- when no utility class or custom property covers the case. Note: setting CSS custom properties via `style="--wa-panel-padding: var(--wa-space-m)"` is not an "inline style" in this context -- it's the correct way to configure component tokens.

```html
<!-- Correct -->
<div class="wa-stack wa-gap-l">
  <k-page style="--banner-height: 200px">
    <!-- Wrong -->
    <div
      style="display: flex; flex-direction: column; gap: var(--wa-space-l)"
    ></div
  ></k-page>
</div>
```

### SKILL.md Changes

Each compose skill's SKILL.md gets:

- Angular added to framework detection section
- Conditional: "If `framework: 'angular'`, load `references/*-angular.md`"
- No structural changes to decision trees, archetypes, or component selection tables

### Validation

Each reference file's code examples type-checked via `ng build` in kigumi-angular-starter.

## 4. AGENTS.md Updates

### Root `AGENTS.md`

- Add `kigumi-angular` to skills table
- Add `tpl_angular` to template pipeline Mermaid diagram
- Add Angular critical rules: `CUSTOM_ELEMENTS_SCHEMA`, `k-` prefix, CVA, event collision suffixes

### `src/AGENTS.md`

- Document Angular plugin patterns (detection, generation, setup)
- Document no `web-awesome.d.ts` (uses CUSTOM_ELEMENTS_SCHEMA)

### `templates/AGENTS.md`

- Verify accuracy after Phase 5 changes
- Add cross-reference to `angular-api-surface.md`

### `tests/AGENTS.md`

- Document kigumi-angular eval structure
- Add Angular starter testing procedure

## 5. Testing + Visual Verification

### Phase A: Type-Check During Development

Each compose skill Angular reference and kigumi-angular eval assertion validated via `ng build` in kigumi-angular-starter.

Process: generate example from skill -> add to starter -> `ng build` -> fix -> update reference.

### Phase B: Visual Integration Pass (Final Step)

After all skills complete, generate one example per skill in the starter:

| Skill           | Example                           |
| --------------- | --------------------------------- |
| kigumi-angular  | Button + Dialog + Form conversion |
| compose-layout  | Dashboard archetype               |
| compose-form    | Settings form with validation     |
| compose-overlay | Dialog + Toast                    |
| compose-data    | Sortable table with badges        |

Process: `ng serve` -> Chrome DevTools MCP screenshots -> verify slot content, layout utilities, CSS custom properties, Pro components -> fix and re-verify.

## Learnings Incorporated

| Learning                      | How It Shapes This Plan                                        |
| ----------------------------- | -------------------------------------------------------------- |
| Templates are source of truth | API surface generated from .hbs, not just custom-elements.json |
| Pro Lit type casting          | Angular skill documents ElementRef.nativeElement cast for Pro  |
| CVA is Angular's v-model      | Dedicated CVA section in skill, clear FormsModule guidance     |
| Reference impl first          | All compose examples validated via `ng build` before shipping  |
| Test in starters              | kigumi-angular-starter is the validation environment           |
| No inline styles              | WA utility classes and CSS custom properties first             |
| Separate reference files      | No context pollution, conditional loading per framework        |
| Skills must use wrappers      | Always `npx kigumi add` before code, never raw wa-\*           |
| Pro vs Free distinction       | Tier branching in all compose skill references                 |

## Out of Scope

- `generate-component-wrapper` skill (deprecated, maintainer-only)
- Phase 6 (landing page, polish)
- Updating React/Vue compose references to match the style rule (good idea, separate PR)
- Reference Implementation First architecture (separate initiative)

## Dependencies

- kigumi-angular-starter must be functional (`ng build` passes)
- `scripts/generate-skill-references.ts` must already handle React/Vue (it does)
- All 73 Angular `.hbs` templates must be current (they are, from Phase 3)
