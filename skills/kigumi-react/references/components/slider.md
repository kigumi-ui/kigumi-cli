# Slider

**Web Awesome**: `wa-slider`  
**Kigumi React**: `<Slider>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-slider` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-slider name="''" value="0">Click me</wa-slider>
```

```tsx
// Kigumi React
import { Slider } from "@/components/ui";

<Slider name="''" value="0">
  Click me
</Slider>;
```

## Props

| Prop       | Type    | Values                      | Default | Description         |
| ---------- | ------- | --------------------------- | ------- | ------------------- |
| `name`     | string  | -                           | `''`    | Form field name     |
| `value`    | number  | -                           | `0`     | Current value       |
| `label`    | string  | -                           | `''`    | Accessible label    |
| `hint`     | string  | -                           | `''`    | Hint text           |
| `min`      | number  | -                           | `0`     | Minimum value       |
| `max`      | number  | -                           | `100`   | Maximum value       |
| `step`     | number  | -                           | `1`     | Step increment      |
| `tooltip`  | string  | 'top' \| 'bottom' \| 'none' | `top`   | Tooltip position    |
| `disabled` | boolean | -                           | `false` | Disables the slider |

## Installation

```bash
npx kigumi add slider
```

---

**Documentation**: [webawesome.com/docs/components/slider](https://webawesome.com/docs/components/slider)
