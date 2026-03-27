# SplitPanel

**Web Awesome**: `wa-split-panel`  
**Kigumi Vue**: `<SplitPanel>`  
**Category**: Layout  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-split-panel` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-split-panel position="50" position-in-pixels="value"
  >Click me</wa-split-panel
>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { SplitPanel } from '@/components/ui';
</script>

<template>
  <SplitPanel position="50" position-in-pixels="value"> Click me </SplitPanel>
</template>
```

## Props

| Prop                 | Type    | Values                     | Default      | Description           |
| -------------------- | ------- | -------------------------- | ------------ | --------------------- |
| `position`           | number  | -                          | `50`         | Divider position (%)  |
| `position-in-pixels` | number  | -                          | `-`          | Divider position (px) |
| `orientation`        | string  | 'horizontal' \| 'vertical' | `horizontal` | Panel orientation     |
| `primary`            | string  | 'start' \| 'end'           | `start`      | Primary panel         |
| `disabled`           | boolean | -                          | `false`      | Disables resizing     |
| `snap`               | string  | -                          | `-`          | Snap points           |
| `snap-threshold`     | number  | -                          | `12`         | Snap threshold (px)   |

## Slots

| Slot      | Description                                                                 |
| --------- | --------------------------------------------------------------------------- |
| `start`   | Content to place in the start panel.                                        |
| `end`     | Content to place in the end panel.                                          |
| `divider` | The divider. Useful for slotting in a custom icon that renders as a handle. |

## Events

| Event           | Vue Handler      | Type          | Description                                  |
| --------------- | ---------------- | ------------- | -------------------------------------------- |
| `wa-reposition` | `@wa-reposition` | `CustomEvent` | Emitted when the divider's position changes. |

## CSS Parts

| Part      | Description                                          |
| --------- | ---------------------------------------------------- |
| `start`   | The start panel.                                     |
| `end`     | The end panel.                                       |
| `panel`   | Targets both the start and end panels.               |
| `divider` | The divider that separates the start and end panels. |

## CSS Custom Properties

| Property             | Default | Description                                                                                                                             |
| -------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `--divider-width`    | `4px`   | The width of the visible divider.                                                                                                       |
| `--divider-hit-area` | `12px`  | The invisible region around the divider where dragging can occur. This is usually wider than the divider to facilitate easier dragging. |
| `--min`              | `0`     | The minimum allowed size of the primary panel.                                                                                          |
| `--max`              | `100%`  | The maximum allowed size of the primary panel.                                                                                          |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add split-panel
```

---

**Documentation**: [webawesome.com/docs/components/split-panel](https://webawesome.com/docs/components/split-panel)
