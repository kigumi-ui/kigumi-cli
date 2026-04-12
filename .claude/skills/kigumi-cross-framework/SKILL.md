---
name: kigumi-cross-framework
description: >
  Convert Kigumi components from one framework to another (React <-> Vue
  <-> Angular). Use whenever files appear in `.kigumi/foreign/<slug>/`,
  whenever the user asks to convert a React/Vue/Angular component to a
  different framework, whenever the kigumi CLI prints a "convert with
  kigumi-cross-framework skill" hand-off message, or whenever a project
  needs to consume a community registry component built for a different
  framework. Always reads `.kigumi/foreign/<slug>/_meta.json` for the
  source framework and `kigumi.config.json` for the target, then loads
  the matching `kigumi-{target}` skill plus any relevant `kigumi-compose-*`
  skill via the Skill tool before writing the converted component.
user-invocable: true
allowed-tools: Read, Glob, Bash, Write
---

# Convert Kigumi Components Across Frameworks

This skill is a translator. It takes a Kigumi component written for one
framework and produces an idiomatic equivalent for another. Web Awesome's
HTML, CSS, slot names, and atomic Kigumi component imports are framework-
agnostic and copy across unchanged. Only the wrapper code (state, effects,
events, control flow, refs) needs translation.

## When to Trigger

Activate this skill when any of the following are true:

- Files exist at `.kigumi/foreign/<slug>/` (placed there by `kigumi add --cross-framework`)
- The user pastes the canonical hand-off prompt: `Convert .kigumi/foreign/<slug>/ to <target> using the kigumi-cross-framework skill`
- The user asks to convert a React/Vue/Angular component to a different framework
- The user wants to consume a community registry component whose source framework does not match their project

## Architecture (do not duplicate target conventions)

Do not redocument target-framework conventions here. Load the
`kigumi-{target}` skill via the Skill tool and use its conventions for
component naming, file structure, slot syntax, event handler syntax,
prop binding, and lifecycle patterns. For composed organisms, additionally
load the matching `kigumi-compose-*` skill via the Skill tool. This skill
is responsible only for the **mapping between source and target patterns**,
not for the target language itself.

## Workflow

1. **Locate the staged sources.** Default location is `.kigumi/foreign/<slug>/`. If the user named a different path, use that.
2. **Read `_meta.json`** to determine `sourceFramework`, `targetFramework`, `componentName`, and provenance fields. The CLI writes these explicitly so you never have to guess from file extensions.
3. **Read `kigumi.config.json`** in the project root and verify `framework` matches `targetFramework` from `_meta.json`. If they disagree, surface the conflict and ask before proceeding.
4. **Load the target skill via the Skill tool**: `kigumi-react`, `kigumi-vue`, or `kigumi-angular`. Use its conventions for file naming, imports, component definition, and target-specific gotchas.
5. **Identify the source files** in the staging directory: the main component file, any CSS, any test, plus extras. List them before reading.
6. **Read each source file** and decide whether it is a primitive (one component file) or a composed organism (uses 3+ Kigumi atoms with state/validation/effects).
7. **For composed organisms, load the matching compose skill** via the Skill tool: `kigumi-compose-form` for forms and login screens, `kigumi-compose-overlay` for dialog/drawer/dropdown patterns, `kigumi-compose-layout` for app shells and dashboards, `kigumi-compose-data` for tables/lists/stats. Apply the cross-framework mappings below on top of the compose recipes.
8. **Apply mappings** from this skill (state, effects, events, refs, control flow, slots) to translate every source-framework idiom into its target equivalent. Insert TODO markers (see below) for anything unmapped.
9. **Write the converted file** into the target's `componentsDir` using the target's file convention: `Component.tsx` for React, `Component.vue` for Vue, `component-name.component.ts` (kebab-case) for Angular. Include any css file the source had.
10. **Verify** by running the target framework's type-checker (`pnpm typecheck` for React/Vue, `pnpm typecheck` or `ng build` for Angular). Iterate on any errors. Summarize all TODO markers at the end so the user knows what still needs human attention.

## Prerequisites

- Target framework versions: **React 18+**, **Vue 3.4+**, **Angular 17+**. Older versions lack key APIs (signals, control-flow blocks, defineModel) that the mappings below assume. Refuse with a clear message if the target is older.
- The user must have run `kigumi add --cross-framework` (or have foreign-staged files manually). If `.kigumi/foreign/<slug>/` is empty or `_meta.json` is missing, ask the user to re-run the CLI command.
- Atomic Kigumi components used by the source must be installable in the target project via `npx kigumi add`. The atomic wrappers exist for all three frameworks.

## Framework-Agnostic Layer (literal copy, no translation)

These elements are identical across React, Vue, and Angular. Copy verbatim from the source file:

