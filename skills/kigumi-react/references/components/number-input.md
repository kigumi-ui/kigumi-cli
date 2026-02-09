# NumberInput

**Web Awesome**: `wa-number-input`  
**Kigumi React**: `<NumberInput>`  
**Category**: Form Controls  
**Tier**: pro

React wrapper component for the Web Awesome `wa-number-input` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-number-input label="value" hint="value">Click me</wa-number-input>
```

```tsx
// Kigumi React
import { NumberInput } from "@/components/ui";

<NumberInput label="value" hint="value">
  Click me
</NumberInput>;
```

## Props

| Prop              | Type    | Values                                      | Default    | Description            |
| ----------------- | ------- | ------------------------------------------- | ---------- | ---------------------- |
| `label`           | string  | -                                           | `-`        | Accessible label       |
| `hint`            | string  | -                                           | `-`        | Descriptive hint text  |
| `value`           | number  | -                                           | `-`        | Current value          |
| `min`             | number  | -                                           | `-`        | Minimum value          |
| `max`             | number  | -                                           | `-`        | Maximum value          |
| `step`            | number  | -                                           | `1`        | Step increment         |
| `disabled`        | boolean | -                                           | `false`    | Disables the input     |
| `required`        | boolean | -                                           | `false`    | Makes field mandatory  |
| `placeholder`     | string  | -                                           | `-`        | Placeholder text       |
| `size`            | string  | 'small' \| 'medium' \| 'large'              | `medium`   | Input size             |
| `appearance`      | string  | 'filled' \| 'outlined' \| 'filled-outlined' | `outlined` | Visual appearance      |
| `no-spin-buttons` | boolean | -                                           | `false`    | Hides the spin buttons |

## Installation

```bash
npx kigumi add number-input
```

---

**Documentation**: [webawesome.com/docs/components/number-input](https://webawesome.com/docs/components/number-input)
