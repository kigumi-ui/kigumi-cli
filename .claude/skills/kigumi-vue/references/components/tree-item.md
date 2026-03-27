# TreeItem

**Web Awesome**: `wa-tree-item`  
**Kigumi Vue**: `<TreeItem>`  
**Category**: Navigation  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-tree-item` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tree-item expanded selected>Click me</wa-tree-item>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { TreeItem } from '@/components/ui';
</script>

<template>
  <TreeItem expanded selected> Click me </TreeItem>
</template>
```

## Props

| Prop       | Type    | Values | Default | Description          |
| ---------- | ------- | ------ | ------- | -------------------- |
| `expanded` | boolean | -      | `false` | Expands the item     |
| `selected` | boolean | -      | `false` | Selects the item     |
| `disabled` | boolean | -      | `false` | Disables the item    |
| `lazy`     | boolean | -      | `false` | Enables lazy loading |

## Slots

| Slot            | Description                                       |
| --------------- | ------------------------------------------------- |
| _(default)_     | The default slot.                                 |
| `expand-icon`   | The icon to show when the tree item is expanded.  |
| `collapse-icon` | The icon to show when the tree item is collapsed. |

## Events

| Event               | Vue Handler          | Type          | Description                                                                                                                                                                                                                             |
| ------------------- | -------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wa-expand`         | `@wa-expand`         | `CustomEvent` | Emitted when the tree item expands.                                                                                                                                                                                                     |
| `wa-after-expand`   | `@wa-after-expand`   | `CustomEvent` | Emitted after the tree item expands and all animations are complete.                                                                                                                                                                    |
| `wa-collapse`       | `@wa-collapse`       | `CustomEvent` | Emitted when the tree item collapses.                                                                                                                                                                                                   |
| `wa-after-collapse` | `@wa-after-collapse` | `CustomEvent` | Emitted after the tree item collapses and all animations are complete.                                                                                                                                                                  |
| `wa-lazy-change`    | `@wa-lazy-change`    | `CustomEvent` | Emitted when the tree item's lazy state changes.                                                                                                                                                                                        |
| `wa-lazy-load`      | `@wa-lazy-load`      | `CustomEvent` | Emitted when a lazy item is selected. Use this event to asynchronously load data and append items to the tree before expanding. After appending new items, remove the `lazy` attribute to remove the loading state and update the tree. |

## CSS Parts

| Part                           | Description                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `base`                         | The component's base wrapper.                                                               |
| `item`                         | The tree item's container. This element wraps everything except slotted tree item children. |
| `indentation`                  | The tree item's indentation container.                                                      |
| `expand-button`                | The container that wraps the tree item's expand button and spinner.                         |
| `spinner`                      | The spinner that shows when a lazy tree item is in the loading state.                       |
| `spinner__base`                | The spinner's base part.                                                                    |
| `label`                        | The tree item's label.                                                                      |
| `children`                     | The container that wraps the tree item's nested children.                                   |
| `checkbox`                     | The checkbox that shows when using multiselect.                                             |
| `checkbox__base`               | The checkbox's exported `base` part.                                                        |
| `checkbox__control`            | The checkbox's exported `control` part.                                                     |
| `checkbox__checked-icon`       | The checkbox's exported `checked-icon` part.                                                |
| `checkbox__indeterminate-icon` | The checkbox's exported `indeterminate-icon` part.                                          |
| `checkbox__label`              | The checkbox's exported `label` part.                                                       |

## CSS Custom Properties

| Property          | Default | Description                                        |
| ----------------- | ------- | -------------------------------------------------- |
| `--show-duration` | `200ms` | The animation duration when expanding tree items.  |
| `--hide-duration` | `200ms` | The animation duration when collapsing tree items. |

## Methods

| Method               | Parameters                                                  | Description                                  |
| -------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| `getChildrenItems()` | `{ includeDisabled = true }: { includeDisabled?: boolean }` | Gets all the nested tree items in this node. |

## Dependencies

This component requires:

- [`Icon`](icon.md)
- [`Checkbox`](checkbox.md)
- [`Spinner`](spinner.md)

## Installation

```bash
npx kigumi add tree-item
```

---

**Documentation**: [webawesome.com/docs/components/tree-item](https://webawesome.com/docs/components/tree-item)
