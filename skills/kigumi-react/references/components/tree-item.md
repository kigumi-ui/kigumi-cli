# TreeItem

**Web Awesome**: `wa-tree-item`  
**Kigumi React**: `<TreeItem>`  
**Category**: Navigation  
**Tier**: free

React wrapper component for the Web Awesome `wa-tree-item` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tree-item expanded selected>Click me</wa-tree-item>
```

```tsx
// Kigumi React
import { TreeItem } from "@/components/ui";

<TreeItem expanded={true} selected={true}>
  Click me
</TreeItem>;
```

## Props

| Prop       | Type    | Values | Default | Description          |
| ---------- | ------- | ------ | ------- | -------------------- |
| `expanded` | boolean | -      | `false` | Expands the item     |
| `selected` | boolean | -      | `false` | Selects the item     |
| `disabled` | boolean | -      | `false` | Disables the item    |
| `lazy`     | boolean | -      | `false` | Enables lazy loading |

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
