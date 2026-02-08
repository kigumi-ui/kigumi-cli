# Input

**Web Awesome**: `wa-input`  
**Kigumi React**: `<Input>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-input` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-input type="text" label="value">Click me</wa-input>
```

```tsx
// Kigumi React
import { Input } from '@/components/ui';

<Input type="text" label="value">
  Click me
</Input>;
```

## Props

| Prop              | Type    | Values                                                                              | Default    | Description                                  |
| ----------------- | ------- | ----------------------------------------------------------------------------------- | ---------- | -------------------------------------------- |
| `type`            | string  | 'text' \| 'email' \| 'password' \| 'number' \| 'date' \| 'tel' \| 'url' \| 'search' | `text`     | Input type                                   |
| `label`           | string  | -                                                                                   | `-`        | Accessible label for the input               |
| `hint`            | string  | -                                                                                   | `-`        | Descriptive hint text                        |
| `placeholder`     | string  | -                                                                                   | `-`        | Placeholder text                             |
| `value`           | string  | -                                                                                   | `-`        | Input value                                  |
| `appearance`      | string  | 'filled' \| 'filled-outlined' \| 'outlined'                                         | `outlined` | Visual appearance style                      |
| `size`            | string  | 'small' \| 'medium' \| 'large'                                                      | `medium`   | Input size                                   |
| `pill`            | boolean | -                                                                                   | `false`    | Gives the input rounded edges                |
| `disabled`        | boolean | -                                                                                   | `false`    | Disables the input                           |
| `with-clear`      | boolean | -                                                                                   | `false`    | Adds a clear button when input has content   |
| `password-toggle` | boolean | -                                                                                   | `false`    | Adds a toggle button for password visibility |

## Installation

```bash
npx kigumi add input
```

---

**Documentation**: [webawesome.com/docs/components/input](https://webawesome.com/docs/components/input)
