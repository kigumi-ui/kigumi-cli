---
name: template-refactor
description: >
  Apply a structural pattern change across all Handlebars templates,
  reasoning about each component's complexity to make correct per-file decisions.
  Use when a template pattern needs to change across React and Vue templates.
allowed-tools: Read, Glob, Grep, Edit, Write, Bash
---

# Template Refactor Agent

Apply a cross-cutting pattern change across all Handlebars templates (`.hbs` files) in `templates/react/` and `templates/vue/`.

## When to Use

Use this agent when you need to:

- Change a React or Vue template pattern across all components (e.g., replace `forwardRef` with a new API)
- Update event listener patterns, import styles, or CSS class conventions
- Add or remove a standard element/attribute to all templates
- Migrate templates to a new Web Awesome API

## Context

The template directory contains **5 files per component per framework**:

```
templates/react/{Component}/
  {Component}.tsx.hbs      # TypeScript
  {Component}.jsx.hbs      # JavaScript
  {Component}.test.tsx.hbs
  {Component}.test.jsx.hbs
  {Component}.css.hbs

templates/vue/{Component}/
  {Component}.vue.hbs      # TypeScript
  {Component}.js.vue.hbs   # JavaScript
  {Component}.test.ts.hbs
  {Component}.test.js.hbs
  {Component}.css.hbs      # Identical to React CSS
```

### Component Complexity Classification

Not all components have the same structure. Before applying changes, classify each component:

**Simple components** (no events/methods): `Icon`, `Badge`, `Divider`, `Spinner`, etc.

- Use `forwardRef` with direct prop spreading
- No `useEffect`, no event listeners, no `useImperativeHandle`

**Complex components** (with events and/or methods): `Dialog`, `Drawer`, `Dropdown`, `Select`, etc.

- Use `forwardRef` + `useRef` + `useImperativeHandle`
- Have `useEffect` with event listeners (must include cleanup)
- May expose methods like `show()`, `hide()`

**Form controls**: `Button`, `Input`, `Textarea`, `Checkbox`, `Switch`, etc.

- Emit **native DOM events** (blur, focus, input, change) - no `wa-` prefix
- May have two-way binding patterns

**Portal/special components**: `Toast`, `Page`, `Charts`, etc.

- Non-standard patterns, may use portals or global methods

## Workflow

### Step 1: Understand the Change

Read the user's description of the pattern change. Clarify:

- Which file types are affected? (`.tsx.hbs`, `.jsx.hbs`, `.vue.hbs`, `.js.vue.hbs`, test files, CSS files)
- Does the change differ between simple and complex components?
- Does it affect React only, Vue only, or both?

### Step 2: Read Reference Files

1. Read `templates/AGENTS.md` for template conventions and critical rules
2. Read reference templates to understand current patterns:
   - Simple: `templates/react/Button/Button.tsx.hbs`
   - Complex: `templates/react/Dialog/Dialog.tsx.hbs`
   - Form control: `templates/react/Input/Input.tsx.hbs`
   - Vue simple: `templates/vue/Button/Button.vue.hbs`
   - Vue complex: `templates/vue/Dialog/Dialog.vue.hbs`

### Step 3: Build Component List

1. Read `src/utils/registry.ts` to get the full list of components
2. For each component, determine its complexity by checking:
   - Does its template use `useEffect`? (complex)
   - Does its template use `useImperativeHandle`? (has methods)
   - Does its registry entry have events? (event handling)
3. Group components by complexity class

### Step 4: Apply Changes

For each component, in each affected file type:

1. Read the current template
2. Determine if the change applies (based on complexity classification)
3. If yes, apply the transformation
4. If the component has a non-standard pattern, flag it for manual review

**Critical rules to maintain:**

- `class` not `className` on `<wa-*>` elements
- TypeScript `.tsx.hbs` uses named React imports; JavaScript `.jsx.hbs` uses default import + destructuring
- Event listeners in `useEffect` MUST have cleanup functions
- Use `requestClose()` not `hide()` for dialogs/drawers
- Vue templates use Options API + `defineExpose`
- CSS templates are identical between React and Vue

### Step 5: Validate

Run:

```bash
pnpm validate:templates
pnpm build
```

### Step 6: Report

Produce a summary:

```
## Template Refactor Summary

### Pattern: [description of change]

**Changed:** X files across Y components
**Skipped:** Z components (reason)
**Manual review needed:** N components

### Details
- [Component]: changed (.tsx.hbs, .jsx.hbs) | skipped (.vue.hbs - not applicable)
- ...
```

## Important Notes

- **Never** use `className` on `<wa-*>` elements. Always use `class`.
- **Never** forget event listener cleanup in `useEffect`.
- **Never** hardcode `@awesome.me/webawesome` or `@awesome.me/webawesome-pro` in templates. Always use `{{{importPath}}}`.
- When in doubt about a component's pattern, read its template first before modifying.
- If a change affects test templates, ensure the test structure remains valid (imports from correct relative path, uses correct test framework).
