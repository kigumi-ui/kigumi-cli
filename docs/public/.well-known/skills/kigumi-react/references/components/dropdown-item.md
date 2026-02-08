# DropdownItem

**Web Awesome**: `wa-dropdown-item`  
**Kigumi React**: `<DropdownItem>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-dropdown-item` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-dropdown-item type="normal" checked>Click me</wa-dropdown-item>
```

```tsx
// Kigumi React
import { DropdownItem } from '@/components/ui';

<DropdownItem type="normal" checked={true}>
  Click me
</DropdownItem>;
```

## Props

| Prop       | Type    | Values                 | Default  | Description                                       |
| ---------- | ------- | ---------------------- | -------- | ------------------------------------------------- |
| `type`     | string  | 'normal' \| 'checkbox' | `normal` | The type of menu item                             |
| `checked`  | boolean | -                      | `false`  | Draws the item in a checked state (checkbox type) |
| `value`    | string  | -                      | `''`     | A unique value for the menu item                  |
| `disabled` | boolean | -                      | `false`  | Disables the menu item                            |
| `loading`  | boolean | -                      | `false`  | Draws the item in a loading state                 |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add dropdown-item
```

---

**Documentation**: [webawesome.com/docs/components/dropdown-item](https://webawesome.com/docs/components/dropdown-item)
