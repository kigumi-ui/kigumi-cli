# QrCode

**Web Awesome**: `wa-qr-code`  
**Kigumi React**: `<QrCode>`  
**Category**: Display  
**Tier**: free

React wrapper component for the Web Awesome `wa-qr-code` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-qr-code value="''" label="''">Click me</wa-qr-code>
```

```tsx
// Kigumi React
import { QrCode } from '@/components/ui';

<QrCode value="''" label="''">
  Click me
</QrCode>;
```

## Props

| Prop               | Type   | Values                   | Default | Description            |
| ------------------ | ------ | ------------------------ | ------- | ---------------------- |
| `value`            | string | -                        | `''`    | The data to encode     |
| `label`            | string | -                        | `''`    | Accessible label       |
| `size`             | number | -                        | `128`   | Size in pixels         |
| `fill`             | string | -                        | `black` | Fill color             |
| `background`       | string | -                        | `white` | Background color       |
| `radius`           | number | -                        | `0`     | Corner radius          |
| `error-correction` | string | 'L' \| 'M' \| 'Q' \| 'H' | `H`     | Error correction level |

## Installation

```bash
npx kigumi add qr-code
```

---

**Documentation**: [webawesome.com/docs/components/qr-code](https://webawesome.com/docs/components/qr-code)
