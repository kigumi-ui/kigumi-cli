# Option

**Web Awesome**: `wa-option`  
**Kigumi React**: `<Option>`  
**Category**: Form Controls  
**Tier**: free

React wrapper component for the Web Awesome `wa-option` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-option value="''" disabled>Click me</wa-option>
```

```tsx
// Kigumi React
import { Option } from '@/components/ui';

<Option value="''" disabled={true}>
  Click me
</Option>;
```

## Props

| Prop       | Type    | Values | Default | Description         |
| ---------- | ------- | ------ | ------- | ------------------- |
| `value`    | string  | -      | `''`    | The option value    |
| `disabled` | boolean | -      | `false` | Disables the option |

## Dependencies

This component requires:

- [`Icon`](icon.md)

## Installation

```bash
npx kigumi add option
```

---

**Documentation**: [webawesome.com/docs/components/option](https://webawesome.com/docs/components/option)