- **CSS files** — `.css` content is byte-for-byte identical. Filename casing follows the target framework convention.
- **Web Awesome utility classes** — `wa-stack`, `wa-cluster`, `wa-grid`, `wa-flank`, `wa-gap-*`, `wa-align-*`, etc.
- **CSS custom properties** — `--wa-*` tokens, `--banner-height`, etc. Style-attribute syntax differs slightly per framework but the property names do not.
- **Variant prop values** — `variant="brand"`, `variant="success"`, `variant="danger"`. Identical across frameworks.
- **Slot names** — `slot="header"`, `slot="footer"`, `slot="trigger"`, `slot="start"`, `slot="end"`. The `slot` attribute itself is web-component standard and works on every framework.
- **Boolean prop names** — `disabled`, `loading`, `required`, `pill`, `with-caret`. The names are the same; only the binding syntax changes (see Quick-Reference below).
- **Type-only TypeScript** — `type X = ...`, `interface Y {}`, generic constraints. No framework runtime, no translation.

## Quick-Reference Mappings

### Component element syntax

| Concept           | React                                      | Vue                                        | Angular                                                                                                                    |
| ----------------- | ------------------------------------------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Atomic Kigumi tag | `<Button>`                                 | `<Button>`                                 | `<k-button>` (k-prefix!)                                                                                                   |
| Imports           | `import { Button } from '@/components/ui'` | `import { Button } from '@/components/ui'` | `import { ButtonComponent } from '@/components/ui/Button/button.component'` + `imports: [ButtonComponent]` in `@Component` |
| File naming       | `LoginExample.tsx`                         | `LoginExample.vue`                         | `login-example.component.ts` (kebab-case + `.component.ts`)                                                                |

### State

| Source                                  | Target                                  | Notes                                                   |
| --------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| `const [x, setX] = useState(0)` (React) | `const x = ref(0)` (Vue)                | Vue: read as `x.value` in script, `x` in template       |
| `const [x, setX] = useState(0)` (React) | `x = signal(0)` (Angular 17+)           | Angular: read as `this.x()`, write as `this.x.set(...)` |
| `const x = ref(0)` (Vue)                | `const [x, setX] = useState(0)` (React) |                                                         |
| `x = signal(0)` (Angular)               | `const [x, setX] = useState(0)` (React) |                                                         |

### Derived state

| Source                                       | Target                                       |
| -------------------------------------------- | -------------------------------------------- |
| `const y = useMemo(() => f(x), [x])` (React) | `const y = computed(() => f(x.value))` (Vue) |
| `const y = useMemo(() => f(x), [x])` (React) | `y = computed(() => f(this.x()))` (Angular)  |
| `const y = computed(() => f(x.value))` (Vue) | `const y = useMemo(() => f(x), [x])` (React) |

### Effects (mount + cleanup)

| Source                                                              | Target                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `useEffect(() => { setup(); return () => cleanup(); }, [])` (React) | `onMounted(() => setup()); onBeforeUnmount(() => cleanup())` (Vue) |
| `useEffect(() => { setup(); return () => cleanup(); }, [])` (React) | `ngOnInit() { setup() } ngOnDestroy() { cleanup() }` (Angular)     |
| `onMounted(() => setup())` (Vue)                                    | `useEffect(() => { setup() }, [])` (React)                         |

### Refs to wa-elements

| Source                                                                                             | Target                                                                                                                            |
| -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `const ref = useRef<HTMLElement>(null); <Dialog ref={ref} />; ref.current?.requestClose()` (React) | `const ref = ref<HTMLElement \| null>(null); <Dialog ref="ref" />; ref.value?.requestClose()` (Vue)                               |
| `const ref = useRef<HTMLElement>(null); ...` (React)                                               | `@ViewChild('dialogRef') ref!: ElementRef<HTMLElement>; <k-dialog #dialogRef />; this.ref.nativeElement.requestClose()` (Angular) |

### Form-control event handlers (NATIVE events)

Form controls (Input, Switch, Checkbox, Textarea, Select) emit native DOM events.

| Source                                                                          | Target                                                                                                                    |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `<Input onInput={(e) => setX((e.target as HTMLInputElement).value)} />` (React) | `<Input v-model="x" />` (Vue, preferred) or `<Input @input="(e: Event) => x = (e.target as HTMLInputElement).value" />`   |
| `<Input onInput={...} />` (React)                                               | `<k-input [(ngModel)]="x" />` (Angular, requires `FormsModule`) — **do NOT** wire `(inputEvent)` manually, CVA handles it |
| `<Input v-model="x" />` (Vue)                                                   | `<Input value={x} onInput={(e) => setX((e.target as HTMLInputElement).value)} />` (React)                                 |

### Overlay event handlers (CustomEvent)

