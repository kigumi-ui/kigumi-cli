# Scroller

**Web Awesome**: `wa-scroller`  
**Kigumi Vue**: `<Scroller>`  
**Category**: Layout  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-scroller` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-scroller orientation="horizontal" with-scroll-indicator
  >Click me</wa-scroller
>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Scroller } from '@/components/ui';
</script>

<template>
  <Scroller orientation="horizontal" with-scroll-indicator> Click me </Scroller>
</template>
```

## Props

| Prop                    | Type    | Values                               | Default | Description             |
| ----------------------- | ------- | ------------------------------------ | ------- | ----------------------- |
| `orientation`           | string  | 'horizontal' \| 'vertical' \| 'both' | `both`  | Scroll direction        |
| `with-scroll-indicator` | boolean | -                                    | `false` | Shows shadow indicators |
| `without-scrollbar`     | boolean | -                                    | `false` | Hides the scrollbar     |
| `without-shadow`        | boolean | -                                    | `false` | Hides shadow indicators |

## Slots

| Slot        | Description                              |
| ----------- | ---------------------------------------- |
| _(default)_ | The content to show inside the scroller. |

## CSS Parts

| Part      | Description                                   |
| --------- | --------------------------------------------- |
| `content` | The container that wraps the slotted content. |

## CSS Custom Properties

| Property         | Default                           | Description                   |
| ---------------- | --------------------------------- | ----------------------------- |
| `--shadow-color` | `var(--wa-color-surface-default)` | The base color of the shadow. |
| `--shadow-size`  | `2rem`                            | The size of the shadow.       |

## Installation

```bash
npx kigumi add scroller
```

---

**Documentation**: [webawesome.com/docs/components/scroller](https://webawesome.com/docs/components/scroller)
