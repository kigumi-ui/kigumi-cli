---
name: kigumi-compose-form
description: >
  Build complete forms with validation, error states, and async submission
  using Kigumi components. Use when the user asks to create a form, login page,
  settings form, contact form, registration form, multi-step wizard, or any
  feature that collects user input through Input, Select, Checkbox, Switch,
  Textarea, or other form controls.
user-invocable: true
allowed-tools: Read, Glob, Bash
---

# Compose Forms

Build production-ready, accessible forms with Kigumi form control components.

## When to Use

Invoke this skill when the user asks for:

- A **login/signup form** (email + password + remember me)
- A **contact form** (name + email + message)
- A **settings form** (grouped fields, multiple control types)
- A **multi-step wizard** (steps with validation per step)
- **Form validation** (required, patterns, custom, async)
- Any feature that **collects user input** through multiple form controls

## Prerequisites

1. Read `kigumi.config.json` for framework (`react`/`vue`), TypeScript, and `componentsDir`.
2. List installed components: `ls {componentsDir}/`
3. **Install missing form components BEFORE generating code:** `npx kigumi add input switch textarea select checkbox`. Never use raw `<wa-*>` tags.

## Critical Rule: Native Events

**Form controls emit NATIVE DOM events, NOT CustomEvent.**

This is the #1 agent mistake with Kigumi forms.

```tsx
// CORRECT: native Event, read via e.target
<Input onInput={(e) => setValue((e.target as HTMLInputElement).value)} />
<Checkbox onChange={(e) => setChecked((e.target as HTMLInputElement).checked)} />

// WRONG: CustomEvent -- this is for overlays, NOT forms
<Input onInput={(e: CustomEvent) => setValue(e.detail.value)} />
```

| Event  | React Handler | Vue Handler | Value Access                                         |
| ------ | ------------- | ----------- | ---------------------------------------------------- |
| input  | onInput       | @input      | `(e.target as HTMLInputElement).value`               |
| change | onChange      | @change     | `(e.target as HTMLInputElement).value` or `.checked` |
| blur   | onBlur        | @blur       | `(e.target as HTMLInputElement).value`               |
| focus  | onFocus       | @focus      | -                                                    |

**Vue v-model:** Kigumi Vue wrappers for Input, Textarea, Switch, Checkbox, Select all support `v-model`. Prefer `v-model` over manual event handling in Vue.

```vue
<!-- Vue: preferred pattern -->
<Input v-model="name" label="Name" />
<Switch v-model="darkMode" />
<Textarea v-model="bio" label="Bio" />
```

**Vue slots:** Use `slot="header"` attribute on child elements, NOT `<template #header>`.

```vue
<!-- CORRECT -->
<Card><div slot="header">Form Section</div></Card>

<!-- WRONG -- content silently disappears -->
<Card><template #header>Form Section</template></Card>
```

## Decision Tree

```
User needs a form
|
+-- Single field inline edit?
|   --> Input + Button in .wa-cluster layout
|
+-- Simple form (3-5 fields)?
|   --> Pattern A (Contact) or B (Login)
|
+-- Complex form (many fields, multiple types)?
|   --> Pattern C (Settings) with Details sections
|
+-- Multi-step process?
|   --> Pattern D (Wizard) with TabGroup
```

## Form Component Selection

| Need              | Component                                           | Tier  | Key Props                    |
| ----------------- | --------------------------------------------------- | ----- | ---------------------------- |
| Text input        | `Input`                                             | free  | type, label, hint, required  |
| Email             | `Input type="email"`                                | free  | required, pattern            |
| Password          | `Input type="password"`                             | free  | password-toggle              |
| Number            | `Input type="number"` (free) or `NumberInput` (pro) | mixed | min, max, step               |
| Multi-line text   | `Textarea`                                          | free  | rows, resize="auto"          |
| Single select     | `Select` + `Option`                                 | free  | label, required              |
| Searchable select | `Combobox` + `Option`                               | pro   | allow-custom-value           |
| Toggle            | `Switch`                                            | free  | checked                      |
| Checkbox          | `Checkbox`                                          | free  | checked, indeterminate       |
| Checkbox set      | `CheckboxGroup` + `Checkbox`                        | free  | label, hint, orientation     |
| Exclusive choice  | `RadioGroup` + `Radio`                              | free  | value, orientation           |
| File upload       | `FileInput`                                         | pro   | accept, multiple             |
| Color             | `ColorPicker`                                       | free  | format, opacity              |
| Range             | `Slider`                                            | free  | min, max, step               |
| Rating            | `Rating`                                            | free  | max, precision               |
| Time of day       | `TimeInput`                                         | free  | label, hour-format, with-now |
| Known date (DOB)  | `KnownDate`                                         | free  | label, min, max, locale      |

