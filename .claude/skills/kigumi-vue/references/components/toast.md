# Toast

**Web Awesome**: `wa-toast`  
**Kigumi Vue**: `<Toast>`  
**Category**: Feedback  
**Tier**: pro

Vue wrapper component for the Web Awesome `wa-toast` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-toast placement="top-start">Click me</wa-toast>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Toast } from '@/components/ui';
</script>

<template>
  <Toast placement="top-start"> Click me </Toast>
</template>
```

## Props

| Prop        | Type   | Values                                                                                        | Default   | Description                                            |
| ----------- | ------ | --------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------ |
| `placement` | string | 'top-start' \| 'top-center' \| 'top-end' \| 'bottom-start' \| 'bottom-center' \| 'bottom-end' | `top-end` | Screen corner or edge where notifications are anchored |

## Slots

| Slot        | Description                                                          |
| ----------- | -------------------------------------------------------------------- |
| _(default)_ | Place `<wa-toast-item>` elements here to show them as notifications. |

## CSS Parts

| Part    | Description                               |
| ------- | ----------------------------------------- |
| `stack` | The container that holds the toast items. |

## CSS Custom Properties

| Property  | Default             | Description                          |
| --------- | ------------------- | ------------------------------------ |
| `--gap`   | `var(--wa-space-s)` | The gap between stacked toast items. |
| `--width` | `28rem`             | The width of the toast stack.        |

## Methods

| Method     | Parameters                                       | Description                                                                                                                    |
| ---------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `create()` | `message: string`, `options: ToastCreateOptions` | Creates a toast notification programmatically and adds it to the stack. Returns a reference to the created toast item element. |

## Dependencies

This component requires:

- [`ToastItem`](toast-item.md)

## Installation

```bash
npx kigumi add toast
```

---

**Documentation**: [webawesome.com/docs/components/toast](https://webawesome.com/docs/components/toast)
