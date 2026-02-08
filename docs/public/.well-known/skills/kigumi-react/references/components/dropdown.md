# Dropdown

**Web Awesome**: `wa-dropdown`  
**Kigumi React**: `<Dropdown>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-dropdown` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-dropdown open placement="top">Click me</wa-dropdown>
```

```tsx
// Kigumi React
import { Dropdown } from '@/components/ui';

<Dropdown open={true} placement="top">
  Click me
</Dropdown>;
```

## Props

| Prop                  | Type    | Values                                                                                                                                                             | Default        | Description                                      |
| --------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------ |
| `open`                | boolean | -                                                                                                                                                                  | `false`        | Indicates whether the dropdown is open           |
| `placement`           | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `bottom-start` | Preferred placement of the dropdown panel        |
| `disabled`            | boolean | -                                                                                                                                                                  | `false`        | Disables the dropdown                            |
| `stay-open-on-select` | boolean | -                                                                                                                                                                  | `false`        | Keeps the dropdown open when an item is selected |
| `distance`            | number  | -                                                                                                                                                                  | `0`            | Distance from the panel to the trigger           |
| `skidding`            | number  | -                                                                                                                                                                  | `0`            | Offset along the trigger                         |
| `hoist`               | boolean | -                                                                                                                                                                  | `false`        | Hoists the dropdown panel to the body            |

## Dependencies

This component requires:

- [`Popup`](popup.md)

## Installation

```bash
npx kigumi add dropdown
```

---

**Documentation**: [webawesome.com/docs/components/dropdown](https://webawesome.com/docs/components/dropdown)