Overlays (Dialog, Drawer, Dropdown) emit `wa-show`, `wa-hide`, etc. The wrapper exposes them differently per framework.

| Source                                             | Target                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `<Dialog onHide={() => setOpen(false)} />` (React) | `<Dialog @wa-hide="open = false" />` (Vue) or `<Dialog v-model:open="open" />` (preferred)                                                  |
| `<Dialog onHide={...} />` (React)                  | `<k-dialog (hide)="open = false" />` (Angular) — note `(hide)` not `(onHide)`; for `wa-show` use `(showEvent)` due to method-name collision |
| `<Dialog @wa-hide="..." />` (Vue)                  | `<Dialog onHide={...} />` (React)                                                                                                           |

### Conditional rendering

| Source                           | Target                                                |
| -------------------------------- | ----------------------------------------------------- |
| `{cond && <X />}` (React)        | `<X v-if="cond" />` (Vue)                             |
| `{cond ? <A /> : <B />}` (React) | `<A v-if="cond" /><B v-else />` (Vue)                 |
| `{cond && <X />}` (React)        | `@if (cond) { <k-x /> }` (Angular 17+, never `*ngIf`) |
| `<X v-if="cond" />` (Vue)        | `{cond && <X />}` (React)                             |

### List rendering

| Source                                               | Target                                                                          |
| ---------------------------------------------------- | ------------------------------------------------------------------------------- |
| `{items.map((item) => <X key={item.id} />)}` (React) | `<X v-for="item in items" :key="item.id" />` (Vue)                              |
| `{items.map((item) => <X key={item.id} />)}` (React) | `@for (item of items; track item.id) { <k-x /> }` (Angular 17+, never `*ngFor`) |

### Slots

| Source                                                | Target                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `<Card><div slot="header">Title</div></Card>` (React) | `<Card><div slot="header">Title</div></Card>` (Vue, **slot attribute, NOT** `<template #header>`) |
| `<Card><div slot="header">Title</div></Card>` (React) | `<k-card><div slot="header">Title</div></k-card>` (Angular, **NOT** `<ng-content select="...">`)  |

### CSS class binding

| Source                                                        | Target                                    |
| ------------------------------------------------------------- | ----------------------------------------- |
| `<Button className="wa-cluster">` (React, always `className`) | `<Button class="wa-cluster">` (Vue)       |
| `<Button className="wa-cluster">` (React)                     | `<k-button class="wa-cluster">` (Angular) |
| `<Button class="wa-cluster">` (Vue)                           | `<Button className="wa-cluster">` (React) |

### Inline styles

| Source                                        | Target                                                              |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `style={{ maxWidth: '60ch' }}` (React object) | `style="max-width: 60ch"` or `:style="{ maxWidth: '60ch' }"` (Vue)  |
| `style={{ maxWidth: '60ch' }}` (React)        | `style="max-width: 60ch"` or `[style.max-width]="'60ch'"` (Angular) |

### CSS imports

| Source                                               | Target                                                                                                                      |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `import './LoginExample.css'` (React, top of `.tsx`) | `<style scoped>@import './LoginExample.css';</style>` in SFC, or external `<style src="./LoginExample.css" scoped />` (Vue) |
| `import './LoginExample.css'` (React)                | `styleUrls: ['./login-example.component.css']` in `@Component({ ... })` (Angular)                                           |

### Component definition wrapper

| Framework | Skeleton                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React     | `export function LoginExample() { /* hooks */ return (<>...</>) }`                                                                                                                                  |
| Vue       | `<script setup lang="ts">/* refs, computed, fns */</script><template>...</template>`                                                                                                                |
| Angular   | `@Component({ selector: 'app-login-example', standalone: true, imports: [...], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: '...' }) export class LoginExampleComponent { /* signals, methods */ }` |

## Recipe Delegation

Do not inline form, dialog, layout, or data recipes here. For composed
organisms, load the matching skill via the Skill tool — they document
React, Vue, and Angular side-by-side and stay in sync with the wrappers:

- **`kigumi-compose-form`** — login, contact, settings, multi-step wizards, validation
- **`kigumi-compose-overlay`** — dialogs, drawers, dropdowns, popovers, tooltips, toasts
- **`kigumi-compose-layout`** — app shells, dashboards, sidebar layouts, settings pages
- **`kigumi-compose-data`** — data tables, list views, stats cards, detail panels

The compose skills tell you which Kigumi atoms to install and how the
target framework binds them. This skill (`kigumi-cross-framework`) tells
you how to translate the **source** framework's idioms into the **target**
framework's. Apply this skill's mappings on top of the compose skill's
recipes.

## Deep-Link Directory

Use these direct documentation URLs when the source uses an idiom not
covered by the Quick-Reference tables. Skip llms.txt index pages and go
straight to the relevant API page.

