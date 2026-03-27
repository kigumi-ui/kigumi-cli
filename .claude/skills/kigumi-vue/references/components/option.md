# Option

**Web Awesome**: `wa-option`  
**Kigumi Vue**: `<Option>`  
**Category**: Form Controls  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-option` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-option value="''" disabled>Click me</wa-option>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Option } from '@/components/ui';
</script>

<template>
  <Option value="''" disabled> Click me </Option>
</template>
```

## Props

| Prop       | Type    | Values | Default | Description                                                    |
| ---------- | ------- | ------ | ------- | -------------------------------------------------------------- |
| `value`    | string  | -      | `''`    | The option value                                               |
| `disabled` | boolean | -      | `false` | Disables the option                                            |
| `selected` | boolean | -      | `false` | Draws the option in a selected state                           |
| `label`    | string  | -      | `-`     | A custom label for the option (used by select's display input) |

## Slots

| Slot        | Description                                               |
| ----------- | --------------------------------------------------------- |
| _(default)_ | The option's label.                                       |
| `start`     | An element, such as `<wa-icon>`, placed before the label. |
| `end`       | An element, such as `<wa-icon>`, placed after the label.  |

## CSS Parts

| Part           | Description                                |
| -------------- | ------------------------------------------ |
| `checked-icon` | The checked icon, a `<wa-icon>` element.   |
| `label`        | The option's label.                        |
| `start`        | The container that wraps the `start` slot. |
| `end`          | The container that wraps the `end` slot.   |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add option
```

---

**Documentation**: [webawesome.com/docs/components/option](https://webawesome.com/docs/components/option)
