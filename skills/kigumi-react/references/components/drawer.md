# Drawer

**Web Awesome**: `wa-drawer`  
**Kigumi React**: `<Drawer>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-drawer` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-drawer open label="''">Click me</wa-drawer>
```

```tsx
// Kigumi React
import { Drawer } from "@/components/ui";

<Drawer open={true} label="''">
  Click me
</Drawer>;
```

## Props

| Prop             | Type    | Values                                | Default | Description                                          |
| ---------------- | ------- | ------------------------------------- | ------- | ---------------------------------------------------- |
| `open`           | boolean | -                                     | `false` | Indicates whether the drawer is open                 |
| `label`          | string  | -                                     | `''`    | The drawer's label as displayed in the header        |
| `placement`      | string  | 'top' \| 'end' \| 'bottom' \| 'start' | `end`   | The direction from which the drawer will open        |
| `light-dismiss`  | boolean | -                                     | `false` | Closes the drawer when the user clicks outside of it |
| `without-header` | boolean | -                                     | `false` | Removes the header                                   |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add drawer
```

---

**Documentation**: [webawesome.com/docs/components/drawer](https://webawesome.com/docs/components/drawer)
