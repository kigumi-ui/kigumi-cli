# DropdownItem

**Web Awesome**: `wa-dropdown-item`  
**Kigumi Vue**: `<DropdownItem>`  
**Category**: Overlays  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-dropdown-item` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-dropdown-item type="normal" checked>Click me</wa-dropdown-item>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { DropdownItem } from '@/components/ui';
</script>

<template>
  <DropdownItem type="normal" checked> Click me </DropdownItem>
</template>
```

## Props

| Prop       | Type    | Values                 | Default   | Description                                       |
| ---------- | ------- | ---------------------- | --------- | ------------------------------------------------- |
| `type`     | string  | 'normal' \| 'checkbox' | `normal`  | The type of menu item                             |
| `checked`  | boolean | -                      | `false`   | Draws the item in a checked state (checkbox type) |
| `value`    | string  | -                      | `''`      | A unique value for the menu item                  |
| `disabled` | boolean | -                      | `false`   | Disables the menu item                            |
| `loading`  | boolean | -                      | `false`   | Draws the item in a loading state                 |
| `variant`  | string  | 'neutral' \| 'danger'  | `neutral` | The dropdown item variant                         |

## Slots

| Slot        | Description                                                                      |
| ----------- | -------------------------------------------------------------------------------- |
| _(default)_ | The dropdown item's label.                                                       |
| `icon`      | An optional icon to display before the label.                                    |
| `details`   | Additional content or details to display after the label.                        |
| `submenu`   | Submenu items, typically `<wa-dropdown-item>` elements, to create a nested menu. |

## Events

| Event   | Vue Handler | Type         | Description                                 |
| ------- | ----------- | ------------ | ------------------------------------------- |
| `blur`  | `@blur`     | `FocusEvent` | Emitted when the dropdown item loses focus. |
| `focus` | `@focus`    | `FocusEvent` | Emitted when the dropdown item gains focus. |

## CSS Parts

| Part           | Description                                                             |
| -------------- | ----------------------------------------------------------------------- |
| `checkmark`    | The checkmark icon (a `<wa-icon>` element) when the item is a checkbox. |
| `icon`         | The container for the icon slot.                                        |
| `label`        | The container for the label slot.                                       |
| `details`      | The container for the details slot.                                     |
| `submenu-icon` | The submenu indicator icon (a `<wa-icon>` element).                     |
| `submenu`      | The submenu container.                                                  |

## Methods

| Method           | Parameters | Description         |
| ---------------- | ---------- | ------------------- |
| `openSubmenu()`  | -          | Opens the submenu.  |
| `closeSubmenu()` | -          | Closes the submenu. |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add dropdown-item
```

---

**Documentation**: [webawesome.com/docs/components/dropdown-item](https://webawesome.com/docs/components/dropdown-item)
