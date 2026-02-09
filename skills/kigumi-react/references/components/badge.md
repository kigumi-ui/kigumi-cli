# Badge

**Web Awesome**: `wa-badge`  
**Kigumi React**: `<Badge>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-badge` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-badge variant="brand" appearance="accent">Click me</wa-badge>
```

```tsx
// Kigumi React
import { Badge } from "@/components/ui";

<Badge variant="brand" appearance="accent">
  Click me
</Badge>;
```

## Props

| Prop         | Type    | Values                                                     | Default  | Description                                      |
| ------------ | ------- | ---------------------------------------------------------- | -------- | ------------------------------------------------ |
| `variant`    | string  | 'brand' \| 'neutral' \| 'success' \| 'warning' \| 'danger' | `brand`  | The badge's theme variant                        |
| `appearance` | string  | 'accent' \| 'filled' \| 'outlined' \| 'filled-outlined'    | `accent` | The badge's visual appearance                    |
| `pill`       | boolean | -                                                          | `false`  | Draws a pill-style badge with rounded edges      |
| `attention`  | string  | 'none' \| 'pulse' \| 'bounce'                              | `none`   | Adds an animation to draw attention to the badge |

## Installation

```bash
npx kigumi add badge
```

---

**Documentation**: [webawesome.com/docs/components/badge](https://webawesome.com/docs/components/badge)
