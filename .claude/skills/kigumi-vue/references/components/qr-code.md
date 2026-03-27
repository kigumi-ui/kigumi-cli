# QrCode

**Web Awesome**: `wa-qr-code`  
**Kigumi Vue**: `<QrCode>`  
**Category**: Display  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-qr-code` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-qr-code value="''" label="''">Click me</wa-qr-code>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { QrCode } from '@/components/ui';
</script>

<template>
  <QrCode value="''" label="''"> Click me </QrCode>
</template>
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

## CSS Parts

| Part   | Description                   |
| ------ | ----------------------------- |
| `base` | The component's base wrapper. |

## Installation

```bash
npx kigumi add qr-code
```

---

**Documentation**: [webawesome.com/docs/components/qr-code](https://webawesome.com/docs/components/qr-code)
