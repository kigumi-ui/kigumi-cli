# Switch

**Web Awesome**: `wa-switch`  
**Kigumi React**: `<Switch>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-switch` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-switch name="value" value="value">Click me</wa-switch>
```

```tsx
// Kigumi React
import { Switch } from '@/components/ui';

<Switch name="value" value="value">
  Click me
</Switch>;
```

## Props

| Prop       | Type    | Values                         | Default  | Description               |
| ---------- | ------- | ------------------------------ | -------- | ------------------------- |
| `name`     | string  | -                              | `-`      | Form field name           |
| `value`    | string  | -                              | `-`      | Form value when checked   |
| `size`     | string  | 'small' \| 'medium' \| 'large' | `medium` | Switch size               |
| `disabled` | boolean | -                              | `false`  | Disables the switch       |
| `checked`  | boolean | -                              | `false`  | Whether the switch is on  |
| `required` | boolean | -                              | `false`  | Makes the switch required |
| `hint`     | string  | -                              | `''`     | Hint text                 |

## Installation

```bash
npx kigumi add switch
```

---

**Documentation**: [webawesome.com/docs/components/switch](https://webawesome.com/docs/components/switch)
