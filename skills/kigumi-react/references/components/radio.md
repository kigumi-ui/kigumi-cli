# Radio

**Web Awesome**: `wa-radio`  
**Kigumi React**: `<Radio>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-radio` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-radio value="value" disabled>Click me</wa-radio>
```

```tsx
// Kigumi React
import { Radio } from '@/components/ui';

<Radio value="value" disabled={true}>
  Click me
</Radio>;
```

## Props

| Prop       | Type    | Values                         | Default  | Description        |
| ---------- | ------- | ------------------------------ | -------- | ------------------ |
| `value`    | string  | -                              | `-`      | The radio value    |
| `disabled` | boolean | -                              | `false`  | Disables the radio |
| `size`     | string  | 'small' \| 'medium' \| 'large' | `medium` | Radio size         |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add radio
```

---

**Documentation**: [webawesome.com/docs/components/radio](https://webawesome.com/docs/components/radio)
