# Badge

**Web Awesome**: `wa-badge`  
**Kigumi Vue**: `<Badge>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-badge` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-badge variant="brand" appearance="accent">Click me</wa-badge>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Badge } from '@/components/ui';
</script>

<template>
  <Badge variant="brand" appearance="accent"> Click me </Badge>
</template>
```

## Props

| Prop         | Type    | Values                                                     | Default  | Description                                      |
| ------------ | ------- | ---------------------------------------------------------- | -------- | ------------------------------------------------ |
| `variant`    | string  | 'brand' \| 'neutral' \| 'success' \| 'warning' \| 'danger' | `brand`  | The badge's theme variant                        |
| `appearance` | string  | 'accent' \| 'filled' \| 'outlined' \| 'filled-outlined'    | `accent` | The badge's visual appearance                    |
| `pill`       | boolean | -                                                          | `false`  | Draws a pill-style badge with rounded edges      |
| `attention`  | string  | 'none' \| 'pulse' \| 'bounce'                              | `none`   | Adds an animation to draw attention to the badge |

## Slots

| Slot        | Description                                               |
| ----------- | --------------------------------------------------------- |
| _(default)_ | The badge's content.                                      |
| `start`     | An element, such as `<wa-icon>`, placed before the label. |
| `end`       | An element, such as `<wa-icon>`, placed after the label.  |

## CSS Parts

| Part    | Description                                |
| ------- | ------------------------------------------ |
| `base`  | The component's base wrapper.              |
| `start` | The container that wraps the `start` slot. |
| `end`   | The container that wraps the `end` slot.   |

## CSS Custom Properties

| Property        | Default | Description                                                           |
| --------------- | ------- | --------------------------------------------------------------------- |
| `--pulse-color` | -       | The color of the badge's pulse effect when using `attention="pulse"`. |

## Installation

```bash
npx kigumi add badge
```

---

**Documentation**: [webawesome.com/docs/components/badge](https://webawesome.com/docs/components/badge)
