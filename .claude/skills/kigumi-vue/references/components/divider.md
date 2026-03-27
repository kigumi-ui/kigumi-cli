# Divider

**Web Awesome**: `wa-divider`  
**Kigumi Vue**: `<Divider>`  
**Category**: Layout  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-divider` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-divider orientation="horizontal">Click me</wa-divider>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Divider } from '@/components/ui';
</script>

<template>
  <Divider orientation="horizontal"> Click me </Divider>
</template>
```

## Props

| Prop          | Type   | Values                     | Default      | Description         |
| ------------- | ------ | -------------------------- | ------------ | ------------------- |
| `orientation` | string | 'horizontal' \| 'vertical' | `horizontal` | Divider orientation |

## CSS Custom Properties

| Property    | Default | Description                 |
| ----------- | ------- | --------------------------- |
| `--color`   | -       | The color of the divider.   |
| `--width`   | -       | The width of the divider.   |
| `--spacing` | -       | The spacing of the divider. |

## Installation

```bash
npx kigumi add divider
```

---

**Documentation**: [webawesome.com/docs/components/divider](https://webawesome.com/docs/components/divider)
