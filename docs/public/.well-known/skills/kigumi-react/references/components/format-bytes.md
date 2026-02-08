# FormatBytes

**Web Awesome**: `wa-format-bytes`  
**Kigumi React**: `<FormatBytes>`  
**Category**: Formatting  
**Tier**: free

React wrapper component for the Web Awesome `wa-format-bytes` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-format-bytes value="0" unit="byte">Click me</wa-format-bytes>
```

```tsx
// Kigumi React
import { FormatBytes } from '@/components/ui';

<FormatBytes value="0" unit="byte">
  Click me
</FormatBytes>;
```

## Props

| Prop      | Type   | Values                        | Default | Description                          |
| --------- | ------ | ----------------------------- | ------- | ------------------------------------ |
| `value`   | number | -                             | `0`     | The number to format in bytes        |
| `unit`    | string | 'byte' \| 'bit'               | `byte`  | The unit to format the value in      |
| `display` | string | 'long' \| 'short' \| 'narrow' | `short` | Determines how to display the result |
| `lang`    | string | -                             | `-`     | The locale to use when formatting    |

## Installation

```bash
npx kigumi add format-bytes
```

---

**Documentation**: [webawesome.com/docs/components/format-bytes](https://webawesome.com/docs/components/format-bytes)
