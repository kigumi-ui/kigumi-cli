# Checkbox

**Web Awesome**: `wa-checkbox`  
**Kigumi React**: `<Checkbox>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-checkbox` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-checkbox checked disabled>Click me</wa-checkbox>
```

```tsx
// Kigumi React
import { Checkbox } from '@/components/ui';

<Checkbox checked={true} disabled={true}>
  Click me
</Checkbox>;
```

## Props

| Prop            | Type    | Values                         | Default  | Description                     |
| --------------- | ------- | ------------------------------ | -------- | ------------------------------- |
| `checked`       | boolean | -                              | `false`  | Draws checkbox in checked state |
| `disabled`      | boolean | -                              | `false`  | Disables the checkbox           |
| `hint`          | string  | -                              | `''`     | Descriptive helper text         |
| `indeterminate` | boolean | -                              | `false`  | Mixed/parent selection state    |
| `name`          | string  | -                              | `''`     | Form submission identifier      |
| `required`      | boolean | -                              | `false`  | Makes field mandatory           |
| `size`          | string  | 'small' \| 'medium' \| 'large' | `medium` | Adjusts checkbox dimensions     |
| `value`         | string  | -                              | `-`      | Form submission value           |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add checkbox
```

---

**Documentation**: [webawesome.com/docs/components/checkbox](https://webawesome.com/docs/components/checkbox)
