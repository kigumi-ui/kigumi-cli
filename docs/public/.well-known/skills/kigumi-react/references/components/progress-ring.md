# ProgressRing

**Web Awesome**: `wa-progress-ring`  
**Kigumi React**: `<ProgressRing>`  
**Category**: Progress  
**Tier**: free

React wrapper component for the Web Awesome `wa-progress-ring` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-progress-ring value="0" label="''">Click me</wa-progress-ring>
```

```tsx
// Kigumi React
import { ProgressRing } from '@/components/ui';

<ProgressRing value="0" label="''">
  Click me
</ProgressRing>;
```

## Props

| Prop    | Type   | Values | Default | Description              |
| ------- | ------ | ------ | ------- | ------------------------ |
| `value` | number | -      | `0`     | Current progress (0-100) |
| `label` | string | -      | `''`    | Accessible label         |

## Installation

```bash
npx kigumi add progress-ring
```

---

**Documentation**: [webawesome.com/docs/components/progress-ring](https://webawesome.com/docs/components/progress-ring)
