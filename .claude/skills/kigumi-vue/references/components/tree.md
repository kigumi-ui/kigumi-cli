# Tree

**Web Awesome**: `wa-tree`  
**Kigumi Vue**: `<Tree>`  
**Category**: Navigation  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-tree` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tree selection="single">Click me</wa-tree>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Tree } from '@/components/ui';
</script>

<template>
  <Tree selection="single"> Click me </Tree>
</template>
```

## Props

| Prop        | Type   | Values                           | Default  | Description        |
| ----------- | ------ | -------------------------------- | -------- | ------------------ |
| `selection` | string | 'single' \| 'multiple' \| 'leaf' | `single` | Selection behavior |

## Slots

| Slot            | Description                                                                    |
| --------------- | ------------------------------------------------------------------------------ |
| _(default)_     | The default slot.                                                              |
| `expand-icon`   | The icon to show when the tree item is expanded. Works best with `<wa-icon>`.  |
| `collapse-icon` | The icon to show when the tree item is collapsed. Works best with `<wa-icon>`. |

## Events

| Event                 | Vue Handler            | Type          | Description                                         |
| --------------------- | ---------------------- | ------------- | --------------------------------------------------- |
| `wa-selection-change` | `@wa-selection-change` | `CustomEvent` | Emitted when a tree item is selected or deselected. |

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## CSS Custom Properties

| Property                | Default                          | Description                                                                                                     |
| ----------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--indent-size`         | `var(--wa-space-m)`              | The size of the indentation for nested items.                                                                   |
| `--indent-guide-color`  | `var(--wa-color-surface-border)` | The color of the indentation line.                                                                              |
| `--indent-guide-offset` | `0`                              | The amount of vertical spacing to leave between the top and bottom of the indentation line's starting position. |
| `--indent-guide-style`  | `solid`                          | The style of the indentation line, e.g. solid, dotted, dashed.                                                  |
| `--indent-guide-width`  | `0`                              | The width of the indentation line.                                                                              |

## Installation

```bash
npx kigumi add tree
```

---

**Documentation**: [webawesome.com/docs/components/tree](https://webawesome.com/docs/components/tree)
