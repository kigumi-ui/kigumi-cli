# SplitPanel

**Web Awesome**: `wa-split-panel`  
**Kigumi React**: `<SplitPanel>`  
**Category**: Layout  
**Tier**: free

React wrapper component for the Web Awesome `wa-split-panel` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-split-panel position="50" position-in-pixels="value"
  >Click me</wa-split-panel
>
```

```tsx
// Kigumi React
import { SplitPanel } from '@/components/ui';

<SplitPanel position="50" position-in-pixels="value">
  Click me
</SplitPanel>;
```

## Props

| Prop                 | Type    | Values                     | Default      | Description           |
| -------------------- | ------- | -------------------------- | ------------ | --------------------- |
| `position`           | number  | -                          | `50`         | Divider position (%)  |
| `position-in-pixels` | number  | -                          | `-`          | Divider position (px) |
| `orientation`        | string  | 'horizontal' \| 'vertical' | `horizontal` | Panel orientation     |
| `primary`            | string  | 'start' \| 'end'           | `start`      | Primary panel         |
| `disabled`           | boolean | -                          | `false`      | Disables resizing     |
| `snap`               | string  | -                          | `-`          | Snap points           |
| `snap-threshold`     | number  | -                          | `12`         | Snap threshold (px)   |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add split-panel
```

---

**Documentation**: [webawesome.com/docs/components/split-panel](https://webawesome.com/docs/components/split-panel)
