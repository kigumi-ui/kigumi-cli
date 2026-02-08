# ProgressBar

**Web Awesome**: `wa-progress-bar`  
**Kigumi React**: `<ProgressBar>`  
**Category**: Progress  
**Tier**: free

React wrapper component for the Web Awesome `wa-progress-bar` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-progress-bar value="0" indeterminate>Click me</wa-progress-bar>
```

```tsx
// Kigumi React
import { ProgressBar } from '@/components/ui';

<ProgressBar value="0" indeterminate={true}>
  Click me
</ProgressBar>;
```

## Props

| Prop            | Type    | Values | Default | Description               |
| --------------- | ------- | ------ | ------- | ------------------------- |
| `value`         | number  | -      | `0`     | Current progress (0-100)  |
| `indeterminate` | boolean | -      | `false` | Shows indeterminate state |
| `label`         | string  | -      | `''`    | Accessible label          |

## Installation

```bash
npx kigumi add progress-bar
```

---

**Documentation**: [webawesome.com/docs/components/progress-bar](https://webawesome.com/docs/components/progress-bar)
