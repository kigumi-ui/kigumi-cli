# Popover

**Web Awesome**: `wa-popover`  
**Kigumi React**: `<Popover>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-popover` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-popover open disabled>Click me</wa-popover>
```

```tsx
// Kigumi React
import { Popover } from "@/components/ui";

<Popover open={true} disabled={true}>
  Click me
</Popover>;
```

## Props

| Prop         | Type    | Values                                                                                                                                                             | Default | Description                             |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | --------------------------------------- |
| `open`       | boolean | -                                                                                                                                                                  | `false` | Indicates whether the popover is open   |
| `disabled`   | boolean | -                                                                                                                                                                  | `false` | Disables the popover                    |
| `placement`  | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `top`   | Preferred placement                     |
| `trigger`    | string  | -                                                                                                                                                                  | `click` | Activation events (click, hover, focus) |
| `distance`   | number  | -                                                                                                                                                                  | `8`     | Distance from trigger                   |
| `skidding`   | number  | -                                                                                                                                                                  | `0`     | Offset along trigger                    |
| `with-arrow` | boolean | -                                                                                                                                                                  | `false` | Shows an arrow                          |

## Dependencies

This component requires:

- [`Popup`](popup.md)

## Installation

```bash
npx kigumi add popover
```

---

**Documentation**: [webawesome.com/docs/components/popover](https://webawesome.com/docs/components/popover)
