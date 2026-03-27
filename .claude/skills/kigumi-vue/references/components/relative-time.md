# RelativeTime

**Web Awesome**: `wa-relative-time`  
**Kigumi Vue**: `<RelativeTime>`  
**Category**: Formatting  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-relative-time` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-relative-time date="value" format="long">Click me</wa-relative-time>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { RelativeTime } from '@/components/ui';
</script>

<template>
  <RelativeTime date="value" format="long"> Click me </RelativeTime>
</template>
```

## Props

| Prop      | Type    | Values                        | Default | Description                     |
| --------- | ------- | ----------------------------- | ------- | ------------------------------- |
| `date`    | string  | -                             | `-`     | The date/time to calculate from |
| `format`  | string  | 'long' \| 'short' \| 'narrow' | `long`  | The formatting style            |
| `numeric` | string  | 'always' \| 'auto'            | `auto`  | When to use numeric values      |
| `sync`    | boolean | -                             | `false` | Keeps time in sync              |
| `lang`    | string  | -                             | `-`     | The locale to use               |

## Installation

```bash
npx kigumi add relative-time
```

---

**Documentation**: [webawesome.com/docs/components/relative-time](https://webawesome.com/docs/components/relative-time)
