# Include

**Web Awesome**: `wa-include`  
**Kigumi Vue**: `<Include>`  
**Category**: Utilities  
**Tier**: free

Vue wrapper component for the Web Awesome `wa-include` element.

## Transformation Example

```html
<!-- Web Awesome -->
<wa-include src="value" mode="cors">Click me</wa-include>
```

```vue
<!-- Kigumi Vue -->
<script setup lang="ts">
import { Include } from '@/components/ui';
</script>

<template>
  <Include src="value" mode="cors"> Click me </Include>
</template>
```

## Props

| Prop            | Type    | Values                               | Default | Description                              |
| --------------- | ------- | ------------------------------------ | ------- | ---------------------------------------- |
| `src`           | string  | -                                    | `-`     | The location of the HTML file to include |
| `mode`          | string  | 'cors' \| 'no-cors' \| 'same-origin' | `cors`  | The fetch mode                           |
| `allow-scripts` | boolean | -                                    | `false` | Allows included scripts to be executed   |

## Events

| Event              | Vue Handler         | Type          | Description                                                   |
| ------------------ | ------------------- | ------------- | ------------------------------------------------------------- |
| `wa-load`          | `@wa-load`          | `CustomEvent` | Emitted when the included file is loaded.                     |
| `wa-include-error` | `@wa-include-error` | `CustomEvent` | Emitted when the included file fails to load due to an error. |

## Installation

```bash
npx kigumi add include
```

---

**Documentation**: [webawesome.com/docs/components/include](https://webawesome.com/docs/components/include)
