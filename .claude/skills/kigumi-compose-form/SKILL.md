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
3. Generate install commands for missing form components.

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

| Event | Handler | Value Access |
|-------|---------|-------------|
| input | onInput / @input | `(e.target as HTMLInputElement).value` |
| change | onChange / @change | `(e.target as HTMLInputElement).value` or `.checked` |
| blur | onBlur / @blur | `(e.target as HTMLInputElement).value` |
| focus | onFocus / @focus | - |

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

| Need | Component | Tier | Key Props |
|------|-----------|------|-----------|
| Text input | `Input` | free | type, label, hint, required |
| Email | `Input type="email"` | free | required, pattern |
| Password | `Input type="password"` | free | password-toggle |
| Number | `Input type="number"` (free) or `NumberInput` (pro) | mixed | min, max, step |
| Multi-line text | `Textarea` | free | rows, resize="auto" |
| Single select | `Select` + `Option` | free | label, required |
| Searchable select | `Combobox` + `Option` | pro | allow-custom-value |
| Toggle | `Switch` | free | checked |
| Checkbox | `Checkbox` | free | checked, indeterminate |
| Exclusive choice | `RadioGroup` + `Radio` | free | value, orientation |
| File upload | `FileInput` | pro | accept, multiple |
| Color | `ColorPicker` | free | format, opacity |
| Range | `Slider` | free | min, max, step |
| Rating | `Rating` | free | max, precision |

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
    <Button variant="neutral" type="reset">Cancel</Button>
    <Button variant="brand" type="submit">Submit</Button>
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

- [Form Patterns](references/form-patterns.md) -- 4 complete patterns (Contact, Login, Settings, Wizard)
- [Validation Patterns](references/validation-patterns.md) -- native, custom, async validation
- [Form Component Cheatsheet](references/form-component-cheatsheet.md) -- which component for which input type
