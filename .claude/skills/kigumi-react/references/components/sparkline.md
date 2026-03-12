# Sparkline

**Web Awesome**: `wa-sparkline`  
**Kigumi React**: `<Sparkline>`  
**Category**: Display  
**Tier**: pro

React wrapper component for the Web Awesome `wa-sparkline` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-sparkline data="value" type="line">Click me</wa-sparkline>
```

```tsx
// Kigumi React
import { Sparkline } from '@/components/ui';

<Sparkline data="value" type="line">
  Click me
</Sparkline>;
```

## Props

| Prop           | Type    | Values                    | Default | Description                               |
| -------------- | ------- | ------------------------- | ------- | ----------------------------------------- |
| `data`         | string  | -                         | `-`     | Comma-separated data points or JSON array |
| `type`         | string  | 'line' \| 'bar' \| 'area' | `line`  | Chart type                                |
| `width`        | number  | -                         | `-`     | Width in pixels                           |
| `height`       | number  | -                         | `-`     | Height in pixels                          |
| `color`        | string  | -                         | `-`     | Line/bar color                            |
| `fill-color`   | string  | -                         | `-`     | Fill color (for area type)                |
| `line-width`   | number  | -                         | `2`     | Line width in pixels                      |
| `show-tooltip` | boolean | -                         | `false` | Shows value tooltip on hover              |

## Installation

```bash
npx kigumi add sparkline
```

---

**Documentation**: [webawesome.com/docs/components/sparkline](https://webawesome.com/docs/components/sparkline)
