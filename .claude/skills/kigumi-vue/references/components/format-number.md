# FormatNumber

**Web Awesome**: `wa-format-number`  
**Kigumi Vue**: `<FormatNumber>`  
**Category**: Formatting  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-format-number` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-format-number value="0" type="currency">Click me</wa-format-number>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { FormatNumber } from '@/components/ui';
</script>

<template>
  <FormatNumber value="0" type="currency"> Click me </FormatNumber>
</template>
```

## Props

| Prop                         | Type    | Values                                         | Default   | Description                       |
| ---------------------------- | ------- | ---------------------------------------------- | --------- | --------------------------------- |
| `value`                      | number  | -                                              | `0`       | The number to format              |
| `type`                       | string  | 'currency' \| 'decimal' \| 'percent'           | `decimal` | The formatting style              |
| `currency`                   | string  | -                                              | `USD`     | The currency to use (ISO 4217)    |
| `currency-display`           | string  | 'symbol' \| 'narrowSymbol' \| 'code' \| 'name' | `symbol`  | How to display the currency       |
| `minimum-integer-digits`     | number  | -                                              | `-`       | Minimum integer digits            |
| `minimum-fraction-digits`    | number  | -                                              | `-`       | Minimum fraction digits           |
| `maximum-fraction-digits`    | number  | -                                              | `-`       | Maximum fraction digits           |
| `minimum-significant-digits` | number  | -                                              | `-`       | Minimum significant digits        |
| `maximum-significant-digits` | number  | -                                              | `-`       | Maximum significant digits        |
| `without-grouping`           | boolean | -                                              | `false`   | Disables grouping separators      |
| `lang`                       | string  | -                                              | `-`       | The locale to use when formatting |

## Installation

```bash
npx kigumi add format-number
```

---

**Documentation**: [webawesome.com/docs/components/format-number](https://webawesome.com/docs/components/format-number)
