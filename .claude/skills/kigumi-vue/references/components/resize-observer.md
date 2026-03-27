# ResizeObserver

**Web Awesome**: `wa-resize-observer`  
**Kigumi Vue**: `<ResizeObserver>`  
**Category**: Utilities  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-resize-observer` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-resize-observer disabled>Click me</wa-resize-observer>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { ResizeObserver } from '@/components/ui';
</script>

<template>
  <ResizeObserver disabled> Click me </ResizeObserver>
</template>
```

## Props

| Prop       | Type    | Values | Default | Description           |
| ---------- | ------- | ------ | ------- | --------------------- |
| `disabled` | boolean | -      | `false` | Disables the observer |

## Slots

| Slot        | Description                                 |
| ----------- | ------------------------------------------- |
| _(default)_ | One or more elements to watch for resizing. |

## Events

| Event       | Vue Handler  | Type          | Description                          |
| ----------- | ------------ | ------------- | ------------------------------------ |
| `wa-resize` | `@wa-resize` | `CustomEvent` | Emitted when the element is resized. |

## Installation

```bash
npx kigumi add resize-observer
```

---

**Documentation**: [webawesome.com/docs/components/resize-observer](https://webawesome.com/docs/components/resize-observer)
