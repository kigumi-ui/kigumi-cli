# Comparison

**Web Awesome**: `wa-comparison`  
**Kigumi Vue**: `<Comparison>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-comparison` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-comparison position="50">Click me</wa-comparison>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Comparison } from '@/components/ui';
</script>

<template>
  <Comparison position="50"> Click me </Comparison>
</template>
```

## Props

| Prop       | Type   | Values | Default | Description                            |
| ---------- | ------ | ------ | ------- | -------------------------------------- |
| `position` | number | -      | `50`    | Divider location as percentage (0-100) |

## Slots

| Slot     | Description                                              |
| -------- | -------------------------------------------------------- |
| `before` | The before content, often an `<img>` or `<svg>` element. |
| `after`  | The after content, often an `<img>` or `<svg>` element.  |
| `handle` | The icon used inside the handle.                         |

## Events

| Event    | Vue Handler | Type    | Description                        |
| -------- | ----------- | ------- | ---------------------------------- |
| `change` | `@change`   | `Event` | Emitted when the position changes. |

## CSS Parts

| Part      | Description                                                 |
| --------- | ----------------------------------------------------------- |
| `base`    | The container that wraps the before and after content.      |
| `before`  | The container that wraps the before content.                |
| `after`   | The container that wraps the after content.                 |
| `divider` | The divider that separates the before and after content.    |
| `handle`  | The handle that the user drags to expose the after content. |

## CSS Custom Properties

| Property          | Default | Description                     |
| ----------------- | ------- | ------------------------------- |
| `--divider-width` | -       | The width of the dividing line. |
| `--handle-size`   | -       | The size of the compare handle. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add comparison
```

---

**Documentation**: [webawesome.com/docs/components/comparison](https://webawesome.com/docs/components/comparison)
