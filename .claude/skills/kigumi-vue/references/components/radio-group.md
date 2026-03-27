# RadioGroup

**Web Awesome**: `wa-radio-group`  
**Kigumi Vue**: `<RadioGroup>`  
**Category**: Form Controls  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-radio-group` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-radio-group label="''" hint="''">Click me</wa-radio-group>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { RadioGroup } from '@/components/ui';
</script>

<template>
  <RadioGroup label="''" hint="''"> Click me </RadioGroup>
</template>
```

## Props

| Prop          | Type    | Values                         | Default    | Description               |
| ------------- | ------- | ------------------------------ | ---------- | ------------------------- |
| `label`       | string  | -                              | `''`       | Group label               |
| `hint`        | string  | -                              | `''`       | Hint text                 |
| `name`        | string  | -                              | `option`   | Form field name           |
| `value`       | string  | -                              | `''`       | Selected value            |
| `size`        | string  | 'small' \| 'medium' \| 'large' | `medium`   | Radio size                |
| `required`    | boolean | -                              | `false`    | Makes selection required  |
| `orientation` | string  | 'horizontal' \| 'vertical'     | `vertical` | Layout direction          |
| `disabled`    | boolean | -                              | `false`    | Disables the group        |
| `invalid`     | boolean | -                              | `false`    | Shows invalid/error state |
| `help-text`   | string  | -                              | `''`       | Help text below the group |

## Slots

| Slot        | Description                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------- |
| _(default)_ | The default slot where `<wa-radio>` elements are placed.                                                      |
| `label`     | The radio group's label. Required for proper accessibility. Alternatively, you can use the `label` attribute. |
| `hint`      | Text that describes how to use the radio group. Alternatively, you can use the `hint` attribute.              |

## Events

| Event        | Vue Handler   | Type          | Description                                                                                       |
| ------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------- |
| `input`      | `@input`      | `InputEvent`  | Emitted when the radio group receives user input.                                                 |
| `change`     | `@change`     | `Event`       | Emitted when the radio group's selected value changes.                                            |
| `wa-invalid` | `@wa-invalid` | `CustomEvent` | Emitted when the form control has been checked for validity and its constraints aren't satisfied. |

## CSS Parts

| Part                 | Description                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| `form-control`       | The form control that wraps the label, input, and hint.                        |
| `form-control-label` | The label's wrapper.                                                           |
| `form-control-input` | The input's wrapper.                                                           |
| `radios`             | The wrapper than surrounds radio items, styled as a flex container by default. |
| `hint`               | The hint's wrapper.                                                            |

## Methods

| Method    | Parameters              | Description                    |
| --------- | ----------------------- | ------------------------------ |
| `focus()` | `options: FocusOptions` | Sets focus on the radio group. |

## Dependencies

This component requires:

- [`ButtonGroup`](button-group.md)

## Installation

```bash
npx kigumi add radio-group
```

---

**Documentation**: [webawesome.com/docs/components/radio-group](https://webawesome.com/docs/components/radio-group)
