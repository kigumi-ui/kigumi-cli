# Form Component Cheatsheet

Quick reference: which Kigumi component for which input type.

## Selection Guide

| Input Need | Component | Tier | Install |
|---|---|---|---|
| Short text | `<Input>` | free | `npx kigumi add input` |
| Email | `<Input type="email">` | free | `npx kigumi add input` |
| Password | `<Input type="password" password-toggle>` | free | `npx kigumi add input` |
| URL | `<Input type="url">` | free | `npx kigumi add input` |
| Phone | `<Input type="tel">` | free | `npx kigumi add input` |
| Search | `<Input type="search" with-clear>` | free | `npx kigumi add input` |
| Date | `<Input type="date">` | free | `npx kigumi add input` |
| Number (basic) | `<Input type="number">` | free | `npx kigumi add input` |
| Number (steppers) | `<NumberInput>` | **pro** | `npx kigumi add number-input` |
| Multi-line text | `<Textarea resize="auto">` | free | `npx kigumi add textarea` |
| Single select | `<Select>` + `<Option>` | free | `npx kigumi add select option` |
| Multi select | `<Select multiple>` + `<Option>` | free | `npx kigumi add select option` |
| Searchable select | `<Combobox>` + `<Option>` | **pro** | `npx kigumi add combobox option` |
| Yes/No toggle | `<Switch>` | free | `npx kigumi add switch` |
| Checkbox | `<Checkbox>` | free | `npx kigumi add checkbox` |
| Exclusive choice | `<RadioGroup>` + `<Radio>` | free | `npx kigumi add radio-group radio` |
| File upload | `<FileInput>` | **pro** | `npx kigumi add file-input` |
| Color | `<ColorPicker>` | free | `npx kigumi add color-picker` |
| Range/slider | `<Slider>` | free | `npx kigumi add slider` |
| Star rating | `<Rating>` | free | `npx kigumi add rating` |

## Key Props Per Component

### Input
`label` `hint` `type` `placeholder` `value` `required` `disabled` `readonly` `minlength` `maxlength` `pattern` `min` `max` `step` `size` (small|medium|large) `appearance` (filled|outlined|filled-outlined) `pill` `with-clear` `password-toggle` `name`

### Textarea
`label` `hint` `rows` `resize` (none|vertical|horizontal|both|auto) `placeholder` `value` `required` `disabled` `readonly` `minlength` `maxlength` `name` `size` `appearance`

### Select
`label` `hint` `placeholder` `value` `multiple` `max-options-visible` `with-clear` `required` `disabled` `open` `size` `appearance` `name`

### Checkbox
`checked` `indeterminate` `disabled` `required` `name` `value` `size` `hint`

### Switch
`checked` `disabled` `required` `name` `value` `size` `hint`

### RadioGroup
`label` `hint` `name` `value` `required` `disabled` `orientation` (horizontal|vertical) `size`

### Slider
`label` `hint` `min` `max` `step` `value` `name` `required` `disabled` `range` `orientation` `with-markers` `with-tooltip` `size`

### ColorPicker
`value` `format` (hex|rgb|hsl|hsv) `opacity` `label` `hint` `name` `required` `disabled` `swatches` `inline` `size`

### Rating
`label` `value` `max` `precision` `readonly` `disabled` `size`

### NumberInput (Pro)
`label` `hint` `value` `min` `max` `step` `placeholder` `required` `disabled` `without-steppers` `size` `appearance`

### FileInput (Pro)
`label` `hint` `accept` `multiple` `required` `disabled` `size`

### Combobox (Pro)
`label` `hint` `placeholder` `value` `multiple` `allow-custom-value` `required` `disabled` `size` `appearance`

## Key Slots

Slots let you place icons or custom content inside form controls. Use `slot="name"` on child elements.

| Component | Slots |
|-----------|-------|
| **Input** | `start`, `end`, `label`, `hint`, `clear-icon`, `show-password-icon`, `hide-password-icon` |
| **Select** | `start`, `end`, `label`, `hint`, `clear-icon`, `expand-icon` |
| **Textarea** | `label`, `hint` |
| **Combobox** (pro) | `start`, `end`, `label`, `hint`, `clear-icon`, `expand-icon` |

Most-used pattern -- prefix/suffix icons in Input:

```tsx
<Input label="Search" type="search">
  <Icon slot="start" name="search" />
  <Icon slot="end" name="x-circle" />
</Input>
```

See [form-patterns.md](form-patterns.md#form-control-slots) for more slot examples.

## Event Patterns

All form controls use **native DOM events**:

```tsx
// React
<Input onInput={(e) => setValue((e.target as HTMLInputElement).value)} />
<Checkbox onChange={(e) => setChecked((e.target as HTMLInputElement).checked)} />
<Select onInput={(e) => setRole((e.target as HTMLSelectElement).value)} />
<Switch onChange={(e) => setEnabled((e.target as HTMLInputElement).checked)} />
<Slider onInput={(e) => setVolume(Number((e.target as HTMLInputElement).value))} />
```

```vue
<!-- Vue -->
<Input @input="(e: Event) => value = (e.target as HTMLInputElement).value" />
<Checkbox @change="(e: Event) => checked = (e.target as HTMLInputElement).checked" />
<Select @input="(e: Event) => role = (e.target as HTMLSelectElement).value" />
```
