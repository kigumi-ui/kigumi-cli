# Tooltip

**Web Awesome**: `wa-tooltip`  
**Kigumi React**: `<Tooltip>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-tooltip` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-tooltip content="''" placement="top">Click me</wa-tooltip>
```

```tsx
// Kigumi React
import { Tooltip } from "@/components/ui";

<Tooltip content="''" placement="top">
  Click me
</Tooltip>;
```

## Props

| Prop            | Type    | Values                                                                                                                                                             | Default       | Description                 |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------- | --------------------------- |
| `content`       | string  | -                                                                                                                                                                  | `''`          | Tooltip content             |
| `placement`     | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `top`         | Tooltip placement           |
| `disabled`      | boolean | -                                                                                                                                                                  | `false`       | Disables the tooltip        |
| `distance`      | number  | -                                                                                                                                                                  | `8`           | Distance from target        |
| `open`          | boolean | -                                                                                                                                                                  | `false`       | Whether the tooltip is open |
| `skidding`      | number  | -                                                                                                                                                                  | `0`           | Offset along target         |
| `trigger`       | string  | -                                                                                                                                                                  | `hover focus` | Activation events           |
| `without-arrow` | boolean | -                                                                                                                                                                  | `false`       | Hides the arrow             |
| `show-delay`    | number  | -                                                                                                                                                                  | `150`         | Show delay (ms)             |
| `hide-delay`    | number  | -                                                                                                                                                                  | `0`           | Hide delay (ms)             |

## Dependencies

This component requires:

- [`Popup`](popup.md)

## Installation

```bash
npx kigumi add tooltip
```

---

**Documentation**: [webawesome.com/docs/components/tooltip](https://webawesome.com/docs/components/tooltip)
