# RadioGroup

**Web Awesome**: `wa-radio-group`  
**Kigumi React**: `<RadioGroup>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-radio-group` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-radio-group label="''" hint="''">Click me</wa-radio-group>
```

```tsx
// Kigumi React
import { RadioGroup } from "@/components/ui";

<RadioGroup label="''" hint="''">
  Click me
</RadioGroup>;
```

## Props

| Prop       | Type    | Values                         | Default  | Description              |
| ---------- | ------- | ------------------------------ | -------- | ------------------------ |
| `label`    | string  | -                              | `''`     | Group label              |
| `hint`     | string  | -                              | `''`     | Hint text                |
| `name`     | string  | -                              | `option` | Form field name          |
| `value`    | string  | -                              | `''`     | Selected value           |
| `size`     | string  | 'small' \| 'medium' \| 'large' | `medium` | Radio size               |
| `required` | boolean | -                              | `false`  | Makes selection required |

## Dependencies

This component requires:

- [`ButtonGroup`](button-group.md)

## Installation

```bash
npx kigumi add radio-group
```

---

**Documentation**: [webawesome.com/docs/components/radio-group](https://webawesome.com/docs/components/radio-group)