## Layout

Use `.wa-stack` for vertical field flow, `.wa-grid` for multi-column layouts:

```tsx
<form className="wa-stack wa-gap-l" style={{ maxWidth: '60ch' }}>
  {/* Two columns for short fields */}
  <div className="wa-grid" style={{ '--min-column-size': '200px' }}>
    <Input label="First name" required />
    <Input label="Last name" required />
  </div>

  {/* Full width for longer fields */}
  <Input label="Email" type="email" required />
  <Textarea label="Message" rows={4} />

  {/* Action buttons aligned right */}
  <div className="wa-cluster wa-justify-content-end wa-gap-s">
    <Button variant="neutral" type="reset">
      Cancel
    </Button>
    <Button variant="brand" type="submit">
      Submit
    </Button>
  </div>
</form>
```

## Validation

See [references/validation-patterns.md](references/validation-patterns.md) for complete patterns.

Quick summary:

- Use `required`, `minlength`, `maxlength`, `pattern`, `min`, `max` props for native validation
- Use `setCustomValidity()` on the element ref for custom validation
- `data-user-invalid` attribute appears after user interaction (not immediately)
- Use `hint` prop for field-level error messages
- Use `Callout variant="danger"` for form-level errors

## Framework Adaptation

### React

- `useState` for form data, `onSubmit` on `<form>`
- `onInput` for real-time updates, `onChange` for committed values
- `loading` prop on submit Button during async submission

### Vue

- `reactive()` for form data, `@submit` on `<form>`
- `@input` for real-time, `@change` for committed
- `:loading="loading"` on submit Button

### Angular

- Class properties for form data, `(submit)` on `<form>`
- `[(ngModel)]` with FormsModule for two-way binding (preferred) -- CVA handles value sync
- Do NOT wire `(inputEvent)` or `(change)` for value tracking -- CVA does it
- `[loading]="loading"` on submit Button
- If `framework: "angular"` in `kigumi.config.json`, use patterns from `references/form-patterns-angular.md`

## Accessibility Checklist

- [ ] Every form control has a `label` prop
- [ ] Use `hint` prop for supplementary instructions
- [ ] `required` prop on mandatory fields
- [ ] Submit button has descriptive text (not just "Submit")
- [ ] Form-level errors use Callout with `variant="danger"`
- [ ] Form is wrapped in a `<form>` element (not just a div)

## Output Format

Always provide:

1. Install commands for missing components
2. Complete imports
3. Full functional component with state, validation, and submit handling
4. Both TypeScript and JavaScript match config

## References

- [React API Surface](../shared/react-api-surface.md) / [Vue API Surface](../shared/vue-api-surface.md) / [Angular API Surface](../shared/angular-api-surface.md) -- component props, events, slots, CSS parts
- [Form Patterns](references/form-patterns.md) -- 4 complete patterns (Contact, Login, Settings, Wizard), styling tokens, slots, success states, react-hook-form
- [Form Patterns Angular](references/form-patterns-angular.md) -- 4 patterns as Angular standalone components with CVA/ngModel
- [Validation Patterns](references/validation-patterns.md) -- native, custom, async validation
- [Form Component Cheatsheet](references/form-component-cheatsheet.md) -- which component for which input type, key slots

## Related Skills

- **compose-overlay** -- Form-in-dialog patterns, success toast notifications after submission
- **compose-layout** -- Settings page layouts, form placement within app shells and dashboards
