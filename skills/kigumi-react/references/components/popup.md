# Popup

**Web Awesome**: `wa-popup`  
**Kigumi React**: `<Popup>`  
**Category**: Overlays  
**Tier**: free

React wrapper component for the Web Awesome `wa-popup` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-popup active anchor="value">Click me</wa-popup>
```

```tsx
// Kigumi React
import { Popup } from "@/components/ui";

<Popup active={true} anchor="value">
  Click me
</Popup>;
```

## Props

| Prop                       | Type    | Values                                                                                                                                                             | Default    | Description                     |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------------------------- |
| `active`                   | boolean | -                                                                                                                                                                  | `false`    | Activates the positioning logic |
| `anchor`                   | string  | -                                                                                                                                                                  | `-`        | Anchor element ID or reference  |
| `placement`                | string  | 'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'right' \| 'right-start' \| 'right-end' \| 'left' \| 'left-start' \| 'left-end' | `top`      | Preferred placement             |
| `strategy`                 | string  | 'absolute' \| 'fixed'                                                                                                                                              | `absolute` | Positioning strategy            |
| `distance`                 | number  | -                                                                                                                                                                  | `0`        | Distance from anchor            |
| `skidding`                 | number  | -                                                                                                                                                                  | `0`        | Offset along anchor             |
| `arrow`                    | boolean | -                                                                                                                                                                  | `false`    | Shows an arrow                  |
| `arrow-placement`          | string  | 'start' \| 'end' \| 'center' \| 'anchor'                                                                                                                           | `anchor`   | Arrow position                  |
| `arrow-padding`            | number  | -                                                                                                                                                                  | `10`       | Arrow edge padding              |
| `flip`                     | boolean | -                                                                                                                                                                  | `false`    | Flips when constrained          |
| `flip-fallback-placements` | string  | -                                                                                                                                                                  | `-`        | Fallback placements             |
| `flip-fallback-strategy`   | string  | 'best-fit' \| 'initial'                                                                                                                                            | `best-fit` | Fallback strategy               |
| `flip-padding`             | number  | -                                                                                                                                                                  | `0`        | Flip boundary padding           |
| `shift`                    | boolean | -                                                                                                                                                                  | `false`    | Shifts to stay visible          |
| `shift-padding`            | number  | -                                                                                                                                                                  | `0`        | Shift boundary padding          |
| `auto-size`                | string  | 'horizontal' \| 'vertical' \| 'both'                                                                                                                               | `-`        | Auto-resize behavior            |
| `sync`                     | string  | 'width' \| 'height' \| 'both'                                                                                                                                      | `-`        | Syncs dimensions with anchor    |
| `auto-size-padding`        | number  | -                                                                                                                                                                  | `0`        | Auto-size boundary padding      |

## Installation

```bash
npx kigumi add popup
```

---

**Documentation**: [webawesome.com/docs/components/popup](https://webawesome.com/docs/components/popup)