### React 18+

- `useState` — https://react.dev/reference/react/useState
- `useEffect` (cleanup, deps) — https://react.dev/reference/react/useEffect
- `useRef` — https://react.dev/reference/react/useRef
- `useMemo` — https://react.dev/reference/react/useMemo
- `useCallback` — https://react.dev/reference/react/useCallback
- Synthetic events — https://react.dev/reference/react-dom/components/common#react-event-object

### Vue 3.4+

- `ref` — https://vuejs.org/api/reactivity-core.html#ref
- `reactive` — https://vuejs.org/api/reactivity-core.html#reactive
- `computed` — https://vuejs.org/api/reactivity-core.html#computed
- `watch` / `watchEffect` — https://vuejs.org/api/reactivity-core.html#watch
- `defineModel` (v-model on components) — https://vuejs.org/api/sfc-script-setup.html#definemodel
- Lifecycle hooks — https://vuejs.org/api/composition-api-lifecycle.html

### Angular 17+

- Signals — https://angular.dev/guide/signals
- Control flow (`@if`, `@for`, `@switch`) — https://angular.dev/guide/templates/control-flow
- Standalone components — https://angular.dev/guide/components/anatomy-of-components
- ControlValueAccessor — https://angular.dev/api/forms/ControlValueAccessor
- ViewChild — https://angular.dev/api/core/ViewChild

## Fetch Escape Hatch

If a source idiom is not in the Quick-Reference tables and not covered by
a `kigumi-compose-*` recipe:

1. **First** check the Deep-Link Directory and fetch the relevant page to find the canonical target equivalent.
2. **Then** apply the equivalent and proceed.
3. **If still unclear**, write the conversion using your best judgment AND insert a TODO marker explaining the uncertainty (see next section). Do not silently guess.

Common cases that fall through to the escape hatch:

- Vue Vapor mode, Angular Defer blocks, React Compiler optimizations
- Animations and transitions (CSS transitions copy fine; framework-specific transition components do not)
- State-management libraries (Redux, Pinia, NgRx) — almost always become a TODO unless the user has the equivalent library configured in the target project
- Routing (`react-router`, `vue-router`, `@angular/router`) — translate the navigation calls but flag any framework-specific guards
- Form-validation libraries (`react-hook-form`, `vee-validate`, Angular reactive forms with custom validators) — usually become TODOs

## TODO Marker Spec

When you cannot fully translate a source idiom, insert a marker in the
generated file so the user can find it. Always summarize the markers at
the end of your response.

**Canonical format** (TypeScript / JS / Vue script / Angular TS):

```
// KIGUMI-CONVERT-TODO: <reason> [<source-fw> -> <target-fw>]
```

**Vue and Angular template equivalent** (HTML comment):

```
<!-- KIGUMI-CONVERT-TODO: <reason> [<source-fw> -> <target-fw>] -->
```

**The six categories that ALWAYS get a marker** (do not silently guess):

1. **Custom hooks / composables / services** — `useAuth`, `useFetch`, `usePermissions`, Angular DI services
2. **Async data fetching** beyond simple `fetch()` — SWR, React Query, Vue Query, Angular HttpClient with interceptors
3. **State libraries** — Redux, Zustand, Pinia, NgRx
4. **Routing** — page navigation, route guards, link components
5. **Form-validation libraries** — `react-hook-form`, `vee-validate`, Angular Validators
6. **Animations / transitions** — Framer Motion, Vue `<Transition>`, Angular animations

After conversion, list every marker you inserted in a "TODOs" section so
the user knows what to revisit.

## Verification

After writing the converted file:

1. Run the target framework's type-checker:
   - **React / Vue**: `pnpm typecheck`
   - **Angular**: `pnpm typecheck` or `ng build`
2. Read any errors and iterate. Common fixes:
   - **React**: missing import from `@/components/ui`, wrong event-handler typing
   - **Vue**: forgot `slot="header"` (used `<template #header>` instead — silently disappears at runtime)
   - **Angular**: missing `imports: [...]` entry, missing `schemas: [CUSTOM_ELEMENTS_SCHEMA]`, used `*ngIf` instead of `@if`
3. After the file type-checks, present the result to the user along with the TODOs summary.

## Related Skills

- **`kigumi-react`**, **`kigumi-vue`**, **`kigumi-angular`** — target-framework conventions. Always load the matching one via the Skill tool.
- **`kigumi-compose-form`**, **`kigumi-compose-overlay`**, **`kigumi-compose-layout`**, **`kigumi-compose-data`** — recipe sources for composed organisms.
- **Shared API surfaces** — [React](../shared/react-api-surface.md) / [Vue](../shared/vue-api-surface.md) / [Angular](../shared/angular-api-surface.md) — full prop, event, slot, and method reference per component.
